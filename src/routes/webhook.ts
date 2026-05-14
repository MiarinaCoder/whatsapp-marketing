import { FastifyInstance } from 'fastify';
import { validateMetaSignature } from '../services/hmac.service.js';
import { parseWebhookPayload } from '../services/event-parser.service.js';
import { isEventDuplicate } from '../services/idempotency.service.js';
import { sequenceService } from '../services/sequence.service.js';
import { attributionService } from '../services/attribution.service.js';

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
    const signature = req.headers['x-hub-signature-256'] as string;
    const rawBody = req.body as Buffer;

    if (!validateMetaSignature(rawBody, signature, process.env.APP_SECRET!)) {
      return reply.code(401).send({ error: 'Invalid signature' });
    }

    // Répondre 200 immédiatement (< 500ms)
    reply.code(200).send({ status: 'ok' });

    // Traitement asynchrone (non bloquant)
    setImmediate(async () => {
      const payload = JSON.parse(rawBody.toString());
      const tenantId = payload.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id ?? 'unknown';
      const events = parseWebhookPayload(payload, tenantId);

      for (const event of events) {
        if (await isEventDuplicate(event.eventId)) continue;

        if (event.type === 'free_window_opened') {
          await sequenceService.triggerSequences(event);
        }
      }
    });
  });

  // Endpoint de conversion
  app.post('/conversion', async (req, reply) => {
    const body = req.body as any;
    await attributionService.handleConversion(body);
    return reply.code(200).send({ status: 'ok' });
  });
}