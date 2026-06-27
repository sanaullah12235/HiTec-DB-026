-- ============================================================================
-- HiSUP_DB — Library Fines Table + Additional Book Seeds
-- ============================================================================
-- Creates a dedicated library_fines table for tracking assessed fines,
-- seeds 30 new books across multiple categories, and seeds fines for
-- existing overdue seed issues.
-- ============================================================================

-- ── 1. LIBRARY FINES TABLE ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS library_fines (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id      UUID          NOT NULL REFERENCES library_issues(id) ON DELETE CASCADE,
    amount        NUMERIC(10,2) NOT NULL DEFAULT 0,
    days_overdue  INT           NOT NULL DEFAULT 0,
    paid          BOOLEAN       NOT NULL DEFAULT false,
    paid_at       TIMESTAMPTZ,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_library_fines_issue ON library_fines (issue_id);
CREATE INDEX IF NOT EXISTS idx_library_fines_paid  ON library_fines (paid);

DO $$
BEGIN
    RAISE NOTICE '[Mig] library_fines table ready.';
END;
$$;

-- ── 2. SEED MORE BOOKS ──────────────────────────────────────────────────
DO $$
DECLARE v_rows INT;
BEGIN
    INSERT INTO library_items (id, title, author, isbn, publisher, category, total_copies, available_copies)
    VALUES
        -- Computer Science (10)
        ('b0000000-0000-0000-0000-000000000004',
         'The C Programming Language',
         'Brian W. Kernighan, Dennis M. Ritchie',
         '978-0-13-110362-7',
         'Prentice Hall',
         'Textbook', 5, 5),

        ('b0000000-0000-0000-0000-000000000005',
         'Structure and Interpretation of Computer Programs',
         'Harold Abelson, Gerald J. Sussman',
         '978-0-26-251087-5',
         'MIT Press',
         'Textbook', 3, 3),

        ('b0000000-0000-0000-0000-000000000006',
         'Design Patterns: Elements of Reusable OO Software',
         'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides',
         '978-0-20-163361-0',
         'Addison-Wesley',
         'Reference', 4, 4),

        ('b0000000-0000-0000-0000-000000000007',
         'Compilers: Principles, Techniques, and Tools',
         'Alfred V. Aho, Monica S. Lam, Ravi Sethi, Jeffrey D. Ullman',
         '978-0-32-148681-3',
         'Addison-Wesley',
         'Textbook', 3, 3),

        ('b0000000-0000-0000-0000-000000000008',
         'Computer Networks',
         'Andrew S. Tanenbaum',
         '978-0-13-212695-3',
         'Prentice Hall',
         'Textbook', 4, 4),

        ('b0000000-0000-0000-0000-000000000009',
         'Artificial Intelligence: A Modern Approach',
         'Stuart Russell, Peter Norvig',
         '978-0-13-604259-4',
         'Prentice Hall',
         'Textbook', 5, 5),

        ('b0000000-0000-0000-0000-00000000000a',
         'The Pragmatic Programmer',
         'Andrew Hunt, David Thomas',
         '978-0-20-161622-4',
         'Addison-Wesley',
         'Reference', 4, 4),

        ('b0000000-0000-0000-0000-00000000000b',
         'Introduction to Machine Learning',
         'Ethem Alpaydin',
         '978-0-26-201243-0',
         'MIT Press',
         'Textbook', 3, 3),

        ('b0000000-0000-0000-0000-00000000000c',
         'The Art of Computer Programming Vol 1',
         'Donald E. Knuth',
         '978-0-20-189683-1',
         'Addison-Wesley',
         'Reference', 2, 2),

        ('b0000000-0000-0000-0000-00000000000d',
         'Operating System Concepts',
         'Abraham Silberschatz, Peter B. Galvin, Greg Gagne',
         '978-1-11-980036-1',
         'Wiley',
         'Textbook', 4, 4),

        -- Electrical Engineering (5)
        ('b0000000-0000-0000-0000-00000000000e',
         'Microelectronic Circuits',
         'Adel S. Sedra, Kenneth C. Smith',
         '978-0-19-085346-7',
         'Oxford University Press',
         'Textbook', 4, 4),

        ('b0000000-0000-0000-0000-00000000000f',
         'Digital Design',
         'M. Morris Mano',
         '978-0-13-454989-7',
         'Prentice Hall',
         'Textbook', 5, 5),

        ('b0000000-0000-0000-0000-000000000010',
         'Introduction to Electrodynamics',
         'David J. Griffiths',
         '978-1-10-842041-9',
         'Cambridge University Press',
         'Textbook', 3, 3),

        ('b0000000-0000-0000-0000-000000000011',
         'Power Electronics: Circuits, Devices & Applications',
         'Muhammad H. Rashid',
         '978-0-13-312590-4',
         'Pearson',
         'Textbook', 3, 3),

        ('b0000000-0000-0000-0000-000000000012',
         'Control Systems Engineering',
         'Norman S. Nise',
         '978-1-11-947422-7',
         'Wiley',
         'Textbook', 4, 4),

        -- Mechanical Engineering (5)
        ('b0000000-0000-0000-0000-000000000013',
         'Thermodynamics: An Engineering Approach',
         'Yunus A. Cengel, Michael A. Boles',
         '978-0-07-339817-4',
         'McGraw-Hill',
         'Textbook', 4, 4),

        ('b0000000-0000-0000-0000-000000000014',
         'Fluid Mechanics',
         'Robert W. Fox, Alan T. McDonald, Philip J. Pritchard',
         '978-1-11-831867-6',
         'Wiley',
         'Textbook', 3, 3),

        ('b0000000-0000-0000-0000-000000000015',
         'Engineering Mechanics: Dynamics',
         'R. C. Hibbeler',
         '978-0-13-391538-4',
         'Pearson',
         'Textbook', 5, 5),

        ('b0000000-0000-0000-0000-000000000016',
         'Fundamentals of Heat and Mass Transfer',
         'Theodore L. Bergman, Adrienne S. Lavine, Frank P. Incropera',
         '978-1-11-935388-1',
         'Wiley',
         'Textbook', 3, 3),

        ('b0000000-0000-0000-0000-000000000017',
         'Shigley Mechanical Engineering Design',
         'Richard G. Budynas, J. Keith Nisbett',
         '978-0-07-339822-4',
         'McGraw-Hill',
         'Reference', 4, 4),

        -- Business / Management (5)
        ('b0000000-0000-0000-0000-000000000018',
         'Principles of Marketing',
         'Philip Kotler, Gary Armstrong',
         '978-0-13-449251-3',
         'Pearson',
         'Textbook', 5, 5),

        ('b0000000-0000-0000-0000-000000000019',
         'Financial Accounting',
         'Robert Libby, Patricia Libby, Daniel Short',
         '978-1-26-056684-2',
         'McGraw-Hill',
         'Textbook', 3, 3),

        ('b0000000-0000-0000-0000-00000000001a',
         'Operations Management',
         'Jay Heizer, Barry Render',
         '978-0-13-413042-2',
         'Pearson',
         'Textbook', 4, 4),

        ('b0000000-0000-0000-0000-00000000001b',
         'Organizational Behavior',
         'Stephen P. Robbins, Timothy A. Judge',
         '978-0-13-487486-9',
         'Pearson',
         'Reference', 3, 3),

        ('b0000000-0000-0000-0000-00000000001c',
         'Strategic Management',
         'Michael A. Hitt, R. Duane Ireland, Robert E. Hoskisson',
         '978-0-35-739470-4',
         'Cengage',
         'Textbook', 4, 4),

        -- Mathematics & Sciences (5)
        ('b0000000-0000-0000-0000-00000000001d',
         'Calculus: Early Transcendentals',
         'James Stewart',
         '978-1-285-74155-0',
         'Cengage',
         'Textbook', 6, 6),

        ('b0000000-0000-0000-0000-00000000001e',
         'Linear Algebra and Its Applications',
         'Gilbert Strang',
         '978-0-03-010567-8',
         'Cengage',
         'Textbook', 4, 4),

        ('b0000000-0000-0000-0000-00000000001f',
         'Elementary Differential Equations',
         'William E. Boyce, Richard C. DiPrima',
         '978-1-11-938773-2',
         'Wiley',
         'Textbook', 3, 3),

        ('b0000000-0000-0000-0000-000000000020',
         'Introduction to Probability',
         'Dimitri P. Bertsekas, John N. Tsitsiklis',
         '978-1-886529-23-6',
         'Athena Scientific',
         'Reference', 3, 3),

        ('b0000000-0000-0000-0000-000000000021',
         'Advanced Engineering Mathematics',
         'Erwin Kreyszig',
         '978-0-47-045836-5',
         'Wiley',
         'Reference', 4, 4);

    GET DIAGNOSTICS v_rows := ROW_COUNT;
    RAISE NOTICE '[Mig] Seeded % additional library items', v_rows;
END;
$$;

-- ── 3. SEED FINES FOR EXISTING OVERDUE ISSUES ───────────────────────────
-- Issue 003: returned 2026-01-20, due 2026-01-01 → 19 days × 50 = 950
-- Issue 004: returned 2026-03-15, due 2026-03-01 → 14 days × 50 = 700
DO $$
DECLARE v_rows INT;
BEGIN
    INSERT INTO library_fines (id, issue_id, amount, days_overdue, paid, paid_at)
    VALUES
        ('d0000000-0000-0000-0000-000000000001',
         'c0000000-0000-0000-0000-000000000003',
         950, 19, false, NULL),
        ('d0000000-0000-0000-0000-000000000002',
         'c0000000-0000-0000-0000-000000000004',
         700, 14, true, '2026-04-01 12:00:00+05');
    GET DIAGNOSTICS v_rows := ROW_COUNT;
    RAISE NOTICE '[Mig] Seeded % library fines', v_rows;
END;
$$;

-- ── 4. RLS POLICY: library_fines (admin & librarian only) ───────────────
ALTER TABLE library_fines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_all_library_fines ON library_fines;
CREATE POLICY admin_all_library_fines ON library_fines
    FOR ALL
    USING (
        EXISTS (SELECT 1 FROM staff WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS librarian_all_library_fines ON library_fines;
CREATE POLICY librarian_all_library_fines ON library_fines
    FOR ALL
    USING (
        EXISTS (SELECT 1 FROM staff WHERE id = auth.uid() AND role = 'librarian')
    );

DROP POLICY IF EXISTS student_view_library_fines ON library_fines;
CREATE POLICY student_view_library_fines ON library_fines
    FOR SELECT
    USING (
        issue_id IN (
            SELECT id FROM library_issues WHERE student_id IN (
                SELECT id FROM students WHERE email = auth.email()
            )
        )
    );
