# WhatsApp Marketing Platform

Plateforme de marketing WhatsApp multi-tenant avec séquences automatisées et attribution ROI.

## Prérequis
- Node.js 20+
- Docker & Docker Compose
- pnpm (recommandé)

## Installation

```bash
git clone <repo>
cd whatsapp-marketing
pnpm install
cp .env.example .env  # Remplir les variables d'environnement
```

## Démarrage

1. **Démarrer les services externes :**
   ```bash
   docker compose up -d postgres redis
   ```

2. **Migrer la base de données :**
   ```bash
   pnpm db:migrate
   ```

3. **Démarrer l'API :**
   ```bash
   pnpm dev
   ```

4. **Démarrer le worker (dans un terminal séparé) :**
   ```bash
   node dist/workers/message.worker.js
   ```

## Tests

```bash
pnpm test
pnpm test:coverage
```

## Variables d'environnement (.env)

```env
DATABASE_URL=postgresql://whatsapp_user:whatsapp_pass@localhost:5432/whatsapp_marketing
REDIS_URL=redis://localhost:6379
APP_SECRET=votre_secret_meta_app
VERIFY_TOKEN=votre_verify_token_meta
PORT=3000
```

## API Endpoints

### Webhooks WhatsApp
- `GET /webhook/whatsapp` - Vérification Meta
- `POST /webhook/whatsapp` - Réception événements WhatsApp

### Conversion Attribution
- `POST /webhook/conversion` - Enregistrement conversion

### Reporting ROI
- `GET /campaigns/:tenantId/roi` - Rapport ROI par campagne

## Choix techniques

- **Fastify** : Framework rapide avec excellent support TypeScript
- **BullMQ** : File de jobs robuste avec Redis pour les séquences temporisées
- **PostgreSQL RLS** : Isolation multi-tenant au niveau base de données
- **HMAC timingSafeEqual** : Protection contre les attaques de timing
- **TypeScript strict** : Code sans 'any', typage fort
- **ESM** : Modules ES modernes

## Architecture

- `src/server.ts` : Point d'entrée API
- `src/app.ts` : Configuration Fastify
- `src/routes/` : Endpoints API
- `src/services/` : Logique métier
- `src/workers/` : Traitement asynchrone des jobs
- `src/db/` : Schémas et migrations base de données
- `tests/` : Tests unitaires

## Sécurité

- Validation HMAC-SHA256 des webhooks Meta
- Idempotence Redis (TTL 24h)
- Isolation multi-tenant via RLS PostgreSQL
- Parsing strict des payloads externes