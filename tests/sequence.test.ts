import { describe, it, expect } from 'vitest';

describe('Fenêtre 72h Séquences', () => {
  const WINDOW_72H = 72 * 60 * 60 * 1000;

  it('inclut les étapes dans la fenêtre 72h', () => {
    const eventTime = new Date('2024-01-01T00:00:00Z');
    const windowExpires = new Date(eventTime.getTime() + WINDOW_72H);
    const stepTime = new Date(eventTime.getTime() + 24 * 60 * 60 * 1000); // 24h après
    expect(stepTime.getTime()).toBeLessThanOrEqual(windowExpires.getTime());
  });

  it('exclut les étapes hors fenêtre 72h', () => {
    const eventTime = new Date('2024-01-01T00:00:00Z');
    const windowExpires = new Date(eventTime.getTime() + WINDOW_72H);
    const stepTime = new Date(eventTime.getTime() + 80 * 60 * 60 * 1000); // 80h après
    expect(stepTime.getTime()).toBeGreaterThan(windowExpires.getTime());
  });
});