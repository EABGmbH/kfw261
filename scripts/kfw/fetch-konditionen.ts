import * as cheerio from 'cheerio';
import { normalizeWhitespace } from '../lib/text.js';

export const KFW_KONDITIONEN_URL =
  'https://www.kfw-formularsammlung.de/KonditionenanzeigerINet/KonditionenAnzeiger';

export interface KonditionenRow {
  programText: string;
  programNumber: string;
  anmerkung: string;
  zinsText: string;
  auszahlungText: string;
  bereitstellungsprovText: string;
  gueltigAb: string;
}

export interface KonditionenDocument {
  source: string;
  stand: string;
  rows: KonditionenRow[];
}

function extractStand(fullText: string): string {
  const normalized = normalizeWhitespace(fullText);
  const match = normalized.match(/STAND\s*:\s*(\d{2}\.\d{2}\.\d{4})/i);
  if (!match) {
    throw new Error('Konnte STAND-Datum in KfW-Seite nicht finden.');
  }
  return match[1];
}

function mapRow(cells: string[]): KonditionenRow {
  return {
    programText: cells[0] ?? '',
    programNumber: cells[1] ?? '',
    anmerkung: cells[2] ?? '',
    zinsText: cells[3] ?? '',
    auszahlungText: cells[4] ?? '',
    bereitstellungsprovText: cells[5] ?? '',
    gueltigAb: cells[6] ?? ''
  };
}

export async function fetchKonditionenDocument(): Promise<KonditionenDocument> {
  const response = await fetch(KFW_KONDITIONEN_URL, {
    method: 'GET',
    headers: {
      'user-agent': 'kfw-rates-fetcher/1.0 (+github-actions)'
    }
  });

  if (!response.ok) {
    throw new Error(`KfW HTTP Fehler: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const stand = extractStand($.root().text());

  const rows: KonditionenRow[] = [];

  $('table tr').each((_idx, tr) => {
    const cells = $(tr)
      .find('td')
      .toArray()
      .map((td) => normalizeWhitespace($(td).text()));

    if (cells.length < 7) {
      return;
    }

    const row = mapRow(cells);

    if (!/^\d{1,4}$/.test(row.programNumber)) {
      return;
    }

    rows.push(row);
  });

  if (rows.length === 0) {
    throw new Error('Keine verwertbaren Konditionszeilen gefunden.');
  }

  return {
    source: KFW_KONDITIONEN_URL,
    stand,
    rows
  };
}
