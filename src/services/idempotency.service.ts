import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!);
const TTL_24H = 24 * 60 * 60;

export async function isEventDuplicate(eventId: string): Promise<boolean> {
  const key = `event:${eventId}`;
  const result = await redis.set(key, '1', 'EX', TTL_24H, 'NX');
  return result === null; // null = clé existait déjà = doublon
}