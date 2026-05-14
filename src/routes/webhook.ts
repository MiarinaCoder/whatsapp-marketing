import { FastifyInstance } from 'fastify';
import { validateMetaSignature } from '../services/hmac.service.js';
import { parseWebhookPayload } from '../services/event-parser.service.js';
import { isEventDuplicate } from '../services/idempotency.service.js';
import { sequenceService } from '../services/sequence.service.js';
import { attributionService } from '../services/attribution.service.js';

interface ConversionPayload {
  tenantId: string;
  contactPhone: string;
  orderId: string;
  orderAmount: number;
  convertedAt: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getTenantId(payload: Record<string, unknown>): string {
  const entry = payload.entry;
  if (!Array.isArray(entry)) return 'unknown';

  const firstEntry = entry[0];
  if (!isRecord(firstEntry)) return 'unknown';

  const changes = firstEntry.changes;
  if (!Array.isArray(changes)) return 'unknown';

  const firstChange = changes[0];
  if (!isRecord(firstChange)) return 'unknown';

  const value = firstChange.value;
  if (!isRecord(value)) return 'unknown';

  const phoneNumberId = value.phone_number_id;
  return typeof phoneNumberId === 'string' ? phoneNumberId : 'unknown';
}

export async function webhookRoutes(app: FastifyInstance) {

  // Vérification GET Meta
  app.get('/whatsapp', async (req, reply) => {
    const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query as Record<string, string>;
    if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
      return reply.send(challenge);
    }
    return reply.code(403).send({ error: 'Forbidden' });
  });

  // Réception POST — rawBody nécessaire pour le HMAC
  app.addContentTypeParser('application/json', { parseAs: 'buffer' }, (req, body, done) => {
    done(null, body);
  });

  app.post('/whatsapp', async (req, reply) => {
    const signature = req.headers['x-hub-signature-256'];
    const rawBody = req.body as Buffer;

    if (!validateMetaSignature(rawBody, typeof signature === 'string' ? signature : '', process.env.APP_SECRET!)) {
      return reply.code(401).send({ error: 'Invalid signature' });
    }

    // Répondre 200 immédiatement (< 500ms)
    reply.code(200).send({ status: 'ok' });

    // Traitement asynchrone (non bloquant)
    setImmediate(async () => {
      try {
        const payload = JSON.parse(rawBody.toString()) as Record<string, unknown>;
        const tenantId = getTenantId(payload);
        const events = parseWebhookPayload(payload, tenantId);

        for (const event of events) {
          if (await isEventDuplicate(event.eventId)) continue;

          if (event.type === 'free_window_opened') {
            await sequenceService.triggerSequences(event);
          }
        }
      } catch {
        // Ignorer le payload malformé après réponse 200
      }
    });
  });

  // Endpoint de conversion
  app.post('/conversion', async (req, reply) => {
    const body = req.body as ConversionPayload;
    await attributionService.handleConversion(body);
    return reply.code(200).send({ status: 'ok' });
  });
}