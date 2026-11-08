/**
 * Sovereign In-Browser Cryptographic Hasher
 * Uses standard Web Crypto API (crypto.subtle.digest).
 * Zero server communication. Zero external libraries.
 */

export type HashAlgorithm = 'SHA-256' | 'SHA-512' | 'SHA-384' | 'SHA-1';

export async function computeHash(data: ArrayBuffer, algorithm: HashAlgorithm): Promise<string> {
  const hashBuffer = await crypto.subtle.digest(algorithm, data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function hashText(text: string, algorithm: HashAlgorithm): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  return computeHash(data.buffer, algorithm);
}

export async function hashFile(file: File, algorithm: HashAlgorithm): Promise<string> {
  const buffer = await file.arrayBuffer();
  return computeHash(buffer, algorithm);
}

export interface MultiHashResult {
  sha256: string;
  sha512: string;
  sha384: string;
  sha1: string;
}

export async function computeAllHashes(data: ArrayBuffer): Promise<MultiHashResult> {
  const [sha256, sha512, sha384, sha1] = await Promise.all([
    computeHash(data, 'SHA-256'),
    computeHash(data, 'SHA-512'),
    computeHash(data, 'SHA-384'),
    computeHash(data, 'SHA-1'),
  ]);
  return { sha256, sha512, sha384, sha1 };
}
