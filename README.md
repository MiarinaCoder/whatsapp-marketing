# WhatsApp Marketing Platform

## Prérequis
- Node.js 20+
- Docker & Docker Compose

## Installation
git clone <repo>
cd whatsapp-marketing
pnpm install
cp .env.example .env  # Remplir les variables

## Démarrage
docker compose up -d postgres redis
pnpm db:migrate
pnpm dev

## Tests
pnpm test

## Choix techniques
- **Fastify** : plus rapide qu'Express, meilleur support TypeScript
- **BullMQ** : file de jobs robuste avec Redis, support des délais
- **RLS PostgreSQL** : isolation multi-tenant au niveau base de données
- **HMAC timingSafeEqual** : protection contre les timing attacks