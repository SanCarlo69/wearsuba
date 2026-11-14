# Konfiguratoren auf wearsuba.com – Einrichtung

Der Schal-Konfigurator läuft jetzt direkt auf der Website (`schal-konfigurator.html`), ohne Claude.
Schickt ein Kunde eine Anfrage, erzeugt sein Browser alle Dateien und `api/anfrage.js` verschickt sie per E-Mail.

## Was in der E-Mail an SUBA ankommt
- Alle Kundendaten, Modell, Menge, Garnfarben, Richtpreis, Lieferadresse
- Zusammenfassung (PDF)
- Technical Sheet auf Englisch für den Lieferanten (PDF)
- Druckvorlage 1:1 als SVG (Vorder- und ggf. Rückseite, öffnet in Illustrator)
- Designdaten (JSON)
- die hochgeladenen Logos
„Antworten“ geht direkt an den Kunden. Der Kunde bekommt automatisch eine Bestätigung mit seiner Zusammenfassung.

## Einmalig einrichten (ca. 20 Minuten)

### 1. Resend (E-Mail-Versand)
1. Konto anlegen auf https://resend.com (Gratis-Tarif reicht zum Start).
2. **Domains → Add Domain → `wearsuba.com`**. Resend zeigt einige DNS-Einträge (TXT/MX).
   Diese beim Domain-Anbieter von wearsuba.com eintragen und in Resend auf „Verify“ klicken.
3. **API Keys → Create API Key** (Berechtigung „Sending access“). Den Schlüssel (`re_…`) kopieren.

### 2. Vercel
1. Projekt öffnen → **Settings → Environment Variables**, drei Einträge anlegen:
   - `RESEND_API_KEY` = der Schlüssel aus Resend
   - `MAIL_FROM` = `SUBA Konfigurator <konfigurator@wearsuba.com>`
   - `MAIL_TO` = `info@wearsuba.com`
2. Danach einmal neu deployen (Deployments → … → Redeploy) oder neue Dateien hochladen.
3. Hinweis: Der Gratis-Tarif „Hobby“ ist laut Vercel nur für private, nicht-kommerzielle Projekte. Für eine Firmenseite ist der Pro-Tarif vorgesehen.

### 3. Testen
`wearsuba.com/schal-konfigurator.html` öffnen, Schal gestalten, Anfrage mit eigener E-Mail senden.
Es müssen zwei E-Mails ankommen: eine an info@ mit Anhängen, eine Bestätigung an dich.

## Preise ändern
Datei `data/schal-preise.json`: Verkaufspreis pro Schal je Staffel. **Nur Verkaufspreise eintragen, nie Einkaufspreise** – die Datei ist öffentlich lesbar.
Fehlt ein Preis, zeigt der Konfigurator „Preis auf Anfrage“.

## Grenzen
- Eine Anfrage darf mit allen Dateien höchstens ca. 4 MB gross sein. Sehr grosse Logos werden nicht mitgeschickt; der Kunde wird dann gebeten, sie an info@ zu senden.
- Die Admin-Ansichten aus der Claude-Version (Preise pflegen, Anfragen-Liste) gibt es hier nicht: Preise stehen in der JSON-Datei, Anfragen im Postfach.
