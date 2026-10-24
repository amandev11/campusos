const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

export function makeId(prefix: string): string {
  let suffix = '';
  for (let i = 0; i < 8; i += 1) {
    suffix += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `${prefix}-${suffix}`;
}

/** Human-readable booking reference, e.g. CAMP-ND1-4F91Z. */
export function makeReference(lotCode: string): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 5; i += 1) suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `CAMP-${lotCode.replace(/-/g, '')}-${suffix}`;
}

export function stableHash(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}
