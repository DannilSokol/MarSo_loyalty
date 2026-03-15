-- migrations/002_add_improvements.sql
-- Инкрементальная миграция: добавляем все улучшения без удаления данных
-- Выполняется безопасно даже если некоторые колонки/индексы уже существуют

-- 1. Добавляем normalized_phone в clients (если ещё нет)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'clients' AND column_name = 'normalized_phone') THEN
ALTER TABLE clients
    ADD COLUMN normalized_phone VARCHAR(15) UNIQUE;

-- Опционально: можно сразу заполнить для существующих записей (если телефон уже в каноническом виде)
-- UPDATE clients SET normalized_phone = phone WHERE phone ~ '^\+7[0-9]{10}$';
END IF;
END $$;

-- 2. Добавляем level в clients (если ещё нет)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'clients' AND column_name = 'level') THEN
ALTER TABLE clients
    ADD COLUMN level VARCHAR(20) NOT NULL DEFAULT 'bronze'
        CHECK (level IN ('bronze', 'silver', 'gold'));
END IF;
END $$;

-- 3. Добавляем status в clients
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'clients' AND column_name = 'status') THEN
ALTER TABLE clients
    ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'inactive', 'vip', 'banned'));
END IF;
END $$;

-- 4. Добавляем last_visit_at в clients
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'clients' AND column_name = 'last_visit_at') THEN
ALTER TABLE clients
    ADD COLUMN last_visit_at TIMESTAMPTZ;
END IF;
END $$;

-- 5. Добавляем updated_at в clients
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'clients' AND column_name = 'updated_at') THEN
ALTER TABLE clients
    ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
END IF;
END $$;

-- 6. Добавляем CHECK на amount >= 0 в visits (если ещё нет)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'visits_amount_check'
    ) THEN
ALTER TABLE visits
    ADD CONSTRAINT visits_amount_check CHECK (amount >= 0);
END IF;
END $$;

-- 7. Добавляем barber_id в visits (пока NULLable, потом привяжем к таблице барберов)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'visits' AND column_name = 'barber_id') THEN
ALTER TABLE visits
    ADD COLUMN barber_id INTEGER;  -- REFERENCES barbers(id) добавим позже
END IF;
END $$;

-- 8. Улучшаем admin_users: role, is_active, updated_at
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'admin_users' AND column_name = 'role') THEN
ALTER TABLE admin_users
    ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'admin'
        CHECK (role IN ('admin', 'manager', 'barber'));
END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'admin_users' AND column_name = 'is_active') THEN
ALTER TABLE admin_users
    ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'admin_users' AND column_name = 'updated_at') THEN
ALTER TABLE admin_users
    ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
END IF;
END $$;

-- 9. Улучшаем тип транзакций: добавляем CHECK на допустимые типы
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'transactions_type_check'
    ) THEN
ALTER TABLE transactions
    ADD CONSTRAINT transactions_type_check CHECK (type IN (
                                                           'accrual', 'redemption', 'manual_add', 'manual_subtract', 'correction', 'referral'
        ));
END IF;
END $$;

-- 10. Добавляем полезные индексы (IF NOT EXISTS — безопасно)
CREATE INDEX IF NOT EXISTS idx_clients_normalized_phone
    ON clients(normalized_phone);

CREATE INDEX IF NOT EXISTS idx_clients_status
    ON clients(status);

CREATE INDEX IF NOT EXISTS idx_clients_last_visit
    ON clients(last_visit_at);

CREATE INDEX IF NOT EXISTS idx_visits_client_created
    ON visits(client_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_client_type
    ON transactions(client_id, type);

-- 11. Исправляем индекс qr_tokens — без NOW() в WHERE (как обсуждали ранее)
DROP INDEX IF EXISTS idx_qr_tokens_token_expires;

CREATE INDEX IF NOT EXISTS idx_qr_tokens_active
    ON qr_tokens(token)
    WHERE used = FALSE;

CREATE INDEX IF NOT EXISTS idx_qr_tokens_lookup
    ON qr_tokens(token, expires_at)
    WHERE used = FALSE;

-- 12. Опционально: обновляем last_visit_at для существующих клиентов
-- (берём самую последнюю дату посещения)
UPDATE clients c
SET last_visit_at = (
    SELECT MAX(created_at)
    FROM visits v
    WHERE v.client_id = c.id
)
WHERE EXISTS (
    SELECT 1 FROM visits WHERE client_id = c.id
);