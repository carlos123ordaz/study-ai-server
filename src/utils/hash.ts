import crypto from 'crypto';

export function computeFileHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export function computeStringHash(input: string): string {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}
