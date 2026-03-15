-- migrations/007_add_referred_by.sql
ALTER TABLE clients
    ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_clients_referred_by ON clients(referred_by);