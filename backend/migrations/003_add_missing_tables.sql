-- 003_add_missing_tables.sql
-- Добавляем таблицы, которые могли быть пропущены

-- Таблица QR-токенов (если не существует)
CREATE TABLE IF NOT EXISTS qr_tokens (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id   UUID REFERENCES clients(id) ON DELETE CASCADE,
    token       VARCHAR(100) UNIQUE NOT NULL,
    used        BOOLEAN DEFAULT FALSE,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
    );

-- Индекс для быстрого поиска активных токенов (если не существует)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_qr_tokens_token_expires') THEN
CREATE INDEX idx_qr_tokens_token_expires ON qr_tokens(token, expires_at, used);
END IF;
END $$;

-- Таблица транзакций (если не существует)
CREATE TABLE IF NOT EXISTS transactions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id   UUID REFERENCES clients(id) ON DELETE CASCADE,
    type        VARCHAR(20) NOT NULL,
    amount      DECIMAL(12,2) NOT NULL,
    description TEXT,
    visit_id    UUID REFERENCES visits(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
    );

-- Проверяем и добавляем недостающие колонки в clients если нужно
DO $$
BEGIN
    -- Проверяем наличие колонки level в clients (добавляем позже)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'clients' AND column_name = 'level') THEN
ALTER TABLE clients ADD COLUMN level VARCHAR(20) DEFAULT 'bronze';
END IF;
END $$;