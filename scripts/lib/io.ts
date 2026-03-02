import { mkdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

export async function writeJsonAtomic(filePath: string, payload: unknown): Promise<void> {
  const dir = path.dirname(filePath);
  await mkdir(dir, { recursive: true });

  const tmpPath = `${filePath}.tmp`;
  const json = `${JSON.stringify(payload, null, 2)}\n`;
  await writeFile(tmpPath, json, 'utf8');
  await rename(tmpPath, filePath);
}
