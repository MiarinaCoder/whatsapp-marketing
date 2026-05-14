import { WhatsAppEvent } from '../types/index.js';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value);
  return undefined;
}

export function parseWebhookPayload(
  payload: Record<string, unknown>,
  tenantId: string
): WhatsAppEvent[] {
  const events: WhatsAppEvent[] = [];
  const entry = Array.isArray(payload.entry) ? payload.entry[0] : undefined;
  const changes = isRecord(entry) && Array.isArray(entry.changes) ? entry.changes[0] : undefined;
  const value = isRecord(changes) ? changes.value : undefined;

  if (!isRecord(value)) return events;

  const messages = Array.isArray(value.messages) ? value.messages : [];
  const statuses = Array.isArray(value.statuses) ? value.statuses : [];

  // Messages reçus
  for (const rawMessage of messages) {
    if (!isRecord(rawMessage)) continue;

    const eventId = toString(rawMessage.id);
    const timestamp = toNumber(rawMessage.timestamp);
    const contactPhone = toString(rawMessage.from);
    if (!eventId || !timestamp || !contactPhone) continue;

    const hasFreeWindow = isRecord(rawMessage.referral);
    events.push({
      eventId,
      tenantId,
      type: hasFreeWindow ? 'free_window_opened' : 'message_received',
      contactPhone,
      messageId: eventId,
      timestamp: new Date(timestamp * 1000),
      metadata: rawMessage,
    });
  }

  // Statuts (read / failed)
  for (const rawStatus of statuses) {
    if (!isRecord(rawStatus)) continue;

    const status = toString(rawStatus.status);
    const id = toString(rawStatus.id);
    const timestamp = toNumber(rawStatus.timestamp);
    const recipientPhone = toString(rawStatus.recipient_id);
    if (!status || !id || !timestamp || !recipientPhone) continue;

    if (status === 'read') {
      events.push({
        eventId: `${id}_read`,
        tenantId,
        type: 'message_read',
        contactPhone: recipientPhone,
        messageId: id,
        timestamp: new Date(timestamp * 1000),
        metadata: rawStatus,
      });
    } else if (status === 'failed') {
      events.push({
        eventId: `${id}_failed`,
        tenantId,
        type: 'message_failed',
        contactPhone: recipientPhone,
        messageId: id,
        timestamp: new Date(timestamp * 1000),
        metadata: rawStatus,
      });
    }
  }

  return events;
}