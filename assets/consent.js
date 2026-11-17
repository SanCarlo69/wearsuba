/* SUBA / WearSUBA – Cookie-Hinweis und Einwilligung
   Läuft auf allen Seiten (auch Impressum, AGB, Datenschutz, Konfigurator).
   - Notwendig: speichert nur die Auswahl selbst (localStorage "wearsuba_cookie_consent").
   - Statistik: Vercel Web Analytics wird erst NACH Zustimmung geladen.
   Einstellungen jederzeit wieder öffnen: jedes Element mit dem Attribut data-cookie-settings. */
(function () {
  "use strict";
  var KEY = "wearsuba_cookie_consent";
  function read() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function store(v) { try { localStorage.setItem(KEY, v); localStorage.setItem("wearsuba_cookie_date", new Date().toISOString()); } catch (e) {} }
  function statistik(v) { return v === "all" || v === "analytics"; }

  /* Sprache wie in suba.js: Dateiname -en, sonst ?lang=, sonst gespeicherte Wahl */
  var file = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  var statisch = /^(index|impressum|agb|datenschutz)(-en)?(\.html)?$/.test(file) || file === "";
  var EN = /-en(\.html)?$/.test(file);
  if (!statisch && !EN) {
    var q = (location.search.match(/[?&]lang=(de|en)/) || [])[1];
    if (q) EN = q === "en"; else { try { EN = localStorage.getItem("suba_lang") === "en"; } catch (e) {} }
  }
  var T = EN ? {
    aria: "Cookie notice", title: "Cookies and statistics",
    desc: "We only use what is needed to run the website. With your consent we also count visits anonymously (Vercel Web Analytics, no cookies, no advertising). More in our ",
    ds: "privacy policy", dsUrl: "datenschutz-en.html",
    nec: "Necessary only", all: "Accept all", set: "Settings",
    mt: "Cookie settings", mp: "Choose what we may use. You can change this at any time via \"Cookie settings\" at the bottom of the page.",
    c1: "Necessary", c1d: "Required for the website to work, e.g. to remember this choice. Cannot be switched off.",
    c2: "Statistics", c2d: "Anonymous visitor statistics with Vercel Web Analytics. No cookies, no cross-site tracking, no advertising.",
    save: "Save selection"
  } : {
    aria: "Cookie-Hinweis", title: "Cookies und Statistik",
    desc: "Wir nutzen nur, was für den Betrieb der Website nötig ist. Mit deiner Zustimmung zählen wir zusätzlich anonym die Besuche (Vercel Web Analytics, ohne Cookies, ohne Werbung). Mehr dazu in unserer ",
    ds: "Datenschutzerklärung", dsUrl: "datenschutz.html",
    nec: "Nur notwendige", all: "Alle akzeptieren", set: "Einstellungen",
    mt: "Cookie-Einstellungen", mp: "Wähle, was wir nutzen dürfen. Du kannst das jederzeit unten auf der Seite unter «Cookie-Einstellungen» ändern.",
    c1: "Notwendig", c1d: "Für den Betrieb der Website nötig, z. B. um diese Auswahl zu speichern. Kann nicht deaktiviert werden.",
    c2: "Statistik", c2d: "Anonyme Besucherstatistik mit Vercel Web Analytics. Ohne Cookies, ohne seitenübergreifendes Tracking, ohne Werbung.",
    save: "Auswahl speichern"
  };

  var geladen = false;
  function ladeStatistik() {
    if (geladen) return; geladen = true;
    window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
    var s = document.createElement("script"); s.defer = true; s.src = "/_vercel/insights/script.js";
    document.head.appendChild(s);
  }

  var CSS =
    "#cookie-banner{position:fixed;left:0;right:0;bottom:0;z-index:300;background:#fff;color:#0a0a0a;border-top:1px solid #e5e5e5;box-shadow:0 -6px 24px rgba(0,0,0,.08);padding:18px clamp(16px,4vw,48px);display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;transform:translateY(110%);transition:transform .35s ease;font-family:'Futura PT','Futura','Jost','Century Gothic',sans-serif;text-align:left}" +
    "#cookie-banner.show{transform:none}" +
    "#cookie-banner .cb-text{flex:1;min-width:240px}#cookie-banner .cb-title{font-size:14px;font-weight:700;margin-bottom:4px}" +
    "#cookie-banner .cb-desc{font-size:12px;line-height:1.5;color:#555;max-width:680px}#cookie-banner .cb-desc a{color:#0a0a0a}" +
    "#cookie-banner .cb-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}" +
    ".cb-btn{min-height:40px;padding:0 18px;font:inherit;font-size:12px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;cursor:pointer;border:1px solid #0a0a0a;border-radius:0}" +
    ".cb-accept{background:#0a0a0a;color:#fff}.cb-necessary{background:#fff;color:#0a0a0a}" +
    ".cb-settings{background:none;border:0;color:#0a0a0a;font:inherit;font-size:12px;text-decoration:underline;cursor:pointer;margin-left:4px}" +
    "#cookie-modal{position:fixed;inset:0;z-index:400;background:rgba(0,0,0,.45);display:none;align-items:center;justify-content:center;padding:16px;font-family:'Futura PT','Futura','Jost','Century Gothic',sans-serif;color:#0a0a0a;text-align:left}" +
    "#cookie-modal.open{display:flex}" +
    "#cookie-modal .cm-box{background:#fff;max-width:520px;width:100%;max-height:90vh;overflow:auto}" +
    "#cookie-modal .cm-header{padding:24px 26px 16px;border-bottom:1px solid #e5e5e5}#cookie-modal .cm-header h3{font-size:18px;font-weight:700;margin:0}" +
    "#cookie-modal .cm-header p{font-size:12.5px;line-height:1.5;color:#555;margin:6px 0 0}" +
    "#cookie-modal .cm-body{padding:8px 26px}#cookie-modal .cm-category{padding:14px 0;border-bottom:1px solid #e5e5e5}#cookie-modal .cm-category:last-child{border-bottom:0}" +
    "#cookie-modal .cm-cat-header{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:4px}" +
    "#cookie-modal .cm-cat-name{font-size:13px;font-weight:600}#cookie-modal .cm-cat-desc{font-size:12px;line-height:1.5;color:#555}" +
    "#cookie-modal .toggle{position:relative;width:42px;height:24px;flex-shrink:0}" +
    "#cookie-modal .toggle input{position:absolute;inset:0;opacity:0;margin:0;cursor:pointer;z-index:1}" +
    "#cookie-modal .toggle-slider{position:absolute;inset:0;background:#d4d4d4;border-radius:24px;transition:background .2s}" +
    "#cookie-modal .toggle-slider::before{content:'';position:absolute;width:18px;height:18px;left:3px;top:3px;background:#fff;border-radius:50%;transition:transform .2s}" +
    "#cookie-modal .toggle input:checked+.toggle-slider{background:#0a0a0a}#cookie-modal .toggle input:checked+.toggle-slider::before{transform:translateX(18px)}" +
    "#cookie-modal .toggle input:disabled+.toggle-slider{opacity:.5}#cookie-modal .toggle input:focus-visible+.toggle-slider{outline:2px solid #0a0a0a;outline-offset:2px}" +
    "#cookie-modal .cm-footer{display:flex;gap:8px;padding:16px 26px 24px;border-top:1px solid #e5e5e5}" +
    ".cm-save,.cm-accept-all{flex:1;min-height:42px;font:inherit;font-size:12px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;cursor:pointer;border:1px solid #0a0a0a;border-radius:0}" +
    ".cm-save{background:#fff;color:#0a0a0a}.cm-accept-all{background:#0a0a0a;color:#fff}" +
    "@media(max-width:560px){#cookie-banner .cb-actions{width:100%}#cookie-banner .cb-btn{flex:1}#cookie-modal .cm-footer{flex-direction:column}}";

  function aufbauen() {
    if (document.getElementById("cookie-banner")) return;
    var st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
    var w = document.createElement("div");
    w.innerHTML =
      '<div id="cookie-banner" role="dialog" aria-label="' + T.aria + '"><div class="cb-text"><div class="cb-title">' + T.title + '</div>' +
      '<div class="cb-desc">' + T.desc + '<a href="' + T.dsUrl + '">' + T.ds + '</a>.</div></div>' +
      '<div class="cb-actions"><button class="cb-btn cb-necessary" type="button" data-c="necessary">' + T.nec + '</button>' +
      '<button class="cb-btn cb-accept" type="button" data-c="all">' + T.all + '</button>' +
      '<button class="cb-settings" type="button" data-cookie-settings>' + T.set + '</button></div></div>' +
      '<div id="cookie-modal" role="dialog" aria-modal="true" aria-labelledby="cm-t"><div class="cm-box"><div class="cm-header"><h3 id="cm-t">' + T.mt + '</h3><p>' + T.mp + '</p></div><div class="cm-body">' +
      '<div class="cm-category"><div class="cm-cat-header"><div class="cm-cat-name">' + T.c1 + '</div><label class="toggle"><input type="checkbox" checked disabled aria-label="' + T.c1 + '"><span class="toggle-slider"></span></label></div><div class="cm-cat-desc">' + T.c1d + '</div></div>' +
      '<div class="cm-category"><div class="cm-cat-header"><div class="cm-cat-name">' + T.c2 + '</div><label class="toggle"><input type="checkbox" id="toggle-analytics" aria-label="' + T.c2 + '"><span class="toggle-slider"></span></label></div><div class="cm-cat-desc">' + T.c2d + '</div></div>' +
      '</div><div class="cm-footer"><button class="cm-save" type="button" data-save>' + T.save + '</button><button class="cm-accept-all" type="button" data-c="all">' + T.all + '</button></div></div></div>';
    while (w.firstChild) document.body.appendChild(w.firstChild);
    var banner = document.getElementById("cookie-banner"), modal = document.getElementById("cookie-modal");
    function zu() { banner.classList.remove("show"); modal.classList.remove("open"); }
    function wahl(v) {
      var vorher = statistik(read());
      store(v); zu();
      if (statistik(v)) ladeStatistik();
      else if (vorher) location.reload(); /* Widerruf: Seite ohne Statistik neu laden */
    }
    if (!read()) setTimeout(function () { banner.classList.add("show"); }, 600);
    document.addEventListener("click", function (e) {
      var t = e.target.closest && e.target.closest("[data-c],[data-cookie-settings],[data-save]");
      if (!t) { if (e.target === modal) modal.classList.remove("open"); return; }
      e.preventDefault();
      if (t.hasAttribute("data-c")) wahl(t.getAttribute("data-c"));
      else if (t.hasAttribute("data-save")) wahl(document.getElementById("toggle-analytics").checked ? "analytics" : "necessary");
      else { document.getElementById("toggle-analytics").checked = statistik(read()); modal.classList.add("open"); }
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") modal.classList.remove("open"); });
  }

  if (statistik(read())) ladeStatistik();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", aufbauen); else aufbauen();
  window.SUBA_CONSENT = { statistik: function () { return statistik(read()); } };
})();
