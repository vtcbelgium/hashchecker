import { describe, it, expect } from 'vitest';
import { hashText, computeHash } from '../src/hasher.ts';

describe('Web Crypto Hasher', () => {
  it('computes known SHA-256 hash for empty string', async () => {
    const hash = await hashText('', 'SHA-256');
    expect(hash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  it('computes known SHA-256 hash for hello world', async () => {
    const hash = await hashText('hello world', 'SHA-256');
    expect(hash).toBe('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');
  });

  it('computes known SHA-1 hash for hello world', async () => {
    const hash = await hashText('hello world', 'SHA-1');
    expect(hash).toBe('2aae6c35c94fcfb415dbe95f408b9ce91ee846ed');
  });

  it('computes known SHA-512 hash for hello world', async () => {
    const hash = await hashText('hello world', 'SHA-512');
    expect(hash).toBe('309ecc489c12d6eb4cc40f50c902f2b4d0ed77ee511a7c7a9bcd3ca86d4cd86f989dd35bc5ff499670da34255b45b0cfd830e81f605dcf7dc5542e93ae9cd76f');
  });
});
