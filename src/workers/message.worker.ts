import { Worker, Job } from 'bullmq';
import { Pool } from 'pg';

const db = new Pool({ connectionString: process.env.DATABASE_URL });

export const messageWorker = new Worker('scheduled-messages', async (job: Job) => {
  const { messageId } = job.data;

  const { rows: [msg] } = await db.query(
    'SELECT * FROM scheduled_messages WHERE id = $1',
    [messageId]
  );

  if (!msg || msg.status !== 'pending') return;

  // Vérification expiration fenêtre 72h
  if (new Date() > new Date(msg.window_expires_at)) {
    await db.query(
      'UPDATE scheduled_messages SET status = $1 WHERE id = $2',
      ['expired', messageId]
    );
    return;
  }

  // Mock envoi WhatsApp (à remplacer par l'API Meta réelle)
  console.log(JSON.stringify({
    level: 'info',
    event: 'whatsapp_message_sent',
    tenantId: msg.tenant_id,
    contactPhone: msg.contact_phone,
    messageId: msg.id
  }));

  await db.query(
    'UPDATE scheduled_messages SET status = $1, sent_at = NOW() WHERE id = $2',
    ['sent', messageId]
  );
}, {
  connection: { host: 'localhost', port: 6379 }
});