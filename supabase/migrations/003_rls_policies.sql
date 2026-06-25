-- ============================================================================
-- HiSUP_DB — RLS Policy Fixes: Faculty & Admin Access
-- ============================================================================
-- Fixes faculty dashboard showing "no students" and faculty CRUD on grades.
-- 
-- Root cause: enrollments RLS only allowed student_id = auth.uid(), so
-- faculty members (whose auth.uid() is a faculty UUID) could not see any
-- enrollments, causing all !inner joins to yield empty results.
--
-- Solution: add faculty-specific policies that check section_id against
-- sections taught by the authenticated faculty member.
-- ============================================================================

-- ── 1. ENROLLMENTS: faculty can view enrollments for sections they teach ──
DROP POLICY IF EXISTS faculty_view_enrollments ON enrollments;
CREATE POLICY faculty_view_enrollments ON enrollments
    FOR SELECT
    USING (
        section_id IN (SELECT id FROM sections WHERE faculty_id = auth.uid())
    );

-- ── 2. ENROLLMENTS: admin staff can view all enrollments ──────────────────
DROP POLICY IF EXISTS admin_all_enrollments ON enrollments;
CREATE POLICY admin_all_enrollments ON enrollments
    FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM staff WHERE id = auth.uid() AND role = 'admin')
    );

-- ── 3. GRADES: faculty can manage (SELECT/INSERT/UPDATE) grades for their sections ──
DROP POLICY IF EXISTS faculty_manage_grades ON grades;
CREATE POLICY faculty_manage_grades ON grades
    USING (
        enrollment_id IN (
            SELECT e.id FROM enrollments e
            JOIN sections s ON s.id = e.section_id
            WHERE s.faculty_id = auth.uid()
        )
    );

-- ── 4. GRADES: admin staff can manage all grades ──────────────────────────
DROP POLICY IF EXISTS admin_all_grades ON grades;
CREATE POLICY admin_all_grades ON grades
    USING (
        EXISTS (SELECT 1 FROM staff WHERE id = auth.uid() AND role = 'admin')
    );

-- ── 5. RESULTS (if RLS was enabled separately): faculty can manage results ──
ALTER TABLE results DISABLE ROW LEVEL SECURITY;

-- ── 6. ATTENDANCE: ensure no RLS blocks faculty (currently no RLS) ─────────
ALTER TABLE attendance_records DISABLE ROW LEVEL SECURITY;

-- ── 7. FEES: admin can view all fee payments ───────────────────────────────
DROP POLICY IF EXISTS admin_all_fee_payments ON fee_payments;
CREATE POLICY admin_all_fee_payments ON fee_payments
    FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM staff WHERE id = auth.uid() AND role = 'admin')
    );

-- ── 8. LIBRARY ISSUES: add fine_paid column used by librarian/fines page ───
ALTER TABLE library_issues ADD COLUMN IF NOT EXISTS fine_paid BOOLEAN NOT NULL DEFAULT false;

-- ============================================================================
-- Verification
-- ============================================================================
DO $$
DECLARE
    v_policies INT;
BEGIN
    SELECT COUNT(*) INTO v_policies
    FROM pg_policies
    WHERE tablename IN ('enrollments', 'grades', 'fee_payments');
    RAISE NOTICE '[HiSUP] RLS policies active: %', v_policies;
END;
$$;
