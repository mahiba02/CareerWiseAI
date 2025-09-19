import crypto from 'crypto';

export function stableHash(parts: Array<string | undefined | null>): string {
  const norm = parts.map(p => (p || '').trim().toLowerCase()).join('|');
  return crypto.createHash('sha256').update(norm).digest('hex');
}
