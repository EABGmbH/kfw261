# Daily Rate Fetcher (KfW 261 + Interhyp)

## Lokal testen

1. Node.js 20 verwenden.
2. Abhängigkeiten installieren:
   - `npm ci`
3. KfW 261 laden:
   - `npm run kfw:261`
4. Interhyp laden:
   - `npm run market:interhyp`

## Ergebnisdateien

- `data/kfw/261.json`
- `data/market/interhyp_10y_ltv_gt90.json`

## Validierungsverhalten

- Bei Parsing-/Validierungsfehlern wird **nicht** geschrieben (last-known-good bleibt erhalten).
- Das Skript endet mit Exit Code 1.

## GitHub Actions

- `/.github/workflows/kfw261.yml` → täglich 09:05 Europe/Berlin (DST-sicher durch UTC + Laufzeit-Check)
- `/.github/workflows/interhyp.yml` → täglich 09:20 Europe/Berlin (DST-sicher durch UTC + Laufzeit-Check)

## Vollautomatisch auf IONOS deployen

Workflow: `/.github/workflows/deploy-ionos.yml`

In GitHub unter **Settings → Secrets and variables → Actions** folgende Secrets anlegen:

- `IONOS_FTP_SERVER` (z. B. `home123456789.1and1-data.host`)
- `IONOS_FTP_USERNAME`
- `IONOS_FTP_PASSWORD`
- `IONOS_FTP_REMOTE_DIR` (z. B. `/` oder `/htdocs/` je nach IONOS-Vertrag)

Dann läuft alles automatisch:

1. Täglich werden KfW/Interhyp-Daten aktualisiert.
2. Die JSON-Dateien werden in GitHub committed.
3. Jeder Push auf `main` triggert den IONOS-Deploy-Workflow.
4. Die Homepage liest die aktuellen Zinsen aus `data/kfw/261.json` und `data/market/interhyp_10y_ltv_gt90.json`.
