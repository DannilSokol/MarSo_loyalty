-- migrations/003_add_last_visit.sql

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'clients' AND column_name = 'last_visit_at') THEN
ALTER TABLE clients
    ADD COLUMN last_visit_at TIMESTAMPTZ;
END IF;
END $$;

-- Заполняем для существующих клиентов (самый последний визит)
UPDATE clients c
SET last_visit_at = (
    SELECT MAX(created_at)
    FROM visits v
    WHERE v.client_id = c.id
)
WHERE EXISTS (
    SELECT 1 FROM visits WHERE client_id = c.id
);