-- migrations/006_add_bonus_expiry.sql

ALTER TABLE transactions
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Заполняем для существующих начислений (если нужно)
UPDATE transactions
SET expires_at = created_at + INTERVAL '90 days'
WHERE type = 'accrual' AND expires_at IS NULL;