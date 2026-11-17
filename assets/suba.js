/* SUBA / WearSUBA – gemeinsame Logik aller Seiten.
   Alle Produkte, Bereiche, Kategorien und Konfiguratoren kommen aus data/katalog.json.
   Neue Produkte oder Konfiguratoren werden nur dort eingetragen, nicht hier. */
(function () {
  "use strict";
  var DATA = null, IDX = {};
  function kfOn() { return !!(DATA && DATA.konfiguratoren_sichtbar === true); }
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var param = function (k) { return new URLSearchParams(location.search).get(k); };
  var q = function (o) { var u = new URLSearchParams(); Object.keys(o).forEach(function (k) { if (o[k]) u.set(k, o[k]); }); var s = u.toString(); return s ? "?" + s : ""; };
  /* ---------- Sprache (Deutsch / Englisch) ---------- */
  var STATIC_PAGES = ["index", "start", "impressum", "agb", "datenschutz"];
  var FILE = location.pathname.split("/").pop() || "index.html";
  var LANG = (function () {
    var m = FILE.match(/^([a-z]+)(-en)?\.html$/), p = param("lang");
    var l;
    if (m && STATIC_PAGES.indexOf(m[1]) > -1) l = m[2] ? "en" : "de";
    else if (p === "en" || p === "de") l = p;
    else l = read("suba_lang") || "de";
    store("suba_lang", l);
    document.documentElement.lang = l;
    return l;
  })();
  var EN = LANG === "en";
  /* Seitenadresse in der anderen Sprache */
  function langUrl(l) {
    var m = FILE.match(/^([a-z]+)(-en)?\.html$/), hash = location.hash || "";
    if (m && STATIC_PAGES.indexOf(m[1]) > -1) {
      var base = m[1] === "start" ? "index" : m[1];
      return (l === "en" ? base + "-en.html" : (m[1] === "start" ? FILE : base + ".html")) + location.search + hash;
    }
    var u = new URLSearchParams(location.search); u.set("lang", l);
    return FILE + "?" + u.toString() + hash;
  }
  function langSwitch() {
    return '<div class="lang-sw" role="group" aria-label="' + (EN ? "Language" : "Sprache") + '">' +
      "<a href='" + esc(langUrl("de")) + "' hreflang=\"de\" lang=\"de\"" + (EN ? "" : ' class="on" aria-current="true"') + ' data-lang="de">DE</a>' +
      "<a href='" + esc(langUrl("en")) + "' hreflang=\"en\" lang=\"en\"" + (EN ? ' class="on" aria-current="true"' : "") + ' data-lang="en">EN</a></div>';
  }
  /* Übersetzung der festen Texte. Produkttexte kommen aus data/katalog.en.json. */
  var UI = window.SUBA_UI_EN || [];
  var UI_SORTED = UI.slice().sort(function (a, b) { return b[0].length - a[0].length; });
  var UI_MAP = {}; UI.forEach(function (x) { UI_MAP[x[0]] = x[1]; });
  function T(s) { return EN && UI_MAP[s] != null ? UI_MAP[s] : s; }
  function tr(h) {
    if (!EN || !h) return h;
    UI_SORTED.forEach(function (x) { if (h.indexOf(x[0]) > -1) h = h.split(x[0]).join(x[1]); });
    return h.replace(/href="(index|start|impressum|agb|datenschutz)\.html/g, function (all, n) { return 'href="' + (n === "start" ? "index" : n) + '-en.html'; });
  }
  function html(el, h) { if (el) el.innerHTML = tr(h); }
  var CHEV = '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M3 1l4 4-4 4"/></svg>';
  var ICON = {
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/></svg>',
    mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5.5" width="18" height="13"/><path d="M3.5 6l8.5 7 8.5-7"/></svg>',
    menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>'
  };

  /* ---------- Daten ---------- */
  function load() {
    if (DATA) return Promise.resolve(DATA);
    return fetch(EN ? "data/katalog.en.json" : "data/katalog.json", { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error("katalog.json nicht gefunden");
      return r.json();
    }).then(function (d) {
      DATA = d;
      var aus = d.kategorien_ausgeblendet || [];
      if (aus.length) { d.produkte = d.produkte.filter(function (p) { return aus.indexOf(p.kategorie) < 0; }); d.kategorien = d.kategorien.filter(function (k) { return aus.indexOf(k.id) < 0; }); }
      IDX.bereich = {}; d.bereiche.forEach(function (b) { IDX.bereich[b.id] = b; });
      IDX.kat = {}; d.kategorien.forEach(function (k) { IDX.kat[k.id] = k; });
      if (d.konfiguratoren_sichtbar !== true) d.konfiguratoren = [];
      IDX.kf = {}; d.konfiguratoren.forEach(function (k) { IDX.kf[k.id] = k; });
      IDX.prod = {}; d.produkte.forEach(function (p) { IDX.prod[p.id] = p; });
      return d;
    });
  }
  function norm(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  function produkteIn(bereich, kat, such) {
    var t = such ? norm(such).split(/\s+/).filter(Boolean) : null;
    return DATA.produkte.filter(function (p) {
      if (bereich && p.bereiche.indexOf(bereich) < 0) return false;
      if (kat && p.kategorie !== kat) return false;
      if (t) {
        var hay = norm([p.name, p.kurz, p.text, IDX.kat[p.kategorie].name].concat(p.daten.map(function (d) { return d.wert; })).join(" "));
        return t.every(function (w) { return hay.indexOf(w) > -1; });
      }
      return true;
    });
  }
  function kfLive(kf) { return kf && kf.aktiv && kf.url; }
  function topKats(b, n) {
    return DATA.kategorien.map(function (k) { return { k: k, n: produkteIn(b, k.id).length }; })
      .filter(function (x) { return x.n; }).sort(function (a, c) { return c.n - a.n; }).slice(0, n).map(function (x) { return x.k; });
  }

  /* ---------- Links ---------- */
  var L = {
    bereich: function (b, k) { return "produkte.html" + q({ bereich: b, kategorie: k }); },
    produkt: function (id, b) { return "produkt.html" + q({ id: id, bereich: b }); },
    anfrage: function (id, opt) { return "index.html" + q({ produkt: id, optionen: opt }) + "#contact"; }
  };

  /* ---------- Bausteine ---------- */
  function card(p, bereich) {
    var kf = IDX.kf[p.konfigurator];
    return '<a class="pcard" href="' + L.produkt(p.id, bereich) + '">' +
      '<div class="pc-img"><img src="' + esc(p.bilder[0]) + '" alt="" loading="lazy">' +
      (kf ? '<span class="pc-badge">Selbst gestalten</span>' : "") + "</div>" +
      '<div class="pc-b"><h3>' + esc(p.name) + '</h3><div class="pc-m">' + (p.mindestmenge ? "Ab " + esc(p.mindestmenge) : "Menge auf Anfrage") + "</div></div></a>";
  }
  function panCls(n) { return n % 4 === 0 ? " four" : n % 3 === 0 ? " three" : n === 2 ? " two" : ""; }
  function catPanel(k, href, n) {
    return '<a class="cp" href="' + href + '"><img src="' + esc(k.bild) + '" alt="" loading="lazy"><span>' + esc(k.name) +
      (n != null ? "<small>" + n + (n === 1 ? " Produkt" : " Produkte") + "</small>" : "") + "</span></a>";
  }
  function tile(kf) {
    var used = DATA.produkte.filter(function (p) { return p.konfigurator === kf.id; });
    var live = kfLive(kf);
    var href = live ? kf.url : (used[0] ? L.produkt(used[0].id) : "konfiguratoren.html");
    return '<a class="tile" href="' + esc(href) + '"' + (live && /^https?:/.test(kf.url) ? ' target="_blank" rel="noopener"' : "") + ">" +
      '<div class="t-img"><img src="' + esc(kf.bild) + '" alt="" loading="lazy"></div>' +
      "<h3>" + esc(kf.name) + "</h3><p>" + esc(kf.text) + "</p>" +
      '<div class="t-for">Für ' + used.slice(0, 3).map(function (p) { return esc(p.name); }).join(", ") + (used.length > 3 ? " und " + (used.length - 3) + " weitere Modelle" : "") + "</div>" +
      '<div class="t-s' + (live ? "" : " soon") + '">' + (live ? "Jetzt gestalten" : "Online in Kürze") + "</div></a>";
  }
  function crumbs(items) {
    return '<nav class="crumbs" aria-label="Brotkrumen">' + items.map(function (it, i) {
      var last = i === items.length - 1;
      return (i ? CHEV : "") + (last ? '<span aria-current="page">' + esc(it[0]) + "</span>" : '<a href="' + it[1] + '">' + esc(it[0]) + "</a>");
    }).join("") + "</nav>";
  }

  /* ---------- Kopf, Footer, Cookies ---------- */
  var NAV = [["produkte.html?bereich=sportswear", "Sportswear & Merchandise"], ["produkte.html?bereich=workwear", "Workwear & Corporate"], ["produkte.html?bereich=retail", "Retail"],
             ["produkte.html?bereich=personal-brand", "Personal Brand"], ["konfiguratoren.html", "Selbst gestalten"]];
  function navHTML(variant) {
    var b = param("bereich"), sec = "";
    var page = location.pathname.split("/").pop() || "index.html";
    if (page === "konfiguratoren.html") sec = "Selbst gestalten";
    else if (page === "produkte.html" || page === "produkt.html") sec = (b && IDX.bereich && IDX.bereich[b]) ? IDX.bereich[b].name : "Produkte";
    var here = page + location.search;
    return tr('<div class="topbar"><a href="produkte.html">Produktkatalog 2026/27 · Ab 1 Stück · Angebot in 24 Stunden</a></div>' +
      '<header class="site-head' + (variant === "hero" ? " over" : "") + '" id="siteHead"><div class="sh-in">' +
      '<a class="sh-brand" href="index.html" aria-label="WearSuba Startseite"><img class="lg-b" src="img/site/suba-logo-schwarz.svg" alt="SUBA"><img class="lg-w" src="img/site/suba-logo-weiss.svg" alt="">' + (sec ? '<span class="sh-sec">' + esc(sec) + "</span>" : "") + "</a>" +
      '<ul class="sh-nav" id="shNav">' + NAV.filter(function (n) { return kfOn() || n[0] !== "konfiguratoren.html"; }).concat([["produkte.html", "Alle Produkte"]]).map(function (n) { return '<li><a href="' + n[0] + '"' + (n[0] === here ? ' aria-current="page"' : "") + ">" + esc(n[1]) + "</a></li>"; }).join("") + "</ul>" +
      '<div class="sh-tools">' + langSwitch() + '<button class="icon-btn" type="button" id="searchBtn" aria-label="Suche öffnen" aria-expanded="false" aria-controls="searchBox">' + ICON.search + "</button>" +
      '<a class="icon-btn" href="index.html#contact" aria-label="Anfrage senden">' + ICON.mail + "</a>" +
      '<button class="icon-btn menu-btn" type="button" id="menuBtn" aria-label="Menü öffnen" aria-expanded="false" aria-controls="shNav">' + ICON.menu + "</button></div></div>" +
      '<div class="search" id="searchBox"><form action="produkte.html" role="search"><label class="vh" for="sq" style="position:absolute;left:-9999px">Suche</label>' +
      '<input id="sq" name="q" type="search" placeholder="Wonach suchst du? z. B. Schal, Socken, Wimpel" value="' + esc(param("q") || "") + '"><button type="submit">Suchen</button></form></div></header>');
  }
  function footerHTML() {
    return tr('<section class="help-band"><div><h2>Fragen zu deinem Projekt?</h2><p>Wir beraten dich persönlich und melden uns innerhalb von 24 Stunden mit einem Angebot.</p></div>' +
      '<a class="btn" href="index.html#contact">Anfrage senden</a></section>' +
      '<footer class="site-foot"><div class="sf-cols">' +
      '<div><h3>Entdecke SUBA</h3><ul><li><a href="produkte.html">Alle Produkte</a></li>' + (kfOn() ? '<li><a href="konfiguratoren.html">Selbst gestalten</a></li>' : '') + '<li><a href="index.html#netzwerk">Unser Netzwerk</a></li><li><a href="index.html#process">Ablauf</a></li></ul></div>' +
      '<div><h3>Bereiche</h3><ul>' + NAV.slice(0, 4).map(function (n) { return '<li><a href="' + n[0] + '">' + esc(n[1]) + "</a></li>"; }).join("") + "</ul></div>" +
      '<div><h3>Brauchst du Hilfe?</h3><ul><li><a href="index.html#contact">Anfrage</a></li><li><a href="mailto:info@wearsuba.com">info@wearsuba.com</a></li></ul></div>' +
      '<div><h3>Rechtliches</h3><ul><li><a href="impressum.html">Impressum</a></li><li><a href="agb.html">AGB</a></li><li><a href="datenschutz.html">Datenschutz</a></li><li><button type="button" data-cookie-settings>Cookie-Einstellungen</button></li></ul></div>' +
      '<div class="sf-logo"><img src="img/site/suba-logo-schwarz.svg" alt="SUBA"></div></div>' +
      '<div class="sf-legal"><span>© ' + new Date().getFullYear() + " SUBA Group AG · Münchhaldenstrasse 7 · 8008 Zürich · Betriebsstätte Deutschland: August-Wolff-Strasse 21 · 65203 Wiesbaden</span><span>WearSuba.com</span></div></footer>");
  }
  function initHead() {
    var head = $("#siteHead"); if (!head) return;
    if (head.classList.contains("over")) {
      document.body.classList.add("has-overhead");
      var f = function () { head.classList.toggle("solid", window.scrollY > 40 || $("#searchBox").classList.contains("open") || $("#shNav").classList.contains("open")); };
      window.addEventListener("scroll", f, { passive: true }); f(); head._f = f;
    }
    var mb = $("#menuBtn"), nav = $("#shNav"), sb = $("#searchBtn"), box = $("#searchBox");
    mb.addEventListener("click", function (e) {
      if (e) e.stopPropagation();
      var o = nav.classList.toggle("open"); mb.setAttribute("aria-expanded", o); mb.setAttribute("aria-label", T(o ? "Menü schliessen" : "Menü öffnen")); mb.innerHTML = o ? ICON.close : ICON.menu;
      if (o && box.classList.contains("open")) { box.classList.remove("open"); sb.setAttribute("aria-expanded", false); }
      if (head._f) head._f();
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && nav.classList.contains("open")) mb.click(); });
    document.addEventListener("click", function (e) { if (nav.classList.contains("open") && !head.contains(e.target)) mb.click(); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a") && nav.classList.contains("open")) mb.click(); });
    sb.addEventListener("click", function () {
      var o = box.classList.toggle("open"); sb.setAttribute("aria-expanded", o); if (o) $("#sq").focus(); if (head._f) head._f();
    });
  }
  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function initCookies() {
    var wrap = document.createElement("div");
    wrap.innerHTML = tr(
      '<div id="cookie-banner" role="dialog" aria-label="Cookie-Hinweis"><div class="cb-text"><div class="cb-title">Wir verwenden Cookies</div>' +
      '<div class="cb-desc">Wir setzen Cookies ein, um dir die bestmögliche Nutzererfahrung zu bieten und unsere Website zu verbessern. Mehr dazu in unserer <a href="datenschutz.html">Datenschutzerklärung</a>.</div></div>' +
      '<div class="cb-actions"><button class="cb-btn cb-necessary" type="button" data-c="necessary">Nur notwendige</button><button class="cb-btn cb-accept" type="button" data-c="all">Alle akzeptieren</button>' +
      '<button class="cb-settings" type="button" data-cookie-settings>Einstellungen</button></div></div>' +
      '<div id="cookie-modal" role="dialog" aria-modal="true" aria-labelledby="cm-t"><div class="cm-box"><div class="cm-header"><h3 id="cm-t">Cookie-Einstellungen</h3>' +
      '<p>Wähle, welche Cookies du akzeptieren möchtest. Notwendige Cookies können nicht deaktiviert werden, da die Website sonst nicht funktioniert.</p></div><div class="cm-body">' +
      '<div class="cm-category"><div class="cm-cat-header"><div class="cm-cat-name">Notwendige Cookies</div><label class="toggle"><input type="checkbox" checked disabled aria-label="Notwendige Cookies"><span class="toggle-slider"></span></label></div><div class="cm-cat-desc">Für den Betrieb der Website unerlässlich. Sie speichern z. B. deine Cookie-Einstellungen.</div></div>' +
      '<div class="cm-category"><div class="cm-cat-header"><div class="cm-cat-name">Analyse & Performance</div><label class="toggle"><input type="checkbox" id="toggle-analytics" aria-label="Analyse und Performance"><span class="toggle-slider"></span></label></div><div class="cm-cat-desc">Helfen uns zu verstehen, wie die Website genutzt wird. Alle Daten sind anonymisiert.</div></div>' +
      '<div class="cm-category"><div class="cm-cat-header"><div class="cm-cat-name">Marketing & Targeting</div><label class="toggle"><input type="checkbox" id="toggle-marketing" aria-label="Marketing"><span class="toggle-slider"></span></label></div><div class="cm-cat-desc">Zeigen dir relevante Werbung und messen Kampagnen. Jederzeit widerrufbar.</div></div>' +
      '</div><div class="cm-footer"><button class="cm-save" type="button" data-save>Auswahl speichern</button><button class="cm-accept-all" type="button" data-c="all">Alle akzeptieren</button></div></div></div>');
    document.body.appendChild(wrap);
    var banner = $("#cookie-banner"), modal = $("#cookie-modal");
    function close() { banner.classList.remove("show"); modal.classList.remove("open"); }
    function choose(t) { store("wearsuba_cookie_consent", t); store("wearsuba_cookie_date", new Date().toISOString()); close(); }
    if (!read("wearsuba_cookie_consent")) setTimeout(function () { banner.classList.add("show"); }, 800);
    document.addEventListener("click", function (e) {
      var t = e.target.closest("[data-c],[data-cookie-settings],[data-save]");
      if (!t) { if (e.target === modal) modal.classList.remove("open"); return; }
      e.preventDefault();
      if (t.hasAttribute("data-c")) choose(t.getAttribute("data-c"));
      else if (t.hasAttribute("data-save")) { var a = $("#toggle-analytics").checked, m = $("#toggle-marketing").checked; choose(a && m ? "all" : a ? "analytics" : "necessary"); }
      else { var c = read("wearsuba_cookie_consent"); $("#toggle-analytics").checked = c === "all" || c === "analytics"; $("#toggle-marketing").checked = c === "all"; modal.classList.add("open"); }
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") modal.classList.remove("open"); });
  }
  function initReveal() {
    var els = $$(".reveal:not(.in)");
    if (!("IntersectionObserver" in window)) { els.forEach(function (e) { e.classList.add("in"); }); return; }
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); ro.unobserve(e.target); } });
    }, { threshold: 0.05, rootMargin: "0px 0px 120px 0px" });
    els.forEach(function (el) { ro.observe(el); });
  }
  function fail(el, err) {
    html(el, '<div class="loading">Die Produktdaten konnten nicht geladen werden. Bitte lade die Seite neu oder schreib uns an info@wearsuba.com.</div>');
    if (window.console) console.error(err);
  }

  /* ---------- Startseite ---------- */
  function home() {
    var box = $("#sportswear-cats"), kfBox = $("#home-konfig");
    load().then(function () {
      $$(".hp[data-bereich]").forEach(function (a) {
        var b = a.getAttribute("data-bereich"), t = $(".hp-t", a);
        var links = document.createElement("span"); links.className = "hp-links";
        var B = IDX.bereich[b], items;
        if (B.typ === "showcase") items = (DATA.referenzen || []).filter(function (r) { return r.bereich === b; }).map(function (r) { return r.name; }).concat(["Deine Marke"]);
        else if (B.typ === "anfrage") items = ["Angebot anfragen"];
        else if (B.typ === "retail") items = ["Souvenir-Textilien", "Schnell bei Trends", "Handelsfertig geliefert"];
        else if (B.typ === "corporate") items = ((DATA.corporate || {}).sortiment || []).slice(0, 3).map(function (x) { return x.titel; });
        else items = topKats(b, 4).map(function (k) { return k.name; });
        html(links, items.map(function (x) { return "<span>" + esc(x) + "</span>"; }).join(""));
        t.appendChild(links);
      });
      if (box) html(box, DATA.kategorien.map(function (k) { var n = produkteIn("sportswear", k.id).length; return n ? catPanel(k, L.bereich("sportswear", k.id), n) : ""; }).join(""));
      if (kfBox) html(kfBox, DATA.konfiguratoren.map(tile).join(""));
      contactPrefill();
      initReveal();
      initNetwork();
      initClaim();
      initWhySuba();
    }).catch(function (e) { fail(box || kfBox, e); });
  }
  /* ---------- Startseite: Claim mit wechselndem Wort ---------- */
  function initClaim() {
    var r = $("#hcRot"); if (!r) return;
    var w = $$("span", r), i = 0;
    if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setInterval(function () { w[i].classList.remove("on"); i = (i + 1) % w.length; w[i].classList.add("on"); }, 2400);
  }
  /* ---------- Startseite: Warum SUBA (Fallblatt-Anzeige) ---------- */
  function initWhySuba() {
    var sec = $("#warum-suba"), dataEl = $("#wsData"); if (!sec || !dataEl) return;
    var V; try { V = JSON.parse(dataEl.textContent); } catch (e) { return; }
    var board = $("#wsBoard"), desc = $("#wsDesc"), dots = $("#wsDots"), letters = $$(".ws-letters span", sec);
    var CH = "ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ-·", idx = 0, timer = null, busy = false;
    var still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    dots.innerHTML = V.map(function (v, i) { return '<button type="button" aria-label="' + T("Bedeutung") + ' ' + (i + 1) + '"></button>'; }).join("");
    var dotEls = $$("button", dots);
    function parse(t) { var out = [], hi = false; for (var i = 0; i < t.length; i++) { var c = t[i]; if (c === "[") { hi = true; continue; } if (c === "]") { hi = false; continue; } out.push({ c: c, hi: hi }); } return out; }
    function render(n) {
      var chars = parse(V[n].t), words = [], cur = [];
      chars.forEach(function (o) { if (o.c === " ") { words.push(cur); cur = []; } else cur.push(o); });
      words.push(cur);
      board.innerHTML = words.map(function (w) { return '<span class="ws-w">' + w.map(function (o) { return '<span class="ws-c' + (o.hi ? " hi" : "") + '" data-c="' + esc(o.c.toUpperCase()) + '">' + (still ? esc(o.c.toUpperCase()) : "&nbsp;") + "</span>"; }).join("") + "</span>"; }).join('<span class="ws-sp"> </span>');
      board.setAttribute("aria-label", V[n].t.replace(/[\[\]]/g, ""));
      desc.textContent = V[n].d;
      dotEls.forEach(function (d, i) { d.classList.toggle("on", i === n); });
      letters.forEach(function (l, i) { l.classList.remove("flip"); void l.offsetWidth; l.classList.add("flip"); l.style.animationDelay = (i * 90) + "ms"; });
      if (still) return;
      busy = true;
      var cells = $$(".ws-c", board), done = 0;
      cells.forEach(function (c, i) {
        var target = c.getAttribute("data-c"), steps = 6 + Math.floor(Math.random() * 6), k = 0;
        setTimeout(function tick() {
          if (k++ < steps) { c.textContent = CH[Math.floor(Math.random() * CH.length)]; c.classList.add("roll"); setTimeout(tick, 45); }
          else { c.textContent = target; c.classList.remove("roll"); if (++done === cells.length) busy = false; }
        }, i * 22);
      });
    }
    function go(n) { if (busy) return; idx = (n + V.length) % V.length; render(idx); }
    function auto() { clearInterval(timer); timer = setInterval(function () { go(idx + 1); }, 4200); }
    $("#wsNext").addEventListener("click", function () { go(idx + 1); auto(); });
    letters.forEach(function (l) { l.addEventListener("click", function () { go(idx + 1); auto(); }); });
    dotEls.forEach(function (d, i) { d.addEventListener("click", function () { go(i); auto(); }); });
    var started = false;
    function start() { if (started) return; started = true; render(0); if (!still) auto(); }
    if ("IntersectionObserver" in window) { var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { start(); io.disconnect(); } }, { threshold: .3 }); io.observe(sec); } else start();
  }
  /* ---------- Startseite: Netzwerk-Karte ---------- */
  function initNetwork() {
    var sec = $("#netzwerk"); if (!sec) return;
    function set(k) {
      sec.classList.toggle("focus", !!k);
      $$("[data-k]", sec).forEach(function (el) { el.classList.toggle("on", el.getAttribute("data-k") === k); });
    }
    $$("[data-k]", sec).forEach(function (el) {
      if (el.classList.contains("nw-route")) return;
      var k = el.getAttribute("data-k");
      el.addEventListener("mouseenter", function () { set(k); });
      el.addEventListener("focus", function () { set(k); });
      el.addEventListener("click", function () { set(el.classList.contains("on") ? null : k); });
    });
    sec.addEventListener("mouseleave", function () { set(null); });
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { sec.classList.add("go"); io.disconnect(); } }, { threshold: .25 });
      io.observe(sec);
    } else sec.classList.add("go");
  }
  function contactPrefill() {
    var form = $("#contactForm"); if (!form) return;
    var sel = form.querySelector("select[name=Interesse]");
    if (sel) {
      var have = $$("option", sel).map(function (o) { return o.textContent; });
      var other = $$("option", sel).filter(function (o) { return o.textContent === T("Sonstiges"); })[0];
      DATA.kategorien.forEach(function (k) { if (have.indexOf(k.name) < 0) { var o = document.createElement("option"); o.textContent = k.name; sel.insertBefore(o, other || null); } });
    }
    var thema = param("thema");
    if (thema) {
      var th = document.createElement("input"); th.type = "hidden"; th.name = "Thema"; th.value = thema; form.appendChild(th);
      if (sel) $$("option", sel).forEach(function (o, i) { if (o.textContent === T("Sonstiges")) sel.selectedIndex = i; });
      var tn = document.createElement("div"); tn.className = "req-product";
      html(tn, "Anfrage zu: <strong>" + esc(T(thema)) + '</strong> <button type="button">Entfernen</button>');
      form.insertBefore(tn, form.firstChild);
      tn.querySelector("button").addEventListener("click", function () { tn.remove(); th.remove(); });
    }
    var id = param("produkt"), p = id && IDX.prod[id];
    if (!p) return;
    var opt = param("optionen") || "";
    var hid = document.createElement("input"); hid.type = "hidden"; hid.name = "Produkt"; hid.value = p.name + (opt ? " – " + opt : ""); form.appendChild(hid);
    if (sel) { var k = IDX.kat[p.kategorie]; $$("option", sel).forEach(function (o, i) { if (k && o.textContent === k.name) sel.selectedIndex = i; }); }
    var note = document.createElement("div"); note.className = "req-product";
    html(note, "Anfrage zu: <strong>" + esc(p.name) + "</strong>" + (opt ? "<br>" + esc(opt) : "") + ' <button type="button">Entfernen</button>');
    form.insertBefore(note, form.firstChild);
    note.querySelector("button").addEventListener("click", function () { note.remove(); hid.remove(); });
    var ta = form.querySelector("textarea"); if (ta && !ta.value) ta.placeholder = EN ? "Quantity, colours, design idea, deadline for \u201c" + p.name + "\u201d …" : "Menge, Farben, Design-Idee, Deadline zu „" + p.name + "“ …";
  }

  /* ---------- Bereich als Referenz-Seite (Personal Brand) ---------- */
  function showcase(B) {
    var refs = (DATA.referenzen || []).filter(function (r) { return r.bereich === B.id; });
    var steps = DATA.personal_brand_schritte || [];
    var hero = B.bild;
    var anf = "index.html" + q({ thema: B.name }) + "#contact";
    var duo = (B.bilder_hero || [hero]);
    var h = '<header class="sc-hero"><div class="sc-bg' + (duo.length > 1 ? " duo" : "") + '">' + duo.map(function (u) { return '<span style="background-image:url(\'' + esc(u) + '\')"></span>'; }).join("") + '</div><div class="sc-t">' +
      crumbs([["Start", "index.html"], [B.name, "#"]]) +
      "<h1>Deine eigene Marke.<br>Von der Idee bis zur Produktion.</h1><p>" + esc(B.text) + '</p><a class="btn sc-btn" href="' + anf + '">Projekt besprechen</a></div></header>';
    h += '<section class="block sc-intro"><h2>Deine Produkte, mit uns entwickelt</h2><p>Du hast eine Idee, einen Namen oder erst ein Gefühl für deine Marke? Wir begleiten dich bei allem, was dein Produkt betrifft: Beratung zu Möglichkeiten und Materialien, Schnitt, Design und Grafik bis zur fertigen Produktion. Zwei Marken haben wir so bereits mitgegründet.</p></section>';
    h += refs.map(function (r, i) {
      return '<section class="case' + (i % 2 ? " flip" : "") + '" id="' + esc(r.id) + '">' +
        '<div class="case-media"><figure class="cm-main"><img src="' + esc(r.bilder[0]) + '" alt="' + esc(r.name) + '" loading="lazy"></figure>' +
        '<div class="cm-row">' + r.bilder.slice(1, 5).map(function (src) { return '<figure><img src="' + esc(src) + '" alt="" loading="lazy" onerror="this.parentNode.remove()"></figure>'; }).join("") + "</div></div>" +
        '<div class="case-text"><div class="case-k">Mitgegründet mit SUBA</div><h2>' + esc(r.name) + '</h2><p class="case-claim">' + esc(r.claim) + "</p><p>" + esc(r.text) + "</p>" +
        '<table class="case-facts"><tbody>' + r.fakten.map(function (f) { return '<tr><th scope="row">' + esc(f[0]) + "</th><td>" + esc(f[1]) + "</td></tr>"; }).join("") +
        (r.suba ? '<tr><th scope="row">SUBA</th><td>' + esc(r.suba) + '</td></tr>' : '') + '</tbody></table>' +
        '<a class="link-u" href="' + esc(r.url) + '" target="_blank" rel="noopener">' + (EN ? "Visit " + esc(r.url.replace("https://", "")) : esc(r.url.replace("https://", "")) + " besuchen") + "</a></div></section>";
    }).join("");
    h += '<section class="block band"><div class="block-head"><h2>So entsteht deine Marke</h2></div><ol class="steps">' +
      steps.map(function (st) { return '<li class="reveal"><h3>' + esc(st[0]) + "</h3><p>" + esc(st[1]) + "</p></li>"; }).join("") + "</ol></section>";
    h += '<section class="sc-cta"><h2>Du hast eine Idee für deine eigene Marke?</h2><p>Erzähl uns davon. Wir melden uns innerhalb von 24 Stunden.</p><a class="btn" href="' + anf + '">Projekt besprechen</a></section>';
    return h;
  }
  /* ---------- Bereich Retail (Souvenirs, Handel) ---------- */
  function retail(B) {
    var R = DATA.retail || {};
    var anf = "index.html" + q({ thema: B.name }) + "#contact";
    var duo = B.bilder_hero || [B.bild];
    var h = '<header class="sc-hero"><div class="sc-bg' + (duo.length > 1 ? " duo" : "") + '">' + duo.map(function (u) { return '<span style="background-image:url(\'' + esc(u) + '\')"></span>'; }).join("") + '</div><div class="sc-t">' +
      crumbs([["Start", "index.html"], [B.name, "#"]]) +
      "<h1>Souvenirs und Merchandise<br>für den Handel.</h1><p>" + esc(B.text) + '</p><a class="btn sc-btn" href="' + anf + '">Projekt besprechen</a></div></header>';
    if (R.intro) h += '<section class="block sc-intro"><h2>' + esc(R.intro.titel) + "</h2><p>" + esc(R.intro.text) + "</p></section>";
    h += '<section class="block band"><div class="block-head"><h2>Warum mit uns</h2></div><ol class="steps">' +
      (R.staerken || []).map(function (x) { return '<li class="reveal"><h3>' + esc(x[0]) + "</h3><p>" + esc(x[1]) + "</p></li>"; }).join("") + "</ol></section>";
    if ((R.galerie || []).length) h += '<section class="block"><div class="block-head"><h2>Aus unserer Arbeit</h2><p>Souvenirs, Merchandise und Produktentwicklung, die wir umgesetzt haben.</p></div><div class="re-gal">' +
      R.galerie.map(function (g) { return '<figure class="reveal' + (g.weit ? " w" : "") + '"><div class="rg-img"><img src="' + esc(g.bild) + '" alt="' + esc(g.titel) + '" loading="lazy"></div><figcaption><h3>' + esc(g.titel) + "</h3><p>" + esc(g.text) + "</p></figcaption></figure>"; }).join("") + "</div></section>";
    var cats = DATA.kategorien.filter(function (c) { return produkteIn(B.id, c.id).length; });
    if (cats.length) h += '<section class="block"><div class="block-head"><h2>Produkte für deinen Shop</h2><p>Eine Auswahl an Textilien und Accessoires, die sich als Souvenir und Merchandise bewährt haben. Weitere Produkte auf Anfrage.</p></div><div class="cat-panels' + panCls(cats.length) + '">' +
      cats.map(function (c) { return catPanel(c, L.bereich(B.id, c.id), produkteIn(B.id, c.id).length); }).join("") + "</div></section>";
    h += '<section class="block band"><div class="block-head"><h2>So kommt dein Produkt ins Regal</h2></div><ol class="steps">' +
      (R.ablauf || []).map(function (st) { return '<li class="reveal"><h3>' + esc(st[0]) + "</h3><p>" + esc(st[1]) + "</p></li>"; }).join("") + "</ol></section>";
    var mo = R.motive || [];
    if (mo.length) {
      var fig = function (m) { return '<figure><img src="' + esc(m.bild) + '" alt="Souvenir-Motiv ' + esc(m.ort) + '" loading="lazy"><figcaption>' + esc(m.ort) + "</figcaption></figure>"; };
      var half = Math.ceil(mo.length / 2), rows = [mo.slice(0, half), mo.slice(half)].filter(function (r) { return r.length; });
      h += '<section class="re-show" aria-label="Souvenir-Motive aus unseren Projekten"><div class="block-head"><h2>Souvenir-Motive aus unseren Projekten</h2><p>Städtemotive für Wien, Berlin, Hamburg, München, Zürich, Lugano, Österreich und viele mehr.</p></div>' +
        rows.map(function (r, i) { var tr = r.map(fig).join(""); return '<div class="re-mq"><div class="re-track' + (i ? " rev" : "") + '" style="animation-duration:' + (r.length * 5) + 's">' + tr + '<span class="re-dup" aria-hidden="true">' + tr + "</span></div></div>"; }).join("") + "</section>"; }
    h += '<section class="sc-cta"><h2>Du planst eine Souvenir-Kollektion?</h2><p>Erzähl uns von deinem Shop, deiner Stadt oder deinem Trend. Wir melden uns innerhalb von 24 Stunden.</p><a class="btn" href="' + anf + '">Projekt besprechen</a></section>';
    return h;
  }
  /* ---------- Bereich Workwear & Corporate (Hotels, Gastro, Keramik) ---------- */
  function corporate(B) {
    var C = DATA.corporate || {}, M = C.manufaktur || {};
    var anf = "index.html" + q({ thema: B.name }) + "#contact";
    var anfK = "index.html" + q({ thema: "Handgemachte Keramik aus Kolumbien" }) + "#contact";
    var duo = B.bilder_hero || [B.bild];
    var h = '<header class="sc-hero"><div class="sc-bg' + (duo.length > 1 ? " duo" : "") + '">' + duo.map(function (u) { return '<span style="background-image:url(\'' + esc(u) + '\')"></span>'; }).join("") + '</div><div class="sc-t">' +
      crumbs([["Start", "index.html"], [B.name, "#"]]) +
      "<h1>Für Hotels, Gastro<br>und Unternehmen.</h1><p>" + esc(B.text) + '</p><a class="btn sc-btn" href="' + anf + '">Angebot anfragen</a></div></header>';
    if (C.intro) h += '<section class="block sc-intro"><h2>' + esc(C.intro.titel) + "</h2><p>" + esc(C.intro.text) + "</p></section>";
    h += '<section class="block co-sort"><div class="co-grid">' + (C.sortiment || []).map(function (x) {
      var lk = x.link === "#anfrage" ? "index.html" + q({ thema: x.titel }) + "#contact" : x.link;
      return '<a class="co-card reveal" href="' + esc(lk) + '"><div class="co-img"><img src="' + esc(x.bild) + '" alt="" loading="lazy"></div><h3>' + esc(x.titel) + "</h3><p>" + esc(x.text) + '</p><span class="link-u">' + esc(x.linktext) + "</span></a>";
    }).join("") + "</div></section>";
    h += '<section class="block band" id="keramik"><div class="block-head"><h2>Keramik und Tassen. Drei Wege zu deinem Geschirr.</h2><p>Ob schnell und günstig oder einzigartig und von Hand gemacht: Wir finden die Lösung, die zu deinem Haus passt.</p></div><ol class="steps co-ways">' +
      (C.keramik_wege || []).map(function (w) {
        return '<li class="reveal"><h3>' + esc(w.titel) + '</h3><div class="co-ort">' + esc(w.ort) + "</div><p>" + esc(w.text) + "</p><ul>" + w.punkte.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul></li>";
      }).join("") + "</ol></section>";
    if (M.titel) {
      h += '<section class="case co-man" id="kolumbien"><div class="case-media"><figure class="cm-main"><img src="' + esc(M.bilder[0]) + '" alt="Handbemalte Keramikschale aus Kolumbien" loading="lazy"></figure>' +
        '<div class="cm-row">' + M.bilder.slice(1).concat(M.designs.slice(0, 2).map(function (x) { return x.bild; })).map(function (src) { return '<figure><img src="' + esc(src) + '" alt="" loading="lazy"></figure>'; }).join("") + "</div></div>" +
        '<div class="case-text"><div class="case-k">' + esc(M.kicker) + "</div><h2>" + esc(M.titel) + "</h2><p>" + esc(M.text) + "</p>" +
        '<table class="case-facts"><tbody>' + M.fakten.map(function (f) { return '<tr><th scope="row">' + esc(f[0]) + "</th><td>" + esc(f[1]) + "</td></tr>"; }).join("") + "</tbody></table>" +
        '<a class="btn co-btn" href="' + anfK + '">Keramik anfragen</a></div></section>';
      h += '<section class="block"><div class="block-head"><h2>Designs der Manufaktur</h2><p>Jedes Design gibt es als Teller, Tasse, Bowl, Vase oder in der Form, die du dir wünschst.</p></div><div class="co-designs">' +
        M.designs.map(function (x) { return '<figure class="reveal"><div class="co-dimg"><img src="' + esc(x.bild) + '" alt="Handbemalter Keramikteller" loading="lazy"></div></figure>'; }).join("") + "</div></section>";
      h += '<section class="block band"><div class="block-head"><h2>Farben kombinieren</h2><p>Einfarbig, zweifarbig oder als freie Komposition: So können deine Stücke aussehen.</p></div><div class="co-kombi">' +
        M.kombis.map(function (x) { return '<figure class="reveal"><div class="co-dimg"><img src="' + esc(x[1]) + '" alt="' + esc(x[0]) + '" loading="lazy"></div><figcaption>' + esc(x[0]) + "</figcaption></figure>"; }).join("") + "</div>" +
        '<div class="block-head co-fhead"><h2>Farbpalette</h2><p>Matte und glänzende Glasuren. Weitere Töne entwickeln wir mit dir.</p></div><div class="co-farben">' +
        M.farben.map(function (x) { return '<figure><div class="co-sw"><img src="' + esc(x[2]) + '" alt="" loading="lazy"></div><figcaption>' + esc(x[0]) + (x[1] ? "<span>" + esc(x[1]) + "</span>" : "") + "</figcaption></figure>"; }).join("") + "</div>" +
        '<p class="co-note">' + esc(M.hinweis) + "</p></section>";
    }
    var gastro = produkteIn(B.id, "gastro");
    if (gastro.length) h += '<section class="block" id="gastro"><div class="block-head"><h2>Gastro und Display</h2><p>Aufsteller, Speisekarten, Tischaccessoires und Servierbretter aus Holz, mit deinem Logo graviert oder bedruckt. Ohne Mindestmenge.</p></div><div class="pgrid">' +
      gastro.map(function (p) { return card(p, B.id); }).join("") + "</div></section>";
    var cats = DATA.kategorien.filter(function (c) { return c.id !== "gastro" && produkteIn(B.id, c.id).length; });
    if (cats.length) h += '<section class="block band"><div class="block-head"><h2>Das ganze Sortiment für dein Team</h2><p>Von Polo und Beanie bis Sneaker und Smart-Armband: alle Produkte, die du für dein Unternehmen anfragen kannst.</p></div><div class="cat-panels' + panCls(cats.length) + '">' +
      cats.map(function (c) { return catPanel(c, L.bereich(B.id, c.id), produkteIn(B.id, c.id).length); }).join("") + "</div></section>";
    var kfs = (DATA.konfiguratoren || []).filter(function (k) { return k.id === "tasse" || k.id === "handtuch"; });
    if (kfs.length) h += '<section class="block"><div class="block-head"><h2>Selbst gestalten</h2><p>Tassen und Handtücher kannst du direkt online gestalten.</p></div><div class="tile-grid">' + kfs.map(tile).join("") + "</div></section>";
    h += '<section class="sc-cta"><h2>Wir statten dein Haus aus</h2><p>Erzähl uns, was du brauchst: Hotel, Restaurant oder Unternehmen, Textil oder Keramik. Wir melden uns innerhalb von 24 Stunden.</p><a class="btn" href="' + anf + '">Angebot anfragen</a></section>';
    return h;
  }
  /* ---------- Bereich im Aufbau (Retail) ---------- */
  function landing(B) {
    var anf = "index.html" + q({ thema: B.name }) + "#contact";
    return '<header class="sc-hero short"><div class="sc-bg" style="background-image:url(\'' + esc(B.bild) + '\')"></div><div class="sc-t">' +
      crumbs([["Start", "index.html"], [B.name, "#"]]) + "<h1>" + esc(B.name) + "</h1><p>" + esc(B.text) + '</p><a class="btn sc-btn" href="' + anf + '">Angebot anfragen</a></div></header>' +
      '<section class="sc-cta"><h2>Unser ' + esc(B.name) + "-Sortiment ist im Aufbau</h2><p>Bis es online ist, stellen wir dir dein Angebot persönlich zusammen. Schick uns Menge, Produkt und Idee, wir melden uns innerhalb von 24 Stunden.</p>" +
      '<a class="btn" href="' + anf + '">Angebot anfragen</a><p style="margin-top:18px"><a class="link-u" href="produkte.html?bereich=sportswear">Zum Sportswear-Katalog</a></p></section>';
  }

  /* ---------- Katalog / Bereich / Suche ---------- */
  function katalog() {
    var root = $("#katalog");
    load().then(function () {
      var b = param("bereich"), k = param("kategorie"), s = (param("q") || "").trim();
      if (b && !IDX.bereich[b]) b = null;
      if (k && !IDX.kat[k]) k = null;
      var B = b && IDX.bereich[b], C = k && IDX.kat[k];
      if (B && B.typ === "showcase" && !s) { html(root, showcase(B)); document.title = B.name + " – WearSuba | Suba Group AG"; return; }
      if (B && B.typ === "retail" && !s && !k) { html(root, retail(B)); document.title = B.name + " – WearSuba | Suba Group AG"; initReveal(); return; }
      if (B && B.typ === "corporate" && !s && !k) { html(root, corporate(B)); document.title = B.name + " – WearSuba | Suba Group AG"; initReveal(); return; }
      if (B && B.typ === "anfrage" && !s) { html(root, landing(B)); document.title = B.name + " – WearSuba | Suba Group AG"; return; }
      var title = s ? (EN ? "Search: \u201c" + s + "\u201d" : "Suche: „" + s + "“") : C ? C.name : B ? B.name : T("Alle Produkte");
      document.title = title + " – WearSuba | Suba Group AG";
      var cats = DATA.kategorien.filter(function (c) { return produkteIn(b, c.id).length; });
      var list = produkteIn(b, k, s);
      var h = "";
      if (!k && !s) h += '<div class="cat-panels tall' + (b === "sportswear" ? " color" : "") + '">' + cats.slice(0, 5).map(function (c) { var bild = (b === "sportswear" && c.bild_sportswear) ? Object.assign({}, c, { bild: c.bild_sportswear }) : c; return catPanel(bild, L.bereich(b, c.id)); }).join("") + "</div>";
      var cr = [["Start", "index.html"]];
      if (B) cr.push([B.name, L.bereich(b)]); else cr.push(["Produkte", "produkte.html"]);
      if (C) cr.push([C.name, L.bereich(b, k)]);
      if (s) cr.push(["Suche", "#"]);
      h += '<div class="list-head">' + crumbs(cr) + '<h1 class="page-title">' + esc(title) + "</h1>" +
        (C ? '<p class="intro">' + esc(C.text) + "</p>" : B && !s ? '<p class="intro">' + esc(B.text) + (B.status !== "aktiv" ? " Dieser Bereich wird gerade ausgebaut, alle Produkte kannst du bereits anfragen." : "") + "</p>" : "") +
        (s ? "" : '<nav class="tabs" aria-label="Kategorien"><a href="' + L.bereich(b) + '"' + (!k ? ' aria-current="true"' : "") + ">Alle</a>" +
          cats.map(function (c) { return '<a href="' + L.bereich(b, c.id) + '"' + (c.id === k ? ' aria-current="true"' : "") + ">" + esc(c.name) + "</a>"; }).join("") + "</nav>") +
        "</div>";
      var katB = DATA.bereiche.filter(function (x) { return x.typ === "katalog"; });
      h += '<div class="list-bar">' + (katB.length > 1 ? '<nav class="areas" aria-label="Bereiche"><a href="' + L.bereich(null, k) + '"' + (!b ? ' aria-current="page"' : "") + ">Alle Bereiche</a>" +
        katB.map(function (x) { return '<a href="' + L.bereich(x.id, k) + '"' + (x.id === b ? ' aria-current="page"' : "") + ">" + esc(x.name) + "</a>"; }).join("") + "</nav>" : "<span></span>") +
        '<span class="count">' + list.length + (list.length === 1 ? " Produkt" : " Produkte") + "</span></div>";
      var more = C && C.mehr && !s ? '<a class="pcard more" href="index.html' + q({ thema: C.mehr.titel }) + '#contact"><div class="pc-img"><span class="pm-t">' + esc(C.mehr.titel) + '</span><span class="pm-s">' + esc(C.mehr.text) + '</span><span class="pm-l">Auf Anfrage</span></div><div class="pc-b"><h3>Mehr Designs auf Anfrage</h3><div class="pc-m">Wir beraten dich persönlich</div></div></a>' : "";
      h += '<div class="pgrid">' + (list.length ? list.map(function (p) { return card(p, b); }).join("") + more :
        '<div class="empty">' + (s ? "Zu „" + esc(s) + "“ haben wir nichts gefunden. Versuch es mit einem anderen Begriff oder " : "Hier gibt es noch keine Produkte. ") + '<a href="produkte.html">alle Produkte ansehen</a>.</div>') + "</div>";
      if (!k && !s) {
        var kfs = DATA.konfiguratoren.filter(function (kf) { return produkteIn(b).some(function (p) { return p.konfigurator === kf.id; }); });
        if (kfs.length) h += '<section class="block band"><div class="block-head"><h2>Selbst gestalten</h2><a class="link-u" href="konfiguratoren.html">Alle Konfiguratoren</a></div><div class="tile-grid">' + kfs.map(tile).join("") + "</div></section>";
      }
      html(root, h);
    }).catch(function (e) { fail(root, e); });
  }

  /* ---------- Produktdetail ---------- */
  function produkt() {
    var root = $("#produkt");
    load().then(function () {
      var p = IDX.prod[param("id")];
      if (!p) { html(root, '<div class="loading">Dieses Produkt gibt es nicht (mehr). <a href="produkte.html">Zum Produktkatalog</a></div>'); return; }
      var b = param("bereich"); if (b && p.bereiche.indexOf(b) < 0) b = null;
      var B = b && IDX.bereich[b], K = IDX.kat[p.kategorie], kf = IDX.kf[p.konfigurator], live = kfLive(kf);
      document.title = p.name + " – WearSuba | Suba Group AG";
      var cr = [["Start", "index.html"]]; if (B) cr.push([B.name, L.bereich(b)]); else cr.push(["Produkte", "produkte.html"]); cr.push([K.name, L.bereich(b, K.id)]); cr.push([p.name, "#"]);
      var sel = {};
      var h = '<div class="pd-top">' + crumbs(cr) + "</div>" +
        '<div class="pd"><div class="gal' + (p.bilder.length === 1 ? " one" : "") + '">' + p.bilder.map(function (src, i) { return '<figure><img src="' + esc(src) + '" alt="' + (i ? "" : esc(p.name)) + '"' + (i > 1 ? ' loading="lazy"' : "") + "></figure>"; }).join("") + "</div>" +
        '<div class="info"><h1>' + esc(p.name) + "</h1>" + (function () { var t = [K.name !== p.name ? esc(K.name) : "", kf ? "Online gestaltbar" : ""].filter(Boolean).join(" · "); return t ? '<div class="kat">' + t + "</div>" : ""; })() +
        '<p class="lead">' + esc(p.kurz) + "</p>" +
        (p.highlights.length ? '<ul class="hl">' + p.highlights.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" : "") +
        '<div class="moq">' + (p.mindestmenge ? "Ab " + esc(p.mindestmenge) : "Menge auf Anfrage") + "<small>Preis auf Anfrage · Angebot innerhalb von 24 Stunden</small></div>" +
        p.varianten.map(function (v, gi) {
          var wide = v.optionen.some(function (o) { return o.length > 22; });
          return '<div class="og"><div class="og-h">' + esc(v.name) + ' <span data-sel="' + gi + '"></span></div><div class="opts' + (wide ? " wide" : "") + '" role="group" aria-label="' + esc(v.name) + '">' +
            v.optionen.map(function (o) { return '<button type="button" class="opt" aria-pressed="false" data-g="' + gi + '">' + esc(o) + "</button>"; }).join("") + "</div></div>";
        }).join("") +
        '<div class="cta">' + (live ? '<a class="btn" href="' + esc(kf.url) + '"' + (/^https?:/.test(kf.url) ? ' target="_blank" rel="noopener"' : '') + '>Im ' + esc(kf.name) + " gestalten</a>" : "") +
        '<a class="btn' + (live ? " ghost" : "") + '" id="reqBtn" href="' + L.anfrage(p.id) + '">Unverbindlich anfragen</a></div>' +
        '<p class="cta-note">' + (p.varianten.length ? "Deine Auswahl wird in die Anfrage übernommen. " : "") + (kf && !live ? "Der " + esc(kf.name) + " geht in Kürze online." : "") + "</p>" +
        '<div class="acc">' +
        (p.text ? '<details open><summary>Beschreibung</summary><div class="acc-b">' + esc(p.text) + "</div></details>" : "") +
        (p.daten.length ? '<details' + (p.text ? "" : " open") + '><summary>Produktdaten</summary><div class="acc-b"><table><tbody>' + p.daten.map(function (d) { return '<tr><th scope="row">' + esc(d.label) + "</th><td>" + esc(d.wert) + "</td></tr>"; }).join("") + "</tbody></table></div></details>" : "") +
        (p.veredelung.length ? '<details><summary>Veredelung</summary><div class="acc-b"><div class="tags">' + p.veredelung.map(function (v) { return "<span>" + esc(DATA.veredelungen[v] || v) + "</span>"; }).join("") + "</div></div></details>" : "") +
        '<details><summary>Ablauf</summary><div class="acc-b">Du sendest deine unverbindliche Anfrage. Unsere Grafiker prüfen dein Design und senden dir die finale Druckdatei zur Freigabe. Erst mit deiner Freigabe startet die Produktion.</div></details>' +
        (p.bereiche.length < 2 ? "" : '<details><summary>Auch zu finden in</summary><div class="acc-b"><div class="tags">' + p.bereiche.map(function (x) { return '<a href="' + L.bereich(x, p.kategorie) + '">' + esc(IDX.bereich[x].name) + "</a>"; }).join("") + "</div></div></details>") +
        "</div></div></div>";
      var rel = DATA.produkte.filter(function (x) { return x.kategorie === p.kategorie && x.id !== p.id; }).slice(0, 4);
      if (rel.length) h += '<section class="block" style="padding-bottom:0"><div class="block-head"><h2>Das könnte dir auch gefallen</h2><a class="link-u" href="' + L.bereich(b, K.id) + '">Alle ' + esc(K.name) + "</a></div></section>" +
        '<div class="pgrid">' + rel.map(function (x) { return card(x, b); }).join("") + "</div>";
      html(root, h);
      var req = $("#reqBtn");
      $$(".opt", root).forEach(function (c) {
        c.addEventListener("click", function () {
          var g = c.dataset.g, on = c.getAttribute("aria-pressed") !== "true";
          $$('.opt[data-g="' + g + '"]', root).forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
          c.setAttribute("aria-pressed", on);
          if (on) sel[g] = c.textContent; else delete sel[g];
          $('[data-sel="' + g + '"]', root).textContent = on ? c.textContent : "";
          req.href = L.anfrage(p.id, Object.keys(sel).sort().map(function (k) { return p.varianten[k].name + ": " + sel[k]; }).join(" · "));
        });
      });
    }).catch(function (e) { fail(root, e); });
  }

  /* ---------- Konfiguratoren ---------- */
  function konfiguratoren() {
    var root = $("#kf-list");
    load().then(function () { if (!kfOn()) { location.replace("index.html"); return; } html(root, DATA.konfiguratoren.map(tile).join("")); }).catch(function (e) { fail(root, e); });
  }

  /* ---------- Start ---------- */
  window.SUBA = {
    init: function (page) {
      var go = function () {
        $$("[data-suba-nav]").forEach(function (el) { el.outerHTML = navHTML(el.getAttribute("data-variant")); });
        $$("[data-suba-footer]").forEach(function (el) { el.outerHTML = footerHTML(); });
        initHead(); initReveal();
        ({ home: home, katalog: katalog, produkt: produkt, konfiguratoren: konfiguratoren }[page] || function () {})();
      };
      /* Daten zuerst laden, damit der Kopf den Bereichsnamen kennt; bei Fehler trotzdem starten. */
      load().then(go, go);
    },
    load: load
  };
})();
