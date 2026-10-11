import fs from 'node:fs';
import path from 'node:path';

/**
 * Dev-only write-back: merges the mutated collection back into db.json so
 * the single data source stays true across dev restarts. Read-merge-write,
 * per top-level key, so stores don't clobber each other. No-ops in
 * production (serverless FS is read-only — see docs/DATA.md).
 */
export function persistDbDev(patch: Record<string, unknown>): void {
  if (process.env.NODE_ENV !== 'development') return;
  try {
    const file = path.join(process.cwd(), 'src', 'data', 'db.json');
    const current = JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, unknown>;
    fs.writeFileSync(file, JSON.stringify({ ...current, ...patch }, null, 2) + '\n');
  } catch (error) {
    console.warn('[addis-eats] dev write-back to db.json failed:', error);
  }
}