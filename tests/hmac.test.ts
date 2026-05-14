import { describe, it, expect } from 'vitest';
import { validateMetaSignature } from '../src/services/hmac.service.js';
import crypto from 'crypto';

describe('HMAC Validation', () => {
  const secret = 'test_secret';
  const payload = Buffer.from(JSON.stringify({ test: true }));

  it('valide une signature correcte', () => {
    const sig = `sha256=${crypto.createHmac('sha256', secret).update(payload).digest('hex')}`;
    expect(validateMetaSignature(payload, sig, secret)).toBe(true);
  });

  it('rejette une signature incorrecte', () => {
    expect(validateMetaSignature(payload, 'sha256=invalide', secret)).toBe(false);
  });
});