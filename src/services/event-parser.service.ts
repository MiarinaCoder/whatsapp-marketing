import { WhatsAppEvent } from '../types';

export function parseWebhookPayload(
  payload: Record<string, unknown>,
  tenantId: string
): WhatsAppEvent[] {
  const events: WhatsAppEvent[] = [];
  const entry = (payload.entry as any[])?.[0];
  const changes = entry?.changes?.[0]?.value;

  if (!changes) return events;

  const messages: any[] = changes.messages ?? [];
  const statuses: any[] = changes.statuses ?? [];

  // Messages reçus
  for (const msg of messages) {
    const hasFreeWindow = !!msg.referral; // Click-to-WhatsApp Ad
    events.push({
      eventId: msg.id,
      tenantId,
      type: hasFreeWindow ? 'free_window_opened' : 'message_received',
      contactPhone: msg.from,
      messageId: msg.id,
      timestamp: new Date(Number(msg.timestamp) * 1000),
      metadata: msg,
    });
  }

  // Statuts (read / failed)
  for (const status of statuses) {
    if (status.status === 'read') {
      events.push({
        eventId: `${status.id}_read`,
        tenantId,
        type: 'message_read',
        contactPhone: status.recipient_id,
        messageId: status.id,
        timestamp: new Date(Number(status.timestamp) * 1000),
        metadata: status,
      });
    } else if (status.status === 'failed') {
      events.push({
        eventId: `${status.id}_failed`,
        tenantId,
        type: 'message_failed',
        contactPhone: status.recipient_id,
        messageId: status.id,
        timestamp: new Date(Number(status.timestamp) * 1000),
        metadata: status,
      });
    }
  }

  return events;
}