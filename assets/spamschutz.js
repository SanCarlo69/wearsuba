/* SUBA / WearSUBA – Spamschutz und Versand für das Kontaktformular (#contactForm)
   Drei Schutzschichten:
   1. Honeypot: unsichtbares Feld "_gotcha". Bots füllen es aus, Formspree verwirft solche Anfragen.
   2. Zeitsperre: Wer schneller als 3 Sekunden absendet, ist ein Bot. Die Anfrage wird nicht verschickt.
   3. Captcha: Cloudflare Turnstile (meist unsichtbar, ohne Bilderrätsel, ohne Cookies).
      Aktiv, sobald unten TURNSTILE_SITEKEY eingetragen ist und der Secret Key in Formspree hinterlegt ist.
      Anleitung: SPAMSCHUTZ.md */
(function () {
  "use strict";

  var TURNSTILE_SITEKEY = ""; /* z. B. "0x4AAAAAAA..." aus dem Cloudflare-Dashboard */

  var form = document.getElementById("contactForm");
  if (!form) return;
  var EN = (document.documentElement.lang || "").slice(0, 2) === "en";
  var T = EN ? {
    send: "Send enquiry →", sending: "Sending...", err: "Error – please try again",
    robot: "Please confirm briefly that you are human.", links: "Please send fewer links – max. 3.",
    note: 'By sending, you agree that we process your details to answer your enquiry. More in our <a href="datenschutz-en.html">privacy policy</a>.'
  } : {
    send: "Anfrage absenden →", sending: "Wird gesendet...", err: "Fehler – bitte erneut versuchen",
    robot: "Bitte bestätige kurz, dass du kein Roboter bist.", links: "Bitte schick höchstens 3 Links mit.",
    note: 'Mit dem Absenden bist du einverstanden, dass wir deine Angaben zur Beantwortung deiner Anfrage verarbeiten. Mehr dazu in unserer <a href="datenschutz.html">Datenschutzerklärung</a>.'
  };
  var btn = document.getElementById("submitBtn");
  var start = Date.now();

  /* 1. Honeypot */
  var hp = document.createElement("div");
  hp.setAttribute("aria-hidden", "true");
  hp.style.cssText = "position:absolute!important;left:-10000px!important;top:auto;width:1px;height:1px;overflow:hidden";
  hp.innerHTML = '<label>Bitte leer lassen<input type="text" name="_gotcha" tabindex="-1" autocomplete="off"></label>';
  form.appendChild(hp);

  /* Hinweis und Fehlermeldung */
  var msg = document.createElement("div");
  msg.setAttribute("role", "alert");
  msg.style.cssText = "display:none;font-size:13px;color:#8a0000;background:#fdeeee;border:1px solid #f0b4b4;padding:10px 12px;margin:0 0 12px";
  btn.parentNode.insertBefore(msg, btn);
  var note = document.createElement("p");
  note.style.cssText = "font-size:11.5px;line-height:1.5;color:inherit;opacity:.65;margin:12px 0 0";
  note.innerHTML = T.note;
  var na = note.querySelector("a"); if (na) na.style.color = "inherit";
  form.appendChild(note);
  function zeige(t) { msg.textContent = t; msg.style.display = t ? "block" : "none"; }

  /* 3. Turnstile, erst laden, wenn das Formular in Sicht kommt */
  var box = null, widget = null;
  if (TURNSTILE_SITEKEY) {
    box = document.createElement("div");
    box.style.cssText = "margin:4px 0 14px;min-height:0";
    btn.parentNode.insertBefore(box, msg);
    var laden = function () {
      if (laden.done) return; laden.done = true;
      window.subaTurnstileReady = function () {
        widget = window.turnstile.render(box, {
          sitekey: TURNSTILE_SITEKEY, theme: "light", language: EN ? "en" : "de",
          appearance: "interaction-only", "response-field-name": "cf-turnstile-response",
          callback: function () { zeige(""); }
        });
      };
      var s = document.createElement("script");
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=subaTurnstileReady";
      s.async = true; s.defer = true;
      document.head.appendChild(s);
    };
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) { if (es.some(function (x) { return x.isIntersecting; })) { io.disconnect(); laden(); } }, { rootMargin: "400px" });
      io.observe(form);
    } else laden();
    form.addEventListener("focusin", laden);
  }

  function token() {
    var f = form.querySelector('[name="cf-turnstile-response"]');
    return f ? f.value : "";
  }
  function fertig() {
    form.style.display = "none";
    var ok = document.getElementById("formSuccess"); if (ok) ok.style.display = "block";
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    zeige("");
    /* 2. Zeitsperre und Honeypot: Bot bekommt eine Erfolgsmeldung, es wird nichts verschickt */
    var gotcha = form.querySelector('[name="_gotcha"]');
    if (Date.now() - start < 3000 || (gotcha && gotcha.value)) { fertig(); return; }
    var text = (form.querySelector('[name="Nachricht"]') || {}).value || "";
    if ((text.match(/https?:\/\/|www\./gi) || []).length > 3) { zeige(T.links); return; }
    if (TURNSTILE_SITEKEY && !token()) { zeige(T.robot); return; }

    btn.textContent = T.sending; btn.disabled = true;
    fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } })
      .then(function (r) {
        if (r.ok) { fertig(); return; }
        return r.json().catch(function () { return {}; }).then(function (d) {
          var m = d && d.errors && d.errors[0] && d.errors[0].message;
          throw new Error(m || "");
        });
      })
      .catch(function (err) {
        btn.textContent = T.send; btn.disabled = false;
        zeige(T.err + (err && err.message ? " (" + err.message + ")" : ""));
        if (widget !== null && window.turnstile) window.turnstile.reset(widget);
      });
  }, true);
})();
