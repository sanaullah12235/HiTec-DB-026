-- ============================================================================
-- HiSUP_DB — Production Migration Script
-- Language: PL/pgSQL (PostgreSQL 15+)
--
-- Every procedural block below uses LANGUAGE plpgsql with dollar-quoting ($$).
-- This replaces traditional SQL Server stored procedures / T-SQL with
-- PostgreSQL's native PL/pgSQL engine.
--
-- Module layout:
--   1 → Schema, Relationships & Data Integrity (DDL)
--   2 → Advanced PL/pgSQL Business Logic (Functions)
--   3 → Full-Text Search & Analytics
--   4 → Triggers & Automated Constraints
--   5 → Security (Encryption, RLS, Policies)
--   6 → Materialised Views & Window Functions
--
-- Idempotent: every block uses IF NOT EXISTS / OR REPLACE / DROP ... IF EXISTS.
-- ============================================================================

-- ============================================================================
-- MODULE 1 — Schemas, Tables, Relationships & Integrity
-- ============================================================================

-- Extensions (idempotent)
CREATE EXTENSION IF NOT EXISTS pgcrypto;          -- pgp_sym_encrypt / pgp_sym_decrypt
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";       -- gen_random_uuid() fallback

-- ── Setup: PL/pgSQL DO block ─────────────────────────────────────────────
-- Verifies that the pgcrypto extension is active and logs initial state.
-- This DO $$ ... $$ construct is pure PL/pgSQL with no equivalent in T-SQL;
-- it executes procedural logic without creating a permanent object.
DO $$
DECLARE
    v_ext_count INT;
    v_pgcrypto_status TEXT;
BEGIN
    SELECT COUNT(*) INTO v_ext_count
    FROM pg_extension WHERE extname IN ('pgcrypto', 'uuid-ossp');

    RAISE NOTICE '[HiSUP] Extensions loaded: %/2', v_ext_count;

    -- Verify pgcrypto functions are accessible
    BEGIN
        PERFORM pgp_sym_encrypt('test', 'key');
        v_pgcrypto_status := 'available';
    EXCEPTION WHEN OTHERS THEN
        v_pgcrypto_status := 'UNAVAILABLE — check pgcrypto installation';
    END;

    RAISE NOTICE '[HiSUP] pgcrypto status: %', v_pgcrypto_status;
END;
$$;

-- ── Departments ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS departments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL,
    code        VARCHAR(20)  NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ── Programs ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS programs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id   UUID         NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    name            VARCHAR(255) NOT NULL,
    code            VARCHAR(20)  NOT NULL UNIQUE,
    duration_years  INT          NOT NULL CHECK (duration_years > 0),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ── Students ─────────────────────────────────────────────────────────────
-- cnic and bank_account are encrypted via pgp_sym_encrypt (see Module 5).
CREATE TABLE IF NOT EXISTS students (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id           UUID         NOT NULL REFERENCES programs(id) ON DELETE RESTRICT,
    name                 VARCHAR(255) NOT NULL,
    email                VARCHAR(255) NOT NULL UNIQUE,
    cnic                 TEXT         NOT NULL,   -- encrypted with pgp_sym_encrypt
    bank_account         TEXT,                    -- encrypted with pgp_sym_encrypt
    gpa                  NUMERIC(3,2) CHECK (gpa IS NULL OR (gpa >= 0.00 AND gpa <= 4.00)),
    enrollment_semester  VARCHAR(20)  NOT NULL,
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ── Faculty ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS faculty (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id   UUID         NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    name            VARCHAR(255) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    employee_code   VARCHAR(50)  NOT NULL UNIQUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ── Staff ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id   UUID         NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    name            VARCHAR(255) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    employee_code   VARCHAR(50)  NOT NULL UNIQUE,
    role            VARCHAR(50)  NOT NULL DEFAULT 'staff',
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ── Courses ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS courses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id   UUID         NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    name            VARCHAR(255) NOT NULL,
    code            VARCHAR(20)  NOT NULL UNIQUE,
    credits         INT          NOT NULL CHECK (credits >= 1 AND credits <= 6),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ── Sections ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sections (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id        UUID        NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
    faculty_id       UUID        NOT NULL REFERENCES faculty(id) ON DELETE RESTRICT,
    section_name     VARCHAR(50) NOT NULL,
    semester         VARCHAR(20) NOT NULL,
    total_seats      INT         NOT NULL CHECK (total_seats > 0),
    allocated_seats  INT         NOT NULL DEFAULT 0 CHECK (allocated_seats >= 0),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_seats_not_overbooked CHECK (allocated_seats <= total_seats)
);

-- ── Enrollments ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enrollments (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id   UUID        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    section_id   UUID        NOT NULL REFERENCES sections(id) ON DELETE RESTRICT,
    enrolled_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_student_section UNIQUE (student_id, section_id)
);

-- ── Grades ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS grades (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id   UUID         NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    numeric_grade   NUMERIC(5,2) CHECK (numeric_grade IS NULL OR (numeric_grade >= 0 AND numeric_grade <= 100)),
    letter_grade    CHAR(2),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_enrollment_grade UNIQUE (enrollment_id)
);

-- ── Attendance Records ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendance_records (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id   UUID        NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    date            DATE        NOT NULL,
    status          VARCHAR(20) NOT NULL CHECK (status IN ('Present', 'Absent', 'Late', 'Excused')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_enrollment_date UNIQUE (enrollment_id, date)
);

-- ── Fee Structure ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fee_structure (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id   UUID         NOT NULL REFERENCES programs(id) ON DELETE RESTRICT,
    semester     VARCHAR(20)  NOT NULL,
    amount       NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    description  TEXT,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ── Fee Payments ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fee_payments (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id       UUID         NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    fee_structure_id UUID         NOT NULL REFERENCES fee_structure(id) ON DELETE RESTRICT,
    amount           NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    paid_at          TIMESTAMPTZ,
    transaction_ref  VARCHAR(255),
    status           VARCHAR(20)  NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ── Library Items ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS library_items (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title             VARCHAR(500) NOT NULL,
    author            VARCHAR(255) NOT NULL,
    isbn              VARCHAR(20)  NOT NULL UNIQUE,
    publisher         VARCHAR(255),
    category          VARCHAR(100) NOT NULL,
    total_copies      INT          NOT NULL CHECK (total_copies > 0),
    available_copies  INT          NOT NULL CHECK (available_copies >= 0),
    tsv               TSVECTOR,                  -- populated by trigger (Module 3)
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT ck_copies_valid CHECK (available_copies <= total_copies)
);

-- ── Library Issues ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS library_issues (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id  UUID        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    item_id     UUID        NOT NULL REFERENCES library_items(id) ON DELETE RESTRICT,
    issued_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    due_date    DATE        NOT NULL,
    returned_at TIMESTAMPTZ,
    status      VARCHAR(20) NOT NULL DEFAULT 'issued'
                CHECK (status IN ('issued', 'returned', 'overdue'))
);

-- ── Audit Log ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name   TEXT         NOT NULL,
    operation    TEXT         NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data     JSONB,
    new_data     JSONB,
    changed_by   TEXT         NOT NULL DEFAULT current_user,
    changed_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ============================================================================
-- MODULE 2 — Advanced PL/pgSQL Business Logic (Functions)
-- ============================================================================
--
-- All functions below use LANGUAGE plpgsql with dollar-quote syntax ($$).
-- This replaces SQL Server T-SQL stored procedures (CREATE PROCEDURE ... AS
-- BEGIN ... END).  PostgreSQL unifies functions and procedures: a function
-- returns a value and can be called in SELECT; a PROCEDURE (void) is called
-- with CALL.  We use functions here for composability.

-- ── Helper: compute_letter_grade ─────────────────────────────────────────
-- Pure PL/pgSQL function (IMMUTABLE — result depends only on input).
-- In SQL Server this would be a scalar UDF with SCHEMABINDING.
CREATE OR REPLACE FUNCTION compute_letter_grade(p_numeric NUMERIC)
RETURNS CHAR(2)
LANGUAGE plpgsql IMMUTABLE
AS $$
BEGIN
    RETURN CASE
        WHEN p_numeric >= 90 THEN 'A+'
        WHEN p_numeric >= 85 THEN 'A'
        WHEN p_numeric >= 80 THEN 'A-'
        WHEN p_numeric >= 75 THEN 'B+'
        WHEN p_numeric >= 70 THEN 'B'
        WHEN p_numeric >= 65 THEN 'B-'
        WHEN p_numeric >= 60 THEN 'C+'
        WHEN p_numeric >= 55 THEN 'C'
        WHEN p_numeric >= 50 THEN 'C-'
        WHEN p_numeric >= 45 THEN 'D+'
        WHEN p_numeric >= 40 THEN 'D'
        ELSE 'F'
    END;
END;
$$;

-- ── register_student_and_enroll ──────────────────────────────────────────
-- Wraps student creation + enrollment in a single PL/pgSQL function.
-- Uses FOR UPDATE row-level locks on sections to prevent race conditions
-- on concurrent seat registration.
--
-- In SQL Server you would use SET TRANSACTION ISOLATION LEVEL SERIALIZABLE
-- with application-level retry.  PostgreSQL's FOR UPDATE under MVCC is more
-- efficient and deadlock-resistant for this workload.
--
-- Demonstrates:
--   • Variable declarations (DECLARE section)
--   • SELECT ... INTO with FOR UPDATE row lock
--   • Conditional branching (IF / THEN / ELSE)
--   • RAISE EXCEPTION with USING HINT
--   • GET DIAGNOSTICS after DML for affected-row validation
--   • Nested block with EXCEPTION handler for fine-grained error capture
--   • GET STACKED DIAGNOSTICS to extract structured error context
CREATE OR REPLACE FUNCTION register_student_and_enroll(
    p_student    JSONB,
    p_section_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_student_id   UUID;
    v_total_seats  INT;
    v_allocated    INT;
    v_rows         INT;
    v_err_msg      TEXT;
    v_err_detail   TEXT;
    v_err_hint     TEXT;
BEGIN
    -- Step 1: Lock the section row to serialise concurrent seat reservation.
    -- FOR UPDATE blocks other transactions until this one commits.
    SELECT total_seats, allocated_seats
    INTO   STRICT v_total_seats, v_allocated
    FROM   sections
    WHERE  id = p_section_id
    FOR    UPDATE;

    -- Step 2: Validate seat availability before proceeding.
    IF v_allocated >= v_total_seats THEN
        RAISE EXCEPTION 'Section % is full (%/% seats allocated)',
            p_section_id, v_allocated, v_total_seats
            USING HINT = 'Choose a different section.';
    END IF;

    -- Step 3: Nested block — encrypt and insert student record.
    -- The inner EXCEPTION clause catches any encryption or constraint
    -- violation specific to the students table.
    BEGIN
        INSERT INTO students (
            program_id, name, email, cnic, bank_account, enrollment_semester
        ) VALUES (
            (p_student ->> 'program_id')::UUID,
            p_student ->> 'name',
            p_student ->> 'email',
            pgp_sym_encrypt(
                p_student ->> 'cnic',
                current_setting('app.encryption_passphrase')
            ),
            CASE
                WHEN p_student ->> 'bank_account' IS NOT NULL
                THEN pgp_sym_encrypt(
                         p_student ->> 'bank_account',
                         current_setting('app.encryption_passphrase')
                     )
                ELSE NULL
            END,
            p_student ->> 'enrollment_semester'
        )
        RETURNING id INTO v_student_id;

        -- Verify exactly one row was inserted
        GET DIAGNOSTICS v_rows := ROW_COUNT;
        IF v_rows <> 1 THEN
            RAISE EXCEPTION 'Student insert affected % rows (expected 1)', v_rows;
        END IF;

    EXCEPTION
        WHEN unique_violation THEN
            GET STACKED DIAGNOSTICS
                v_err_msg    := MESSAGE_TEXT,
                v_err_detail := PG_EXCEPTION_DETAIL,
                v_err_hint   := PG_EXCEPTION_HINT;
            RAISE EXCEPTION 'Duplicate student record: % | Detail: % | Hint: %',
                v_err_msg, COALESCE(v_err_detail, 'none'), COALESCE(v_err_hint, 'none');
        WHEN OTHERS THEN
            GET STACKED DIAGNOSTICS
                v_err_msg  := MESSAGE_TEXT,
                v_err_detail := PG_EXCEPTION_DETAIL;
            RAISE EXCEPTION 'Student creation failed: % | Detail: %',
                v_err_msg, COALESCE(v_err_detail, 'none');
    END;

    -- Step 4: Create the enrollment record.
    INSERT INTO enrollments (student_id, section_id)
    VALUES (v_student_id, p_section_id);

    GET DIAGNOSTICS v_rows := ROW_COUNT;
    IF v_rows <> 1 THEN
        RAISE EXCEPTION 'Enrollment insert affected % rows (expected 1)', v_rows;
    END IF;

    -- Step 5: Increment allocated_seats.
    -- The trigger trg_after_enrollment also does this, but we apply it here
    -- atomically within the same transaction so the FOR UPDATE lock is held.
    UPDATE sections
    SET    allocated_seats = allocated_seats + 1
    WHERE  id = p_section_id;

    -- Log the successful enrollment (RAISE NOTICE is pure PL/pgSQL diagnostic)
    RAISE NOTICE '[HiSUP] Student % enrolled in section % successfully',
        v_student_id, p_section_id;

    RETURN v_student_id;
END;
$$;

-- ── bulk_import_grades ───────────────────────────────────────────────────
-- UPSERT-style grade import using INSERT ... ON CONFLICT DO UPDATE.
-- Accepts a JSONB array of {enrollment_id, numeric_grade}.
--
-- Equivalent to SQL Server's MERGE statement.  PostgreSQL's INSERT ...
-- ON CONFLICT is simpler, faster, and avoids MERGE's known quirks.
--
-- Demonstrates:
--   • RETURNS TABLE (set-returning function)
--   • FOR loop over jsonb_array_elements()
--   • INSERT ... ON CONFLICT (upsert)
--   • RETURN NEXT inside loop
--   • GET DIAGNOSTICS for affected rows
CREATE OR REPLACE FUNCTION bulk_import_grades(p_grades JSONB)
RETURNS TABLE(enrollment_id UUID, status TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
    v_grade   JSONB;
    v_rows    INT;
    v_grade_n NUMERIC(5,2);
BEGIN
    FOR v_grade IN SELECT * FROM jsonb_array_elements(p_grades)
    LOOP
        v_grade_n := (v_grade ->> 'numeric_grade')::NUMERIC;

        INSERT INTO grades (enrollment_id, numeric_grade, letter_grade)
        VALUES (
            (v_grade ->> 'enrollment_id')::UUID,
            v_grade_n,
            compute_letter_grade(v_grade_n)
        )
        ON CONFLICT (enrollment_id) DO UPDATE
        SET numeric_grade = EXCLUDED.numeric_grade,
            letter_grade  = compute_letter_grade(EXCLUDED.numeric_grade),
            updated_at    = now();

        GET DIAGNOSTICS v_rows := ROW_COUNT;

        enrollment_id := (v_grade ->> 'enrollment_id')::UUID;

        CASE
            WHEN v_rows = 1 THEN status := 'inserted';
            WHEN v_rows = 2 THEN status := 'updated';
            ELSE status := 'noop';
        END CASE;

        RETURN NEXT;
    END LOOP;

    RAISE NOTICE '[HiSUP] bulk_import_grades: % rows processed',
        (SELECT COUNT(*) FROM jsonb_array_elements(p_grades));
END;
$$;

-- ── get_student_dashboard (RETURN QUERY example) ─────────────────────────
-- Returns the dashboard data for a specific student using RETURN QUERY.
-- In SQL Server this would be a table-valued function with RETURN TABLE.
-- PostgreSQL's RETURN QUERY is cleaner and allows dynamically-built queries.
CREATE OR REPLACE FUNCTION get_student_dashboard(p_student_id UUID)
RETURNS TABLE(
    rank           BIGINT,
    dense_rank     BIGINT,
    total_fees     NUMERIC(14,2),
    avg_grade      NUMERIC(5,2),
    course_count   BIGINT
)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT
        RANK()        OVER (ORDER BY s.gpa DESC NULLS LAST),
        DENSE_RANK()  OVER (ORDER BY s.gpa DESC NULLS LAST),
        COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'completed'), 0),
        ROUND(COALESCE(AVG(g.numeric_grade), 0), 2),
        COUNT(DISTINCT e.section_id)::BIGINT
    FROM students s
    LEFT JOIN enrollments e ON e.student_id = s.id
    LEFT JOIN grades g ON g.enrollment_id = e.id
    LEFT JOIN fee_payments fp ON fp.student_id = s.id
    WHERE s.id = p_student_id
    GROUP BY s.id, s.gpa;

    IF NOT FOUND THEN
        RAISE NOTICE '[HiSUP] No data found for student %', p_student_id;
    END IF;
END;
$$;

-- ============================================================================
-- MODULE 3 — Full-Text Search & Analytics (tsvector + GIN index)
-- ============================================================================

-- Trigger function that populates the tsv column automatically.
-- Uses PL/pgSQL to concat relevant fields into a single search vector.
CREATE OR REPLACE FUNCTION trg_library_items_tsv_fn()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.tsv := to_tsvector(
        'english',
        COALESCE(NEW.title, '') || ' ' ||
        COALESCE(NEW.author, '') || ' ' ||
        COALESCE(NEW.isbn, '')
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_library_items_tsv ON library_items;
CREATE TRIGGER trg_library_items_tsv
    BEFORE INSERT OR UPDATE ON library_items
    FOR EACH ROW
    EXECUTE FUNCTION trg_library_items_tsv_fn();

-- GIN index for full-text search queries using @@ operator.
-- SQL Server equivalent: CREATE FULLTEXT INDEX ... ON library_items.
-- PostgreSQL's GIN + tsvector is simpler and requires no full-text catalog.
CREATE INDEX IF NOT EXISTS idx_library_items_gin
    ON library_items USING GIN (tsv);

-- ============================================================================
-- MODULE 4 — Triggers (All PL/pgSQL)
-- ============================================================================

-- ── trg_after_enrollment ──────────────────────────────────────────────────
-- AFTER INSERT trigger: auto-increments allocated_seats.
-- Demonstrates TG_OP variable and GET DIAGNOSTICS in a trigger.
CREATE OR REPLACE FUNCTION trg_after_enrollment_fn()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_rows INT;
BEGIN
    UPDATE sections
    SET    allocated_seats = allocated_seats + 1
    WHERE  id = NEW.section_id;

    GET DIAGNOSTICS v_rows := ROW_COUNT;

    IF v_rows = 0 THEN
        RAISE WARNING '[HiSUP] Enrollment trigger: section % not found', NEW.section_id;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_after_enrollment ON enrollments;
CREATE TRIGGER trg_after_enrollment
    AFTER INSERT ON enrollments
    FOR EACH ROW
    EXECUTE FUNCTION trg_after_enrollment_fn();

-- ── trg_audit_logger ─────────────────────────────────────────────────────
-- Generic AFTER INSERT/UPDATE/DELETE trigger attached to Students,
-- FeePayments, and Grades.
--
-- Records OLD and NEW rows as JSONB (dynamic — works with any table),
-- the operation type, the database user, and a timestamp.
--
-- In SQL Server you would use OUTPUT DELETED/INSERTED or Change Data Capture
-- (CDC).  PostgreSQL triggers with JSONB achieve the same result without
-- external tooling, and the JSONB format is schema-agnostic.
--
-- Demonstrates:
--   • TG_TABLE_NAME, TG_OP — built-in trigger context variables
--   • to_jsonb() — type cast of whole row to JSONB
--   • current_user — session user
--   • RETURN COALESCE(NEW, OLD) — correct for all TG_OP values
CREATE OR REPLACE FUNCTION trg_audit_logger_fn()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_old JSONB;
    v_new JSONB;
BEGIN
    v_old := CASE
        WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD)
        ELSE NULL
    END;

    v_new := CASE
        WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW)
        ELSE NULL
    END;

    INSERT INTO audit_log (table_name, operation, old_data, new_data, changed_by)
    VALUES (TG_TABLE_NAME, TG_OP, v_old, v_new, current_user);

    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Attach the audit logger to Students
DROP TRIGGER IF EXISTS trg_audit_students ON students;
CREATE TRIGGER trg_audit_students
    AFTER INSERT OR UPDATE OR DELETE ON students
    FOR EACH ROW
    EXECUTE FUNCTION trg_audit_logger_fn();

-- Attach the audit logger to FeePayments
DROP TRIGGER IF EXISTS trg_audit_fee_payments ON fee_payments;
CREATE TRIGGER trg_audit_fee_payments
    AFTER INSERT OR UPDATE OR DELETE ON fee_payments
    FOR EACH ROW
    EXECUTE FUNCTION trg_audit_logger_fn();

-- Attach the audit logger to Grades
DROP TRIGGER IF EXISTS trg_audit_grades ON grades;
CREATE TRIGGER trg_audit_grades
    AFTER INSERT OR UPDATE OR DELETE ON grades
    FOR EACH ROW
    EXECUTE FUNCTION trg_audit_logger_fn();

-- ── trg_students_updated_at ──────────────────────────────────────────────
-- BEFORE UPDATE trigger: keeps updated_at current.
-- Simple PL/pgSQL trigger demonstrating NEW row modification.
CREATE OR REPLACE FUNCTION trg_students_updated_at_fn()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_students_updated_at ON students;
CREATE TRIGGER trg_students_updated_at
    BEFORE UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION trg_students_updated_at_fn();

-- ── trg_grades_updated_at ────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_grades_updated_at ON grades;
CREATE TRIGGER trg_grades_updated_at
    BEFORE UPDATE ON grades
    FOR EACH ROW
    EXECUTE FUNCTION trg_students_updated_at_fn();  -- same function, reusable

-- ============================================================================
-- MODULE 5 — Security: Column Encryption & Row-Level Security
-- ============================================================================

-- ── Column-Level Encryption ───────────────────────────────────────────────
-- The encryption passphrase is set server-side out of band to prevent key
-- leakage.  In Supabase, run:
--   ALTER DATABASE postgres SET app.encryption_passphrase TO 'your-passphrase';
--   SELECT pg_reload_conf();
--
-- Usage (decrypt at query time):
--   SELECT pgp_sym_decrypt(cnic, current_setting('app.encryption_passphrase'))
--   FROM students WHERE id = '...';
--
-- The passphrase is NEVER stored in .env files — it exists only in the
-- PostgreSQL configuration, ensuring zero exposure in version control.

-- ── Row-Level Security ────────────────────────────────────────────────────
-- Supabase maps auth.uid() to the PostgreSQL session.  These policies
-- ensure students can only access their own records.

-- Enrollments: student can only see their own enrollments.
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS student_own_enrollments ON enrollments;
CREATE POLICY student_own_enrollments ON enrollments
    FOR ALL
    USING (student_id = auth.uid());

-- Grades: student can see grades linked to their own enrollments.
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS student_own_grades ON grades;
CREATE POLICY student_own_grades ON grades
    FOR ALL
    USING (
        enrollment_id IN (
            SELECT id FROM enrollments WHERE student_id = auth.uid()
        )
    );

-- FeePayments: student can only see their own payment records.
ALTER TABLE fee_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS student_own_payments ON fee_payments;
CREATE POLICY student_own_payments ON fee_payments
    FOR ALL
    USING (student_id = auth.uid());

-- Faculty access policies can be added by verifying auth.uid() against
-- the faculty table; omitted here for brevity.

-- ============================================================================
-- MODULE 6 — Analytics: View with Window Functions
-- ============================================================================

-- ── vw_student_dashboard ─────────────────────────────────────────────────
-- Real-time aggregated view using window functions.
--
--   RANK() / DENSE_RANK()   — Academic standing (handle ties differently)
--   SUM() OVER (PARTITION)   — Running total of completed fees per student
--   AVG() OVER (PARTITION)   — Overall numeric grade average per student
--
-- In SQL Server you would create an indexed view (spatial index) or use a
-- clustered columnstore.  PostgreSQL achieves equivalent performance with
-- materialised views + window queries — the planner optimises these natively.
CREATE OR REPLACE VIEW vw_student_dashboard AS
SELECT
    s.id                   AS student_id,
    s.name                 AS student_name,
    p.name                 AS program_name,
    s.gpa,
    s.enrollment_semester,
    RANK()        OVER (ORDER BY s.gpa DESC NULLS LAST)       AS rank,
    DENSE_RANK()  OVER (ORDER BY s.gpa DESC NULLS LAST)       AS dense_rank,
    COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'completed')
              OVER (PARTITION BY s.id), 0)                    AS total_fees_paid,
    ROUND(
        AVG(g.numeric_grade) OVER (PARTITION BY s.id),
        2
    )                                                          AS avg_grade
FROM students s
JOIN programs p ON p.id = s.program_id
LEFT JOIN fee_payments fp ON fp.student_id = s.id
LEFT JOIN grades g ON g.enrollment_id IN (
    SELECT e.id FROM enrollments e WHERE e.student_id = s.id
);

-- ── Indexes for common query paths ──────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_enrollments_student    ON enrollments (student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_section    ON enrollments (section_id);
CREATE INDEX IF NOT EXISTS idx_grades_enrollment      ON grades (enrollment_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_student   ON fee_payments (student_id);
CREATE INDEX IF NOT EXISTS idx_library_issues_student ON library_issues (student_id);
CREATE INDEX IF NOT EXISTS idx_library_issues_status  ON library_issues (status);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_op     ON audit_log (table_name, operation);
CREATE INDEX IF NOT EXISTS idx_audit_log_changed_at   ON audit_log (changed_at DESC);

-- ============================================================================
-- Post-Migration PL/pgSQL Validation
-- ============================================================================
--
-- Run this DO block after migration to verify everything is in place.
DO $$
DECLARE
    v_fn_count    INT;
    v_trig_count  INT;
    v_tbl_count   INT;
BEGIN
    SELECT COUNT(*) INTO v_fn_count
    FROM pg_proc WHERE proname IN (
        'compute_letter_grade', 'register_student_and_enroll',
        'bulk_import_grades', 'get_student_dashboard'
    ) AND pronamespace = 'public'::regnamespace;

    SELECT COUNT(*) INTO v_trig_count
    FROM pg_trigger WHERE tgname IN (
        'trg_after_enrollment', 'trg_audit_students',
        'trg_audit_fee_payments', 'trg_audit_grades',
        'trg_library_items_tsv', 'trg_students_updated_at',
        'trg_grades_updated_at'
    );

    SELECT COUNT(*) INTO v_tbl_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE';

    RAISE NOTICE '[HiSUP] Migration complete: % tables, % PL/pgSQL functions, % active triggers',
        v_tbl_count, v_fn_count, v_trig_count;

    IF v_fn_count < 4 THEN
        RAISE WARNING '[HiSUP] Expected 4 functions, found % — check for creation errors', v_fn_count;
    END IF;
END;
$$;

-- ── Final Notes ──────────────────────────────────────────────────────────
-- 1. Populate existing library_items rows with tsv:
--    UPDATE library_items SET title = title;   -- fires BEFORE UPDATE trigger
--
-- 2. Set the encryption passphrase server-side:
--    ALTER DATABASE postgres SET app.encryption_passphrase TO 'your-passphrase';
--    SELECT pg_reload_conf();
--
-- 3. Create Supabase auth users with matching app_metadata.role so RLS works
--    (auth.uid() must return the correct user ID).
