import crypto from 'crypto';

export function validateMetaSignature(
  payload: Buffer,
  signature: string,
  appSecret: string
): boolean {
  const expected = `sha256=${crypto
    .createHmac('sha256', appSecret)
    .update(payload)
    .digest('hex')}`;
  // Comparaison en temps constant (éviter timing attacks)
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature)
  );
}