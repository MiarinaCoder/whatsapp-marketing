import { Pool } from 'pg';

const db = new Pool({ connectionString: process.env.DATABASE_URL });
const WINDOW_48H = 48 * 60 * 60 * 1000;

export const attributionService = {
  async handleConversion(payload: {
    tenantId: string;
    contactPhone: string;
    orderId: string;
    orderAmount: number;
    convertedAt: string;
  }) {
    const convertedAt = new Date(payload.convertedAt);
    const windowStart = new Date(convertedAt.getTime() - WINDOW_48H);

    // Chercher le dernier message envoyé dans les 48h (1 seule requête, pas de N+1)
    const { rows: [lastMsg] } = await db.query(
      `SELECT id, step_id
       FROM scheduled_messages
       WHERE tenant_id = $1
         AND contact_phone = $2
         AND status = 'sent'
         AND sent_at BETWEEN $3 AND $4
       ORDER BY sent_at DESC
       LIMIT 1`,
      [payload.tenantId, payload.contactPhone, windowStart, convertedAt]
    );

    // Vérifier qu'aucune attribution n'existe déjà pour ce message
    if (lastMsg) {
      const { rows: [existing] } = await db.query(
        'SELECT id FROM attributions WHERE scheduled_msg_id = $1 LIMIT 1',
        [lastMsg.id]
      );
      if (existing) return; // "première attribution gagne"
    }

    // Récupérer le sequence_id via le step
    let sequenceId: string | null = null;
    if (lastMsg) {
      const { rows: [step] } = await db.query(
        'SELECT sequence_id FROM sequence_steps WHERE id = $1',
        [lastMsg.step_id]
      );
      sequenceId = step?.sequence_id ?? null;
    }

    await db.query(
      `INSERT INTO attributions
         (tenant_id, contact_phone, order_id, order_amount, converted_at, scheduled_msg_id, sequence_id, attribution_source)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (order_id) DO NOTHING`,
      [
        payload.tenantId, payload.contactPhone, payload.orderId,
        payload.orderAmount, convertedAt,
        lastMsg?.id ?? null, sequenceId,
        lastMsg ? 'whatsapp' : 'direct'
      ]
    );
  }
};