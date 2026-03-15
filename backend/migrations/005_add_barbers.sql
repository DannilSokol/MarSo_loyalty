-- migrations/005_add_barbers.sql

-- Таблица мастеров (барберов)
CREATE TABLE IF NOT EXISTS barbers (
                                       id          SERIAL PRIMARY KEY,
                                       name        VARCHAR(100) NOT NULL,
    nickname    VARCHAR(50) UNIQUE,           -- для отображения (опционально)
    photo_url   TEXT,                          -- ссылка на фото
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

-- Добавляем поле barber_id в visits (если ещё нет)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'visits' AND column_name = 'barber_id') THEN
ALTER TABLE visits
    ADD COLUMN barber_id INTEGER REFERENCES barbers(id) ON DELETE SET NULL;
END IF;
END $$;

-- Индекс для быстрого поиска визитов по мастеру
CREATE INDEX IF NOT EXISTS idx_visits_barber_id ON visits(barber_id);

-- Добавляем пару тестовых мастеров (можно удалить или заменить)
INSERT INTO barbers (name, nickname, is_active) VALUES
                                                    ('Иван Иванов', 'VanyaCut', true),
                                                    ('Алексей Петров', 'AlexPro', true),
                                                    ('Дмитрий Сидоров', 'DimaBlade', true)
    ON CONFLICT DO NOTHING;