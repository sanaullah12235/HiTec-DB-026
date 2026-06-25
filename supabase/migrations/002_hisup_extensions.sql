-- ============================================================================
-- HiSUP_DB — Extension Migration: Assignments, Timetable, Notifications & Fixes
-- ============================================================================

-- ── Assignments ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assignments (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id   UUID         NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    faculty_id   UUID         NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
    title        VARCHAR(255) NOT NULL,
    description  TEXT,
    file_url     TEXT,
    due_date     DATE         NOT NULL,
    max_marks    NUMERIC(5,2) NOT NULL CHECK (max_marks > 0),
    published    BOOLEAN      NOT NULL DEFAULT false,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ── Assignment Submissions ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assignment_submissions (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id  UUID         NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id     UUID         NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    file_url       TEXT,
    marks          NUMERIC(5,2) CHECK (marks IS NULL OR (marks >= 0)),
    feedback       TEXT,
    submitted_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    status         VARCHAR(20)  NOT NULL DEFAULT 'submitted'
                   CHECK (status IN ('submitted', 'graded', 'returned')),
    CONSTRAINT uq_student_assignment UNIQUE (assignment_id, student_id)
);

-- ── Timetable ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS timetable (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id   UUID        NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    day_of_week  INT         NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time   TIME        NOT NULL,
    end_time     TIME        NOT NULL,
    room         VARCHAR(100),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_time_order CHECK (start_time < end_time)
);

-- ── Notifications ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID         NOT NULL,
    title       VARCHAR(255) NOT NULL,
    message     TEXT         NOT NULL,
    type        VARCHAR(50)  NOT NULL DEFAULT 'general'
                CHECK (type IN ('assignment', 'attendance', 'grade', 'timetable', 'fee', 'library', 'general')),
    link        TEXT,
    read        BOOLEAN      NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ── Results (normalized marks storage) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS results (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id   UUID         NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    quiz_marks      NUMERIC(5,2) CHECK (quiz_marks IS NULL OR quiz_marks >= 0),
    assignment_marks NUMERIC(5,2) CHECK (assignment_marks IS NULL OR assignment_marks >= 0),
    midterm_marks   NUMERIC(5,2) CHECK (midterm_marks IS NULL OR midterm_marks >= 0),
    final_marks     NUMERIC(5,2) CHECK (final_marks IS NULL OR final_marks >= 0),
    total_marks     NUMERIC(5,2) GENERATED ALWAYS AS (
        COALESCE(quiz_marks, 0) + COALESCE(assignment_marks, 0) +
        COALESCE(midterm_marks, 0) + COALESCE(final_marks, 0)
    ) STORED,
    percentage      NUMERIC(5,2) GENERATED ALWAYS AS (
        CASE WHEN (COALESCE(quiz_marks, 0) + COALESCE(assignment_marks, 0) +
                   COALESCE(midterm_marks, 0) + COALESCE(final_marks, 0)) > 0
        THEN ROUND((COALESCE(quiz_marks, 0) + COALESCE(assignment_marks, 0) +
              COALESCE(midterm_marks, 0) + COALESCE(final_marks, 0)) / 4.0, 2)
        ELSE NULL END
    ) STORED,
    grade           CHAR(2) GENERATED ALWAYS AS (compute_letter_grade(
        CASE WHEN (COALESCE(quiz_marks, 0) + COALESCE(assignment_marks, 0) +
                   COALESCE(midterm_marks, 0) + COALESCE(final_marks, 0)) > 0
        THEN ROUND((COALESCE(quiz_marks, 0) + COALESCE(assignment_marks, 0) +
              COALESCE(midterm_marks, 0) + COALESCE(final_marks, 0)) / 4.0, 2)
        ELSE NULL END
    )) STORED,
    gpa_points      NUMERIC(3,2) GENERATED ALWAYS AS (
        CASE
            WHEN ROUND((COALESCE(quiz_marks, 0) + COALESCE(assignment_marks, 0) +
                  COALESCE(midterm_marks, 0) + COALESCE(final_marks, 0)) / 4.0, 2) >= 90 THEN 4.00
            WHEN ROUND((COALESCE(quiz_marks, 0) + COALESCE(assignment_marks, 0) +
                  COALESCE(midterm_marks, 0) + COALESCE(final_marks, 0)) / 4.0, 2) >= 85 THEN 3.67
            WHEN ROUND((COALESCE(quiz_marks, 0) + COALESCE(assignment_marks, 0) +
                  COALESCE(midterm_marks, 0) + COALESCE(final_marks, 0)) / 4.0, 2) >= 80 THEN 3.33
            WHEN ROUND((COALESCE(quiz_marks, 0) + COALESCE(assignment_marks, 0) +
                  COALESCE(midterm_marks, 0) + COALESCE(final_marks, 0)) / 4.0, 2) >= 75 THEN 3.00
            WHEN ROUND((COALESCE(quiz_marks, 0) + COALESCE(assignment_marks, 0) +
                  COALESCE(midterm_marks, 0) + COALESCE(final_marks, 0)) / 4.0, 2) >= 70 THEN 2.67
            WHEN ROUND((COALESCE(quiz_marks, 0) + COALESCE(assignment_marks, 0) +
                  COALESCE(midterm_marks, 0) + COALESCE(final_marks, 0)) / 4.0, 2) >= 65 THEN 2.33
            WHEN ROUND((COALESCE(quiz_marks, 0) + COALESCE(assignment_marks, 0) +
                  COALESCE(midterm_marks, 0) + COALESCE(final_marks, 0)) / 4.0, 2) >= 60 THEN 2.00
            WHEN ROUND((COALESCE(quiz_marks, 0) + COALESCE(assignment_marks, 0) +
                  COALESCE(midterm_marks, 0) + COALESCE(final_marks, 0)) / 4.0, 2) >= 55 THEN 1.67
            WHEN ROUND((COALESCE(quiz_marks, 0) + COALESCE(assignment_marks, 0) +
                  COALESCE(midterm_marks, 0) + COALESCE(final_marks, 0)) / 4.0, 2) >= 50 THEN 1.33
            WHEN ROUND((COALESCE(quiz_marks, 0) + COALESCE(assignment_marks, 0) +
                  COALESCE(midterm_marks, 0) + COALESCE(final_marks, 0)) / 4.0, 2) >= 40 THEN 1.00
            ELSE 0.00
        END
    ) STORED,
    published       BOOLEAN      NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_enrollment_result UNIQUE (enrollment_id)
);

-- ── Trigger: auto-update updated_at on assignments ──────────────────────
CREATE OR REPLACE FUNCTION trg_assignments_updated_at_fn()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_assignments_updated_at ON assignments;
CREATE TRIGGER trg_assignments_updated_at
    BEFORE UPDATE ON assignments FOR EACH ROW
    EXECUTE FUNCTION trg_assignments_updated_at_fn();

-- ── Trigger: auto-update updated_at on results ──────────────────────────
DROP TRIGGER IF EXISTS trg_results_updated_at ON results;
CREATE TRIGGER trg_results_updated_at
    BEFORE UPDATE ON results FOR EACH ROW
    EXECUTE FUNCTION trg_students_updated_at_fn();

-- ── Trigger: auto-create notification on assignment publish ─────────────
CREATE OR REPLACE FUNCTION trg_assignment_notify_fn()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_enrollment RECORD;
BEGIN
    IF NEW.published = true AND (OLD IS NULL OR OLD.published = false) THEN
        FOR v_enrollment IN
            SELECT e.student_id FROM enrollments e WHERE e.section_id = NEW.section_id
        LOOP
            INSERT INTO notifications (user_id, title, message, type, link)
            VALUES (
                v_enrollment.student_id,
                'New Assignment: ' || NEW.title,
                'A new assignment "' || NEW.title || '" has been posted. Due: ' || NEW.due_date,
                'assignment',
                '/dashboard/student/assignments'
            );
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_assignment_notify ON assignments;
CREATE TRIGGER trg_assignment_notify
    AFTER INSERT OR UPDATE OF published ON assignments
    FOR EACH ROW
    EXECUTE FUNCTION trg_assignment_notify_fn();

-- ── Function: recalculate student GPA ────────────────────────────────────
CREATE OR REPLACE FUNCTION recalculate_gpa(p_student_id UUID)
RETURNS NUMERIC(3,2)
LANGUAGE plpgsql AS $$
DECLARE
    v_gpa NUMERIC(3,2);
BEGIN
    SELECT ROUND(AVG(r.gpa_points), 2) INTO v_gpa
    FROM results r
    JOIN enrollments e ON e.id = r.enrollment_id
    WHERE e.student_id = p_student_id AND r.published = true;

    UPDATE students SET gpa = v_gpa WHERE id = p_student_id;
    RETURN v_gpa;
END;
$$;

-- ── Trigger: auto-recalculate GPA when results are published ────────────
CREATE OR REPLACE FUNCTION trg_result_gpa_fn()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_student_id UUID;
BEGIN
    SELECT e.student_id INTO v_student_id
    FROM enrollments e WHERE e.id = NEW.enrollment_id;

    PERFORM recalculate_gpa(v_student_id);
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_result_gpa ON results;
CREATE TRIGGER trg_result_gpa
    AFTER INSERT OR UPDATE OF published ON results
    FOR EACH ROW
    EXECUTE FUNCTION trg_result_gpa_fn();

-- ── Indexes ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_assignments_section   ON assignments (section_id);
CREATE INDEX IF NOT EXISTS idx_assignments_faculty   ON assignments (faculty_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON assignment_submissions (assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student   ON assignment_submissions (student_id);
CREATE INDEX IF NOT EXISTS idx_timetable_section     ON timetable (section_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user    ON notifications (user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_results_enrollment    ON results (enrollment_id);

-- ── Optional: populate tsv on existing library items ────────────────────
UPDATE library_items SET title = title WHERE tsv IS NULL;
