# WearSUBA Website – Produktpflege

Alle Produkte, Bereiche, Kategorien und Konfiguratoren stehen an **einer Stelle**: `data/katalog.json`.
Die Seiten lesen diese Datei beim Laden. Wenn du dort etwas änderst, ist es überall geändert,
in jedem Bereich, auf jeder Kategorie- und Produktseite und auf der Startseite.

## Aufbau der Website

| Datei | Inhalt |
|---|---|
| `index.html` | Startseite (bisherige Seite) mit den 4 Bereichen, Schwerpunkt Sportswear, Konfiguratoren, Anfrageformular |
| `produkte.html` | Katalog. `?bereich=sportswear` zeigt einen Bereich, `&kategorie=schals` eine Kategorie |
| `produkt.html?id=…` | Produktdetailseite, für jedes Produkt automatisch |
| `konfiguratoren.html` | Übersicht aller Konfiguratoren |
| `assets/suba.css` | Design (Teil 1 = bisherige Seite, Teil 2 = Erweiterung) |
| `assets/suba.js` | Logik aller Seiten. Muss für neue Produkte nicht angefasst werden |
| `data/katalog.json` | **Alle Produktdaten** |
| `img/produkte/` | Produktbilder |

## Häufige Aufgaben

### Produkt einem weiteren Bereich zuordnen
Beim Produkt die Liste `bereiche` ergänzen, z. B. `"bereiche": ["sportswear", "workwear"]`.
Mögliche Werte: `sportswear`, `workwear`, `retail`, `personal-brand`.

### Neues Produkt anlegen
1. Bild nach `img/produkte/` legen (am besten quadratisch, weisser Hintergrund, ca. 900 px).
2. In `katalog.json` unter `produkte` einen bestehenden Eintrag kopieren und anpassen:

```json
{
  "id": "schal-premium",
  "name": "Premium-Schal",
  "kategorie": "schals",
  "bereiche": ["sportswear", "retail"],
  "kurz": "Ein Satz für die Produktkarte.",
  "bilder": ["img/produkte/schal-premium.jpg"],
  "mindestmenge": "50 Stück",
  "daten": [{ "label": "Material", "wert": "100 % Acryl" }],
  "varianten": [{ "name": "Grösse", "optionen": ["140 × 18 cm", "160 × 20 cm"] }],
  "veredelung": ["jacquard"],
  "text": "Längere Beschreibung für die Produktseite.",
  "konfigurator": "schal",
  "highlights": []
}
```

- `id`: eindeutig, nur Kleinbuchstaben und Bindestriche. Daraus wird die Adresse `produkt.html?id=schal-premium`.
- `veredelung`: Kürzel aus der Liste `veredelungen` oben in der Datei.
- `konfigurator`: Kürzel eines Konfigurators oder `null`.
- Die Kundin oder der Kunde kann jede Option unter `varianten` anklicken. Die Auswahl landet automatisch in der Anfrage.

### Neue Kategorie oder neuer Bereich
Unter `kategorien` bzw. `bereiche` einen Eintrag ergänzen (id, Name, Bild, Text).
Die Kategorie erscheint automatisch überall, sobald ein Produkt sie verwendet.
Für einen neuen Bereich auf der Startseite muss zusätzlich ein Panel in `index.html` ergänzt werden.

### Konfigurator einbinden oder freischalten
Konfiguratoren sind unter `konfiguratoren` eingetragen. Produkte verweisen nur auf deren `id`.
Dadurch ist derselbe Konfigurator von jedem Produkt und jedem Bereich aus erreichbar.

1. Den Konfigurator in Claude öffnen und über **Teilen** auf „Jeder mit dem Link“ stellen.
2. Danach den Konfigurator einmal ohne Anmeldung testen, z. B. in einem privaten Browserfenster: Preis sichtbar? Anfrage sendbar?
3. In `katalog.json` beim Konfigurator `"aktiv": true` setzen.

Solange `aktiv` auf `false` steht, zeigt die Website „Online in Kürze“, und der Button führt zur normalen Anfrage.
Ein neuer Konfigurator wird genauso eingetragen: `id`, `name`, `url`, `text`, `bild`, `aktiv`.

### Änderungen online stellen
Geänderte Dateien ins GitHub-Repo hochladen. Vercel veröffentlicht automatisch.

**Tipp:** Nach dem Bearbeiten die JSON-Datei kurz prüfen, z. B. auf jsonlint.com. Ein fehlendes Komma verhindert,
dass die Produkte laden. Die Seite zeigt dann einen Hinweis statt der Produkte.

## Bereiche: Katalog, Referenzen oder Anfrage
Jeder Bereich hat in `katalog.json` einen `typ`:
- `katalog`: zeigt Kategorien und Produkte (aktuell nur Sportswear & Merchandise).
- `showcase`: zeigt Referenzprojekte aus `referenzen` (aktuell Personal Brand mit Brandrise und Nido55).
- `anfrage`: einfache Seite mit Anfrage-Button (aktuell Workwear und Retail, bis deren Sortiment steht).

Soll ein Produkt später auch in Workwear erscheinen: Bereich auf `"typ": "katalog"` stellen und beim Produkt `"bereiche": ["sportswear", "workwear"]` eintragen.

### Neue Referenz-Marke
Unter `referenzen` einen Eintrag kopieren: `name`, `url`, `claim`, `text`, `fakten`, `bilder` (erstes Bild gross, die nächsten vier als Reihe).
Bilder können Dateien in `img/referenzen/` sein oder Adressen aus dem Shop der Marke.
Eigene Dateien sind sicherer, weil sich Shop-Adressen ändern können.

### Konfiguratoren ein- oder ausblenden
Oben in `katalog.json` steht `"konfiguratoren_sichtbar": false`. Solange das so ist, zeigt die Website keine Konfiguratoren:
kein Menüpunkt „Selbst gestalten“, keine Kacheln, keine Hinweise auf Produktseiten. Zum Freischalten auf `true` setzen.

## Kategorien ausblenden

In `data/katalog.json` steht `"kategorien_ausgeblendet": ["gastro"]`. Alle Produkte dieser Kategorien verschwinden von der Webseite (Katalog, Suche, Bereichsseiten). Zum Einblenden die Kategorie aus der Liste entfernen.

## Englische Version

Die Webseite gibt es auf Deutsch und Englisch. Oben rechts wechselt man mit **DE | EN**.

- **Produkte, Kategorien, Bereiche, Referenzen:** `data/katalog.en.json` hat denselben Aufbau wie `data/katalog.json`, nur die Texte sind englisch. Wer ein Produkt in `katalog.json` ergänzt oder ändert, trägt es dort gleich mit ein (gleiche `id`, gleiche Bildpfade).
- **Feste Texte der Bereichs- und Produktseiten, Kopf, Footer, Cookie-Banner:** `assets/i18n-en.js` (Liste aus deutschem Original und englischem Text). Wird ein deutscher Satz in `assets/suba.js` geändert, hier denselben Eintrag anpassen.
- **Startseite und Rechtstexte:** eigene Dateien `index-en.html`, `impressum-en.html`, `agb-en.html`, `datenschutz-en.html`. Bei den Rechtstexten gilt im Zweifel die deutsche Fassung (steht als Hinweis auf den englischen Seiten).
- Die gewählte Sprache merkt sich der Browser; Links mit `?lang=en` oder `?lang=de` setzen sie direkt.
