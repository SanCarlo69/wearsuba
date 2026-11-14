// Vercel Serverless Function: nimmt Anfragen aus den Konfiguratoren entgegen
// und verschickt sie per E-Mail (über Resend, https://resend.com).
//
// Benötigte Umgebungsvariablen in Vercel (Project → Settings → Environment Variables):
//   RESEND_API_KEY   API-Schlüssel von Resend (beginnt mit "re_")
//   MAIL_FROM        Absender, z. B.  SUBA Konfigurator <konfigurator@wearsuba.com>
//                    (die Domain muss in Resend verifiziert sein)
//   MAIL_TO          Empfänger bei SUBA, z. B. info@wearsuba.com
//
// Es werden zwei E-Mails verschickt:
//   1. an SUBA: alle Daten + Zusammenfassung, Technical Sheet (EN), Druckvorlagen 1:1 (SVG),
//      Designdaten (JSON) und hochgeladene Logos als Anhang
//   2. an den Kunden: Bestätigung mit seiner Zusammenfassung (PDF)

const MAX_BYTES = 4_000_000;

const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const okMail = (m) => typeof m === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m) && m.length < 200;
const cleanName = (n) => String(n || "datei").replace(/[^\w.\-äöüÄÖÜ ]+/g, "_").slice(0, 120);

function adresse(a) {
  if (!a) return "";
  return [a.name, a.strasse, [a.plz, a.ort].filter(Boolean).join(" "), a.land].filter(Boolean).map(esc).join("<br>");
}

function tabelle(rows) {
  return '<table cellpadding="6" style="border-collapse:collapse;font:14px Arial,sans-serif">' +
    rows.filter(([, v]) => v !== undefined && v !== null && v !== "").map(([k, v]) =>
      `<tr><td style="color:#666;vertical-align:top;border-top:1px solid #eee;white-space:nowrap">${esc(k)}</td><td style="border-top:1px solid #eee">${v}</td></tr>`).join("") +
    "</table>";
}

async function senden(key, mail) {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(mail),
  });
  if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text()}`);
  return r.json();
}

export default async function handler(req, res) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ error: "Nur POST" }); }
  const key = process.env.RESEND_API_KEY, from = process.env.MAIL_FROM, to = process.env.MAIL_TO || "info@wearsuba.com";
  if (!key || !from) return res.status(500).json({ error: "E-Mail-Versand ist nicht eingerichtet" });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { return res.status(400).json({ error: "Ungültige Daten" }); } }
  if (!body || typeof body !== "object") return res.status(400).json({ error: "Ungültige Daten" });
  if (JSON.stringify(body).length > MAX_BYTES * 1.4) return res.status(413).json({ error: "Anfrage zu gross" });

  const a = body.anfrage || {};
  const produkt = String(body.produkt || "Konfigurator").slice(0, 40);
  if (!a.name || !okMail(a.email)) return res.status(400).json({ error: "Name und gültige E-Mail fehlen" });

  const anh = (Array.isArray(body.attachments) ? body.attachments : []).slice(0, 12)
    .filter((x) => x && typeof x.content === "string" && x.content.length < 3_500_000)
    .map((x) => ({ filename: cleanName(x.filename), content: x.content, kunde: !!x.kunde }));

  const preis = a.richtpreis
    ? `${Number(a.richtpreis.proSchal ?? a.richtpreis.proStueck ?? 0).toFixed(2)} ${esc(a.richtpreis.waehrung || "EUR")} pro Stück · gesamt ${Number(a.richtpreis.gesamt || 0).toFixed(2)} ${esc(a.richtpreis.waehrung || "EUR")} (Staffel ab ${esc(a.richtpreis.staffel)})`
    : "auf Anfrage";
  const fehlt = (body.logosFehlen || []).map(esc).join(", ");

  const htmlSuba = `<div style="font:14px Arial,sans-serif;color:#111">
    <h2 style="margin:0 0 4px">Neue Anfrage: ${esc(produkt)}-Konfigurator</h2>
    <p style="margin:0 0 16px;color:#666">${esc(new Date(a.zeit || Date.now()).toLocaleString("de-CH", { timeZone: "Europe/Zurich" }))}</p>
    ${tabelle([
      ["Name", esc(a.name)], ["Verein / Firma", esc(a.organisation)], ["E-Mail", `<a href="mailto:${esc(a.email)}">${esc(a.email)}</a>`], ["Telefon", esc(a.telefon)],
      ["Modell", esc([a.modell, a.artikel].filter(Boolean).join(" · "))], ["Masse", esc(a.masse)], ["Material", esc(a.material)],
      ["Menge", esc(a.menge)], ["Garnfarben", esc((a.garnfarben || []).join(", "))], ["Richtpreis", preis],
      ["Lieferadresse", adresse(a.lieferadresse)], ["Rechnungsadresse", a.rechnungsadresse ? adresse(a.rechnungsadresse) : "wie Lieferadresse"],
      ["Bemerkung", esc(a.bemerkung)], ["Prüfhinweise", esc((a.pruefhinweise || []).join(" · "))],
      ["Logos fehlen (zu gross)", fehlt],
    ])}
    <p style="margin-top:16px">Im Anhang: Zusammenfassung, Technical Sheet (EN) für den Lieferanten, Druckvorlage(n) 1:1 als SVG, Designdaten (JSON)${anh.some((x) => x.filename.startsWith("Logo-")) ? " und die hochgeladenen Logos" : ""}.</p>
  </div>`;

  try {
    await senden(key, {
      from, to: [to], reply_to: a.email,
      subject: `Anfrage ${produkt}: ${a.organisation || a.name} · ${a.menge || "?"} Stk. ${a.modell || ""}`.trim(),
      html: htmlSuba,
      attachments: anh.map(({ filename, content }) => ({ filename, content })),
    });
  } catch (e) {
    console.error(e);
    return res.status(502).json({ error: "Versand fehlgeschlagen" });
  }

  // Bestätigung an den Kunden (Fehler hier blockieren die Anfrage nicht)
  try {
    const kundenPdf = anh.filter((x) => x.kunde).map(({ filename, content }) => ({ filename, content }));
    await senden(key, {
      from, to: [a.email], reply_to: to,
      subject: `Deine Anfrage bei SUBA: ${produkt}`,
      html: `<div style="font:14px Arial,sans-serif;color:#111;max-width:560px">
        <p>Hallo ${esc(a.name)},</p>
        <p>danke für deine Anfrage! Wir haben dein Design für ${esc(a.menge)} × ${esc(a.modell || produkt)} erhalten. Im Anhang findest du deine Zusammenfassung.</p>
        <p>So geht es weiter: Unsere Grafiker prüfen dein Design und senden dir die finale Druckdatei zur Freigabe. Erst mit deiner Freigabe kommt eine Bestellung zustande.</p>
        <p>Fragen? Antworte einfach auf diese E-Mail.</p>
        <p>Viele Grüsse<br>Dein SUBA-Team<br><a href="https://wearsuba.com">wearsuba.com</a></p>
        <p style="color:#888;font-size:12px">SUBA Group AG · Münchhaldenstrasse 7 · 8008 Zürich</p></div>`,
      attachments: kundenPdf,
    });
  } catch (e) { console.error(e); }

  return res.status(200).json({ ok: true });
}

