-- migrations/001_init.sql
-- Чистая базовая структура для MarSo Loyalty (применяется на пустую базу)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Клиенты
CREATE TABLE clients (
                         id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                         phone            VARCHAR(18) UNIQUE NOT NULL,
                         normalized_phone VARCHAR(15) UNIQUE,
                         name             VARCHAR(100),
                         email            VARCHAR(120),
                         level            VARCHAR(20) NOT NULL DEFAULT 'bronze'
                             CHECK (level IN ('bronze', 'silver', 'gold')),
                         status           VARCHAR(20) NOT NULL DEFAULT 'active'
                             CHECK (status IN ('active', 'inactive', 'vip', 'banned')),
                         total_spent      DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (total_spent >= 0),
                         balance          DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
                         last_visit_at    TIMESTAMPTZ,
                         created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                         updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clients_normalized_phone ON clients(normalized_phone);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_last_visit ON clients(last_visit_at);

-- Посещения
CREATE TABLE visits (
                        id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                        client_id  UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
                        barber_id  INTEGER,                  -- позже REFERENCES barbers(id)
                        amount     DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
                        note       TEXT,
                        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_visits_client_id ON visits(client_id);
CREATE INDEX idx_visits_created_at ON visits(created_at DESC);

-- Транзакции бонусов
CREATE TABLE transactions (
                              id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                              client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
                              type        VARCHAR(20) NOT NULL CHECK (type IN (
                                                                               'accrual', 'redemption', 'manual_add', 'manual_subtract', 'correction', 'referral'
                                  )),
                              amount      DECIMAL(12,2) NOT NULL,
                              description TEXT,
                              visit_id    UUID REFERENCES visits(id) ON DELETE SET NULL,
                              created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_client_id ON transactions(client_id);
CREATE INDEX idx_transactions_type ON transactions(type);

-- QR-токены (одноразовые для сканирования карты лояльности)
CREATE TABLE qr_tokens (
                           id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                           client_id  UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
                           token      VARCHAR(100) UNIQUE NOT NULL,
                           used       BOOLEAN NOT NULL DEFAULT FALSE,
                           expires_at TIMESTAMPTZ NOT NULL,
                           created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_qr_tokens_token ON qr_tokens(token);
CREATE INDEX idx_qr_tokens_active ON qr_tokens(token)
    WHERE used = FALSE;

-- Администраторы / менеджеры / барберы
CREATE TABLE admin_users (
                             id            SERIAL PRIMARY KEY,
                             login         VARCHAR(50) UNIQUE NOT NULL,
                             password_hash VARCHAR(255) NOT NULL,
                             role          VARCHAR(20) NOT NULL DEFAULT 'admin'
                                 CHECK (role IN ('admin', 'manager', 'barber')),
                             is_active     BOOLEAN NOT NULL DEFAULT TRUE,
                             last_login_at TIMESTAMPTZ,
                             created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                             updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Начальный администратор — ВСТАВЬ СВОЙ ХЭШ!
-- Сгенерируй свежий хэш:
-- go run cmd/hash_password/main.go твой_сильный_пароль_2025
-- Пример (замени на свой!):
 INSERT INTO admin_users (login, password_hash, role)
VALUES ('admin', '$2a$10$o203bNe3AG1bn8IS2NsnlOyPgXuNuPSE.tw1qFBWznXQTBwcPVQyW', 'admin');