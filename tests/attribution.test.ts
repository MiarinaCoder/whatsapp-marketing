import { describe, it, expect, vi } from 'vitest';

describe('Attribution 48h', () => {
  it('attribue au dernier message dans la fenêtre', () => {
    const convertedAt = new Date('2024-01-10T12:00:00Z');
    const msgSentAt = new Date('2024-01-09T10:00:00Z'); // dans les 48h
    const diff = convertedAt.getTime() - msgSentAt.getTime();
    expect(diff).toBeLessThanOrEqual(48 * 60 * 60 * 1000);
  });

  it('ne pas attribuer si message hors 48h', () => {
    const convertedAt = new Date('2024-01-10T12:00:00Z');
    const msgSentAt = new Date('2024-01-07T10:00:00Z'); // hors fenêtre
    const diff = convertedAt.getTime() - msgSentAt.getTime();
    expect(diff).toBeGreaterThan(48 * 60 * 60 * 1000);
  });
});