import { Pool } from 'pg';
import { Queue } from 'bullmq';
import { WhatsAppEvent } from '../types/index.js';

const db = new Pool({ connectionString: process.env.DATABASE_URL });
const messageQueue = new Queue('scheduled-messages', {
  connection: { host: 'localhost', port: 6379 }
});

const WINDOW_72H = 72 * 60 * 60 * 1000;

export const sequenceService = {
  async triggerSequences(event: WhatsAppEvent) {
    const windowExpires = new Date(event.timestamp.getTime() + WINDOW_72H);

    // Trouver séquences actives du tenant
    const { rows: sequences } = await db.query(
      `SELECT s.id, ss.id as step_id, ss.delay_minutes, ss.step_order
       FROM sequences s
       JOIN sequence_steps ss ON ss.sequence_id = s.id
       WHERE s.tenant_id = $1 AND s.trigger = 'free_window_opened' AND s.is_active = true
       ORDER BY ss.step_order`,
      [event.tenantId]
    );

    let cumulativeDelay = 0;
    for (const step of sequences) {
      cumulativeDelay += step.delay_minutes;
      const scheduledAt = new Date(event.timestamp.getTime() + cumulativeDelay * 60000);

      // Exclure les étapes hors fenêtre 72h
      if (scheduledAt > windowExpires) continue;

      const { rows: [msg] } = await db.query(
        `INSERT INTO scheduled_messages (tenant_id, contact_phone, step_id, scheduled_at, window_expires_at)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [event.tenantId, event.contactPhone, step.step_id, scheduledAt, windowExpires]
      );

      const delay = scheduledAt.getTime() - Date.now();
      await messageQueue.add('send', { messageId: msg.id }, { delay: Math.max(0, delay) });
    }
  }
};