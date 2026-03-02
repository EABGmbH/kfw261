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

- `/.github/workflows/kfw261.yml` → täglich 06:05 Europe/Berlin (DST-sicher durch UTC + Laufzeit-Check)
- `/.github/workflows/interhyp.yml` → täglich 06:20 Europe/Berlin (DST-sicher durch UTC + Laufzeit-Check)
