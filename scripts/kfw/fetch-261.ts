import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeJsonAtomic } from '../lib/io.js';
import { assertRange, normalizeWhitespace, parseRatePair, toGermanFloat } from '../lib/text.js';
import { fetchKonditionenDocument } from './fetch-konditionen.js';

interface Kfw261Rate {
  variant: '10/2/10' | '20/3/10' | '30/5/10';
  sollzinsPercent: number;
  effektivzinsPercent: number;
  auszahlungPercent: number;
  bereitstellungsprovPercentPerMonth: number;
  gueltigAb: string;
}

interface Kfw261Output {
  source: string;
  stand: string;
  updatedAt: string;
  program: 261;
  rates: Kfw261Rate[];
}

const TARGET_VARIANTS = ['10/2/10', '20/3/10', '30/5/10'] as const;

function extractVariant(programText: string): Kfw261Rate['variant'] | null {
  const normalized = normalizeWhitespace(programText).replace(/\s+/g, '');

  if (normalized.includes('10/2/10')) return '10/2/10';
  if (normalized.includes('20/3/10')) return '20/3/10';
  if (normalized.includes('30/5/10')) return '30/5/10';

  return null;
}

async function run(): Promise<void> {
  const doc = await fetchKonditionenDocument();

  const matches = doc.rows
    .filter((row) => row.programNumber === '261')
    .map((row) => {
      const variant = extractVariant(row.programText);
      if (!variant) {
        return null;
      }

      const { sollzinsPercent, effektivzinsPercent } = parseRatePair(row.zinsText);
      const auszahlungPercent = toGermanFloat(row.auszahlungText);
      const bereitstellungsprovPercentPerMonth = toGermanFloat(row.bereitstellungsprovText);

      assertRange(sollzinsPercent, 0, 15, `Sollzins ${variant}`);
      assertRange(effektivzinsPercent, 0, 15, `Effektivzins ${variant}`);
      assertRange(auszahlungPercent, 0, 150, `Auszahlung ${variant}`);
      assertRange(bereitstellungsprovPercentPerMonth, 0, 15, `Bereitstellungsprov ${variant}`);

      return {
        variant,
        sollzinsPercent,
        effektivzinsPercent,
        auszahlungPercent,
        bereitstellungsprovPercentPerMonth,
        gueltigAb: row.gueltigAb
      } satisfies Kfw261Rate;
    })
    .filter((item): item is Kfw261Rate => item !== null);

  const byVariant = new Map<Kfw261Rate['variant'], Kfw261Rate>();
  for (const entry of matches) {
    if (!byVariant.has(entry.variant)) {
      byVariant.set(entry.variant, entry);
    }
  }

  const rates: Kfw261Rate[] = TARGET_VARIANTS.map((variant) => {
    const item = byVariant.get(variant);
    if (!item) {
      throw new Error(`Fehlende Variante für KfW 261: ${variant}`);
    }
    return item;
  });

  if (rates.length !== 3) {
    throw new Error(`Validierung fehlgeschlagen: erwartet 3 Treffer, erhalten ${rates.length}`);
  }

  const output: Kfw261Output = {
    source: doc.source,
    stand: doc.stand,
    updatedAt: new Date().toISOString(),
    program: 261,
    rates
  };

  const currentFile = fileURLToPath(import.meta.url);
  const repoRoot = path.resolve(path.dirname(currentFile), '..', '..');
  const outputPath = path.join(repoRoot, 'data', 'kfw', '261.json');

  await writeJsonAtomic(outputPath, output);
  console.log(`KfW 261 aktualisiert: ${outputPath}`);
}

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`KfW 261 Fetch fehlgeschlagen: ${message}`);
  process.exitCode = 1;
});
