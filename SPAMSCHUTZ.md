# Cookie-Hinweis und Spamschutz

## Cookie-Hinweis (`assets/consent.js`)
- Läuft auf allen Seiten, auf Deutsch und Englisch.
- Zwei Stufen: **Notwendig** (speichert nur die Auswahl) und **Statistik** (Vercel Web Analytics).
- Vercel Web Analytics wird **erst nach Zustimmung** geladen. Ohne Zustimmung: keine Statistik.
- Unten auf jeder Seite: „Cookie-Einstellungen“ zum Ändern oder Widerrufen.

## Spamschutz Kontaktformular (`assets/spamschutz.js`)
Sofort aktiv, ohne Konto:
1. **Unsichtbares Feld** (`_gotcha`): Bots füllen es aus, Formspree verwirft die Anfrage.
2. **Zeitsperre**: Absenden in unter 3 Sekunden wird nicht verschickt.
3. **Link-Sperre**: mehr als 3 Links in der Nachricht werden abgelehnt.

Zusätzlich, sobald eingerichtet: **Captcha mit Cloudflare Turnstile** (kostenlos, meist unsichtbar, kein Bilderrätsel).

### Turnstile einrichten (ca. 10 Minuten)
1. Kostenloses Konto auf https://dash.cloudflare.com anlegen (mit info@wearsuba.com).
2. Links **Turnstile** → **Add widget**.
   - Widget name: `wearsuba Kontaktformular`
   - Hostnames: `wearsuba.com`, `www.wearsuba.com`, `wearsuba.vercel.app`
   - Widget Mode: **Managed**
3. Cloudflare zeigt zwei Schlüssel: **Site Key** und **Secret Key**.
4. **Secret Key** in Formspree eintragen: https://formspree.io → Formular `mzdqnbly` → **Settings** → **CAPTCHA** → **Adjust settings** → **Cloudflare Turnstile** → Secret Key einfügen → speichern.
5. **Site Key** in `assets/spamschutz.js` ganz oben eintragen:
   `var TURNSTILE_SITEKEY = "0x4AAAA...";`
   (oder Claude den Site Key schicken, dann trägt Claude ihn ein).

Wichtig: Erst beides zusammen aktivieren. Ist der Secret Key in Formspree hinterlegt, aber der Site Key fehlt auf der Website, lehnt Formspree alle Anfragen ab.
