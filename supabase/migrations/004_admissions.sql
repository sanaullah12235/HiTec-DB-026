-- ============================================================================
-- 004 — Admissions Table
-- ============================================================================

-- ── Admissions ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admissions (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name        VARCHAR(255) NOT NULL,
    email            VARCHAR(255) NOT NULL UNIQUE,
    phone            VARCHAR(20)  NOT NULL,
    cnic             VARCHAR(15)  NOT NULL,
    program_id       UUID         NOT NULL REFERENCES programs(id) ON DELETE RESTRICT,
    status           VARCHAR(20)  NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admissions_status ON admissions (status);
CREATE INDEX IF NOT EXISTS idx_admissions_email   ON admissions (email);

-- ── RLS ────────────────────────────────────────────────────────────────────
ALTER TABLE admissions ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (public admission form)
DROP POLICY IF EXISTS public_insert_admissions ON admissions;
CREATE POLICY public_insert_admissions ON admissions
    FOR INSERT
    WITH CHECK (true);

-- Only authenticated admin can SELECT / UPDATE
DROP POLICY IF EXISTS admin_select_admissions ON admissions;
CREATE POLICY admin_select_admissions ON admissions
    FOR SELECT
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS admin_update_admissions ON admissions;
CREATE POLICY admin_update_admissions ON admissions
    FOR UPDATE
    USING (auth.role() = 'authenticated');
