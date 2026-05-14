import Fastify from 'fastify';
import { webhookRoutes } from './routes/webhook.js';
import { campaignRoutes } from './routes/campaigns.js';

export function buildApp() {
  const app = Fastify({ logger: true });

  app.register(webhookRoutes, { prefix: '/webhook' });
  app.register(campaignRoutes, { prefix: '/campaigns' });

  return app;
}