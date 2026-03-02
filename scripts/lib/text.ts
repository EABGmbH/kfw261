export function normalizeWhitespace(input: string): string {
  return input
    .replace(/\u00A0/g, ' ')
    .replace(/[\t\r\n]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function toGermanFloat(raw: string): number {
  const normalized = normalizeWhitespace(raw)
    .replace(/%/g, '')
    .replace(/\./g, '')
    .replace(',', '.');

  const value = Number.parseFloat(normalized);
  if (!Number.isFinite(value)) {
    throw new Error(`Ungültige Zahl: "${raw}"`);
  }
  return value;
}

export function parseRatePair(raw: string): { sollzinsPercent: number; effektivzinsPercent: number } {
  const normalized = normalizeWhitespace(raw);
  const match = normalized.match(/([0-9]+,[0-9]+)\s*\(\s*([0-9]+,[0-9]+)\s*\)/);
  if (!match) {
    throw new Error(`Zinsformat nicht erkannt: "${raw}"`);
  }

  return {
    sollzinsPercent: toGermanFloat(match[1]),
    effektivzinsPercent: toGermanFloat(match[2])
  };
}

export function assertRange(value: number, min: number, max: number, field: string): void {
  if (value < min || value > max) {
    throw new Error(`${field} außerhalb plausibler Grenzen: ${value} (erwartet ${min}..${max})`);
  }
}
