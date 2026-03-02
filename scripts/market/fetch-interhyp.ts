import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';
import { writeJsonAtomic } from '../lib/io.js';
import { assertRange, normalizeWhitespace, toGermanFloat } from '../lib/text.js';

const INTERHYP_URL = 'https://www.interhyp.de/zinsen/';

interface InterhypOutput {
  source: string;
  updatedAt: string;
  trancheYears: 10;
  ltvBucket: '>90';
  effectiveRatePercent: number;
}

function findTargetTable($: cheerio.CheerioAPI): cheerio.Cheerio<any> {
  const allTables = $('table').toArray();

  for (const tableEl of allTables) {
    const table = $(tableEl);
    const sectionText = normalizeWhitespace(table.parent().text());
    const headers = table
      .find('th')
      .toArray()
      .map((th) => normalizeWhitespace($(th).text()));

    const hasHeading = /zinstabelle\s*:\s*effektiver jahreszins/i.test(sectionText);
    const hasRequiredHeaders = headers.some((h) => /zinsbindung\s*tranche/i.test(h))
      && headers.some((h) => /beleihungsauslauf\s*>\s*90/i.test(h));

    if (hasHeading || hasRequiredHeaders) {
      return table;
    }
  }

  throw new Error('Interhyp-Zinstabelle nicht gefunden.');
}

async function run(): Promise<void> {
  const response = await fetch(INTERHYP_URL, {
    method: 'GET',
    headers: {
      'user-agent': 'interhyp-rates-fetcher/1.0 (+github-actions)'
    }
  });

  if (!response.ok) {
    throw new Error(`Interhyp HTTP Fehler: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const table = findTargetTable($);
  const headers = table
    .find('tr')
    .first()
    .find('th')
    .toArray()
    .map((th) => normalizeWhitespace($(th).text()));

  const trancheIndex = headers.findIndex((h) => /zinsbindung\s*tranche/i.test(h));
  const ltvIndex = headers.findIndex((h) => /beleihungsauslauf\s*>\s*90/i.test(h));

  if (trancheIndex < 0 || ltvIndex < 0) {
    throw new Error('Erforderliche Spalten nicht gefunden (Zinsbindung Tranche / Beleihungsauslauf >90).');
  }

  const bodyRows = table.find('tr').slice(1).toArray();
  const row = bodyRows.find((tr) => {
    const cells = $(tr)
      .find('td')
      .toArray()
      .map((td) => normalizeWhitespace($(td).text()));
    return (cells[trancheIndex] ?? '') === '10';
  });

  if (!row) {
    throw new Error('Zeile für Zinsbindung Tranche = 10 nicht gefunden.');
  }

  const rowCells = $(row)
    .find('td')
    .toArray()
    .map((td) => normalizeWhitespace($(td).text()));

  const rateText = rowCells[ltvIndex] ?? '';
  if (!rateText.includes('%')) {
    throw new Error(`Interhyp-Zelle enthält keinen Prozentwert: "${rateText}"`);
  }

  const effectiveRatePercent = toGermanFloat(rateText);
  assertRange(effectiveRatePercent, 0, 15, 'Interhyp Effektivzins');

  const output: InterhypOutput = {
    source: INTERHYP_URL,
    updatedAt: new Date().toISOString(),
    trancheYears: 10,
    ltvBucket: '>90',
    effectiveRatePercent
  };

  const currentFile = fileURLToPath(import.meta.url);
  const repoRoot = path.resolve(path.dirname(currentFile), '..', '..');
  const outputPath = path.join(repoRoot, 'data', 'market', 'interhyp_10y_ltv_gt90.json');

  await writeJsonAtomic(outputPath, output);
  console.log(`Interhyp-Zins aktualisiert: ${outputPath}`);
}

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Interhyp Fetch fehlgeschlagen: ${message}`);
  process.exitCode = 1;
});
