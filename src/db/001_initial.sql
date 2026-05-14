-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Séquences
CREATE TABLE sequences (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL,
  name        VARCHAR(255) NOT NULL,
  trigger     VARCHAR(50) NOT NULL,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Étapes
CREATE TABLE sequence_steps (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id    UUID REFERENCES sequences(id) ON DELETE CASCADE,
  step_order     INTEGER NOT NULL,
  delay_minutes  INTEGER NOT NULL CHECK (delay_minutes >= 0),
  template_id    VARCHAR(100) NOT NULL,
  variables      JSONB DEFAULT '{}'
);

-- Messages planifiés
CREATE TABLE scheduled_messages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL,
  contact_phone     VARCHAR(20) NOT NULL,
  step_id           UUID REFERENCES sequence_steps(id),
  scheduled_at      TIMESTAMPTZ NOT NULL,
  window_expires_at TIMESTAMPTZ NOT NULL,
  status            VARCHAR(20) DEFAULT 'pending',
  sent_at           TIMESTAMPTZ
);

-- Attributions
CREATE TABLE attributions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          UUID NOT NULL,
  contact_phone      VARCHAR(20) NOT NULL,
  order_id           VARCHAR(255) UNIQUE NOT NULL,
  order_amount       INTEGER NOT NULL,
  converted_at       TIMESTAMPTZ NOT NULL,
  scheduled_msg_id   UUID REFERENCES scheduled_messages(id),
  sequence_id        UUID REFERENCES sequences(id),
  attribution_source VARCHAR(20) DEFAULT 'whatsapp'
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_scheduled_messages_status ON scheduled_messages(status, scheduled_at);
CREATE INDEX idx_scheduled_messages_contact ON scheduled_messages(tenant_id, contact_phone, sent_at);
CREATE INDEX idx_attributions_order ON attributions(order_id);