-- ============================================================================
-- HiSUP DB — Deterministic Seed Data Script
-- All UUIDs are fixed (not gen_random_uuid()) for reproducibility.
-- Every INSERT is wrapped in DO $$ ... $$ blocks with RAISE NOTICE logging.
-- ============================================================================

-- ── Set encryption passphrase if not already configured ─────────────────
DO $$
BEGIN
    IF current_setting('app.encryption_passphrase', true) IS NULL THEN
        PERFORM set_config('app.encryption_passphrase', 'HiSUP_Dev_Key_2026!', false);
    END IF;
    RAISE NOTICE '[Seed] Encryption passphrase ready';
END;
$$;

-- ── Truncate all data (order respects FK dependencies) ─────────────────
TRUNCATE TABLE notifications, timetable, assignment_submissions, assignments,
    results, library_issues, library_items, fee_payments,
    attendance_records, grades, enrollments, sections, courses,
    staff, faculty, students, fee_structure, programs, departments,
    audit_log;

-- ============================================================================
-- 1. DEPARTMENTS (2)
-- ============================================================================
DO $$
DECLARE v_rows INT;
BEGIN
    INSERT INTO departments (id, name, code) VALUES
        ('00000000-0000-0000-0000-000000000001', 'Computer Science', 'CS'),
        ('00000000-0000-0000-0000-000000000002', 'Electrical Engineering', 'EE');
    GET DIAGNOSTICS v_rows := ROW_COUNT;
    RAISE NOTICE '[Seed] Inserted % departments', v_rows;
END;
$$;

-- ============================================================================
-- 2. PROGRAMS (4)
-- ============================================================================
DO $$
DECLARE v_rows INT;
BEGIN
    INSERT INTO programs (id, department_id, name, code, duration_years) VALUES
        ('00000000-0000-0000-0000-000000000010',
         '00000000-0000-0000-0000-000000000001',
         'BS Computer Science', 'BS-CS', 4),
        ('00000000-0000-0000-0000-000000000011',
         '00000000-0000-0000-0000-000000000002',
         'BS Electrical Engineering', 'BS-EE', 4),
        ('00000000-0000-0000-0000-000000000012',
         '00000000-0000-0000-0000-000000000001',
         'MS Computer Science', 'MS-CS', 2),
        ('00000000-0000-0000-0000-000000000013',
         '00000000-0000-0000-0000-000000000002',
         'MS Electrical Engineering', 'MS-EE', 2);
    GET DIAGNOSTICS v_rows := ROW_COUNT;
    RAISE NOTICE '[Seed] Inserted % programs', v_rows;
END;
$$;

-- ============================================================================
-- 3. FACULTY (10: CS=6, EE=4)
-- ============================================================================
DO $$
DECLARE v_rows INT;
BEGIN
    INSERT INTO faculty (id, department_id, name, email, employee_code) VALUES
        ('20000000-0000-0000-0000-000000000001',
         '00000000-0000-0000-0000-000000000001',
         'Dr. Ahmed Khan', 'ahmed.khan@hitecuni.edu.pk', 'FAC-CS-001'),
        ('20000000-0000-0000-0000-000000000002',
         '00000000-0000-0000-0000-000000000001',
         'Dr. Fatima Ali', 'fatima.ali@hitecuni.edu.pk', 'FAC-CS-002'),
        ('20000000-0000-0000-0000-000000000003',
         '00000000-0000-0000-0000-000000000001',
         'Dr. Muhammad Usman', 'muhammad.usman@hitecuni.edu.pk', 'FAC-CS-003'),
        ('20000000-0000-0000-0000-000000000004',
         '00000000-0000-0000-0000-000000000001',
         'Dr. Sana Malik', 'sana.malik@hitecuni.edu.pk', 'FAC-CS-004'),
        ('20000000-0000-0000-0000-000000000005',
         '00000000-0000-0000-0000-000000000001',
         'Prof. Imran Hashmi', 'imran.hashmi@hitecuni.edu.pk', 'FAC-CS-005'),
        ('20000000-0000-0000-0000-000000000006',
         '00000000-0000-0000-0000-000000000001',
         'Dr. Nadia Javed', 'nadia.javed@hitecuni.edu.pk', 'FAC-CS-006'),
        ('20000000-0000-0000-0000-000000000007',
         '00000000-0000-0000-0000-000000000002',
         'Dr. Kamran Siddiqui', 'kamran.siddiqui@hitecuni.edu.pk', 'FAC-EE-001'),
        ('20000000-0000-0000-0000-000000000008',
         '00000000-0000-0000-0000-000000000002',
         'Dr. Hina Tariq', 'hina.tariq@hitecuni.edu.pk', 'FAC-EE-002'),
        ('20000000-0000-0000-0000-000000000009',
         '00000000-0000-0000-0000-000000000002',
         'Dr. Ali Raza', 'ali.raza@hitecuni.edu.pk', 'FAC-EE-003'),
        ('20000000-0000-0000-0000-00000000000a',
         '00000000-0000-0000-0000-000000000002',
         'Prof. Sara Zafar', 'sara.zafar@hitecuni.edu.pk', 'FAC-EE-004');
    GET DIAGNOSTICS v_rows := ROW_COUNT;
    RAISE NOTICE '[Seed] Inserted % faculty members', v_rows;
END;
$$;

-- ============================================================================
-- 4. STAFF (2: admin, librarian)
-- ============================================================================
DO $$
DECLARE v_rows INT;
BEGIN
    INSERT INTO staff (id, department_id, name, email, employee_code, role) VALUES
        ('30000000-0000-0000-0000-000000000001',
         '00000000-0000-0000-0000-000000000001',
         'Admin User', 'admin@hitecuni.edu.pk', 'STF-001', 'admin'),
        ('30000000-0000-0000-0000-000000000002',
         '00000000-0000-0000-0000-000000000001',
         'Librarian User', 'librarian@hitecuni.edu.pk', 'STF-002', 'librarian');
    GET DIAGNOSTICS v_rows := ROW_COUNT;
    RAISE NOTICE '[Seed] Inserted % staff members', v_rows;
END;
$$;

-- ============================================================================
-- 5. COURSES (8: 4 CS, 4 EE)
-- ============================================================================
DO $$
DECLARE v_rows INT;
BEGIN
    INSERT INTO courses (id, department_id, name, code, credits) VALUES
        ('40000000-0000-0000-0000-000000000001',
         '00000000-0000-0000-0000-000000000001',
         'Programming Fundamentals', 'CS101', 3),
        ('40000000-0000-0000-0000-000000000002',
         '00000000-0000-0000-0000-000000000001',
         'Data Structures & Algorithms', 'CS201', 3),
        ('40000000-0000-0000-0000-000000000003',
         '00000000-0000-0000-0000-000000000001',
         'Database Systems', 'CS301', 4),
        ('40000000-0000-0000-0000-000000000004',
         '00000000-0000-0000-0000-000000000001',
         'Artificial Intelligence', 'CS401', 3),
        ('40000000-0000-0000-0000-000000000005',
         '00000000-0000-0000-0000-000000000002',
         'Circuit Analysis', 'EE101', 3),
        ('40000000-0000-0000-0000-000000000006',
         '00000000-0000-0000-0000-000000000002',
         'Digital Logic Design', 'EE201', 3),
        ('40000000-0000-0000-0000-000000000007',
         '00000000-0000-0000-0000-000000000002',
         'Microprocessors', 'EE301', 4),
        ('40000000-0000-0000-0000-000000000008',
         '00000000-0000-0000-0000-000000000002',
         'Power Systems', 'EE401', 3);
    GET DIAGNOSTICS v_rows := ROW_COUNT;
    RAISE NOTICE '[Seed] Inserted % courses', v_rows;
END;
$$;

-- ============================================================================
-- 6. FEE STRUCTURE (4 — one per program, 2026F)
-- ============================================================================
DO $$
DECLARE v_rows INT;
BEGIN
    INSERT INTO fee_structure (id, program_id, semester, amount, description) VALUES
        ('90000000-0000-0000-0000-000000000001',
         '00000000-0000-0000-0000-000000000010', '2026F', 45000.00,
         'BS-CS Tuition Fee - Fall 2026'),
        ('90000000-0000-0000-0000-000000000002',
         '00000000-0000-0000-0000-000000000011', '2026F', 50000.00,
         'BS-EE Tuition Fee - Fall 2026'),
        ('90000000-0000-0000-0000-000000000003',
         '00000000-0000-0000-0000-000000000012', '2026F', 60000.00,
         'MS-CS Tuition Fee - Fall 2026'),
        ('90000000-0000-0000-0000-000000000004',
         '00000000-0000-0000-0000-000000000013', '2026F', 65000.00,
         'MS-EE Tuition Fee - Fall 2026');
    GET DIAGNOSTICS v_rows := ROW_COUNT;
    RAISE NOTICE '[Seed] Inserted % fee structure entries', v_rows;
END;
$$;

-- ============================================================================
-- 7. TEMP TABLE — hold enrollment IDs for grades & attendance
-- ============================================================================
DROP TABLE IF EXISTS _seed_enrollment_ids;
CREATE TEMP TABLE _seed_enrollment_ids (id UUID PRIMARY KEY, idx INT);
-- ============================================================================
-- 8. STUDENTS (100)
-- ============================================================================
DO $$
DECLARE
    v_names TEXT[] := ARRAY[
        'Ahmad Khan', 'Ali Ahmed', 'Amir Hussain', 'Asad Malik',
        'Babar Ali', 'Bilal Ahmad', 'Danish Iqbal', 'Faisal Javed',
        'Farhan Ali', 'Ghulam Mustafa', 'Haider Abbas', 'Hamza Sheikh',
        'Haroon Rashid', 'Hasan Raza', 'Hussain Ahmed', 'Imran Khan',
        'Irfan Ullah', 'Junaid Akhtar', 'Kamran Saeed', 'Kashif Mahmood',
        'Khalid Hussain', 'Mansoor Ahmad', 'Mohsin Ali', 'Nadeem Ahmed',
        'Naeem Akhtar', 'Nasir Khan', 'Naveed Iqbal', 'Obaid Ullah',
        'Owais Raza', 'Pervaiz Akhtar', 'Qadir Hussain', 'Qamar Zaman',
        'Rahim Bakhsh', 'Rashid Mahmood', 'Rizwan Ali', 'Saad Ahmed',
        'Sajid Hussain', 'Salman Khan', 'Shahid Afridi', 'Shoaib Akhtar',
        'Sohail Tanvir', 'Tahir Iqbal', 'Tariq Mahmood', 'Tauseef Ahmed',
        'Umar Farooq', 'Usman Ghani', 'Waqar Younis', 'Waseem Akram',
        'Yasir Arafat', 'Zahid Hasan', 'Zubair Ahmed', 'Aisha Bibi',
        'Asma Khatoon', 'Bushra Ansari', 'Fatima Tuz Zahra', 'Farah Naz',
        'Fouzia Hussain', 'Ghazala Parveen', 'Hina Khurshid', 'Humaira Arshad',
        'Iqra Aziz', 'Javeria Khan', 'Komal Rizvi', 'Lubna Obaid',
        'Madiha Ali', 'Mahreen Sheikh', 'Maria Butt', 'Nadia Hussain',
        'Naheed Akhtar', 'Nasreen Javed', 'Nazia Iqbal', 'Rahat Batool',
        'Rabia Sultana', 'Saba Mahmood', 'Saima Riaz', 'Samina Khalid',
        'Sana Mirza', 'Shabnam Kausar', 'Shazia Khan', 'Tahira Yousaf',
        'Uzma Gillani', 'Yasmin Rashid', 'Zainab Ali', 'Zahra Ahmed',
        'Zubaida Khatoon', 'Zunaira Farooq', 'Rizwana Aslam', 'Shamim Akhtar',
        'Talha Iqbal', 'Rimsha Parveen', 'Abdullah Khan', 'Khadija Hassan',
        'Ibrahim Sheikh', 'Maryam Batool', 'Ismail Raza', 'Amina Tariq',
        'Yusuf Patel', 'Hafsa Ahmed', 'Aamir Sohail', 'Saira Bano'
    ];
    v_program_ids UUID[] := ARRAY[
        '00000000-0000-0000-0000-000000000010',
        '00000000-0000-0000-0000-000000000011',
        '00000000-0000-0000-0000-000000000012',
        '00000000-0000-0000-0000-000000000013'
    ];
    v_id       UUID;
    v_cnic     TEXT;
    v_gpa      NUMERIC(3,2);
    v_bank     TEXT;
    v_prog_idx INT;
    v_email    TEXT;
BEGIN
    FOR i IN 1..100 LOOP
        v_id := ('10000000-0000-0000-0000-' || LPAD(to_hex(i), 12, '0'))::UUID;

        IF i <= 40 THEN
            v_prog_idx := 1;
            v_email := '24-cs-' || LPAD(i::TEXT, 3, '0') || '@student.hitecuni.edu.pk';
        ELSIF i <= 70 THEN
            v_prog_idx := 2;
            v_email := '24-ee-' || LPAD((i - 40)::TEXT, 3, '0') || '@student.hitecuni.edu.pk';
        ELSIF i <= 85 THEN
            v_prog_idx := 3;
            v_email := '24-mcs-' || LPAD((i - 70)::TEXT, 3, '0') || '@student.hitecuni.edu.pk';
        ELSE
            v_prog_idx := 4;
            v_email := '24-mee-' || LPAD((i - 85)::TEXT, 3, '0') || '@student.hitecuni.edu.pk';
        END IF;

        v_cnic := LPAD((4200000000000 + i * 1000)::TEXT, 13, '0');
        v_gpa := ROUND((((i * 13 + 7) % 41)::NUMERIC / 10.0), 2);

        IF i % 5 = 0 THEN
            v_bank := pgp_sym_encrypt(
                LPAD((10000000000000000 + i * 100000)::TEXT, 16, '0'),
                current_setting('app.encryption_passphrase')
            );
        ELSE
            v_bank := NULL;
        END IF;

        INSERT INTO students (id, program_id, name, email, cnic, bank_account, gpa, enrollment_semester)
        VALUES (
            v_id,
            v_program_ids[v_prog_idx],
            v_names[i],
            v_email,
            pgp_sym_encrypt(v_cnic, current_setting('app.encryption_passphrase')),
            v_bank,
            v_gpa,
            '2026F'
        );
    END LOOP;

    RAISE NOTICE '[Seed] Inserted 100 students';
END;
$$;
-- ============================================================================
-- 9. SECTIONS (8 — one per course, semester 2026F)
-- ============================================================================
DO $$
DECLARE v_rows INT;
BEGIN
    INSERT INTO sections (id, course_id, faculty_id, section_name, semester, total_seats, allocated_seats)
    VALUES
        ('50000000-0000-0000-0000-000000000001',
         '40000000-0000-0000-0000-000000000001',
         '20000000-0000-0000-0000-000000000001',
         'A', '2026F', 40, 0),
        ('50000000-0000-0000-0000-000000000002',
         '40000000-0000-0000-0000-000000000002',
         '20000000-0000-0000-0000-000000000002',
         'A', '2026F', 40, 0),
        ('50000000-0000-0000-0000-000000000003',
         '40000000-0000-0000-0000-000000000003',
         '20000000-0000-0000-0000-000000000003',
         'A', '2026F', 35, 0),
        ('50000000-0000-0000-0000-000000000004',
         '40000000-0000-0000-0000-000000000004',
         '20000000-0000-0000-0000-000000000004',
         'A', '2026F', 25, 0),
        ('50000000-0000-0000-0000-000000000005',
         '40000000-0000-0000-0000-000000000005',
         '20000000-0000-0000-0000-000000000007',
         'A', '2026F', 30, 0),
        ('50000000-0000-0000-0000-000000000006',
         '40000000-0000-0000-0000-000000000006',
         '20000000-0000-0000-0000-000000000008',
         'A', '2026F', 30, 0),
        ('50000000-0000-0000-0000-000000000007',
         '40000000-0000-0000-0000-000000000007',
         '20000000-0000-0000-0000-000000000009',
         'A', '2026F', 30, 0),
        ('50000000-0000-0000-0000-000000000008',
         '40000000-0000-0000-0000-000000000008',
         '20000000-0000-0000-0000-00000000000a',
         'A', '2026F', 25, 0);
    GET DIAGNOSTICS v_rows := ROW_COUNT;
    RAISE NOTICE '[Seed] Inserted % sections', v_rows;
END;
$$;

-- ============================================================================
-- 10. ENROLLMENTS (~235)
-- Each BS student gets 2-3 sections, each MS student gets 2 sections.
-- Temp table _seed_enrollment_ids populated concurrently.
-- ============================================================================
DO $$
DECLARE
    v_counter     INT := 0;
    v_student_id  UUID;
    v_section_id  UUID;
    v_enroll_id   UUID;
BEGIN
    -- Phase 1: BS-CS (1-40) -> Section 1 (CS101)
    v_section_id := '50000000-0000-0000-0000-000000000001';
    FOR i IN 1..40 LOOP
        v_counter := v_counter + 1;
        v_student_id := ('10000000-0000-0000-0000-' || LPAD(to_hex(i), 12, '0'))::UUID;
        v_enroll_id := ('60000000-0000-0000-0000-' || LPAD(to_hex(v_counter), 12, '0'))::UUID;
        INSERT INTO enrollments (id, student_id, section_id) VALUES (v_enroll_id, v_student_id, v_section_id);
        INSERT INTO _seed_enrollment_ids (id, idx) VALUES (v_enroll_id, v_counter);
    END LOOP;

    -- Phase 2: BS-CS (1-40) -> Section 2 (CS201)
    v_section_id := '50000000-0000-0000-0000-000000000002';
    FOR i IN 1..40 LOOP
        v_counter := v_counter + 1;
        v_student_id := ('10000000-0000-0000-0000-' || LPAD(to_hex(i), 12, '0'))::UUID;
        v_enroll_id := ('60000000-0000-0000-0000-' || LPAD(to_hex(v_counter), 12, '0'))::UUID;
        INSERT INTO enrollments (id, student_id, section_id) VALUES (v_enroll_id, v_student_id, v_section_id);
        INSERT INTO _seed_enrollment_ids (id, idx) VALUES (v_enroll_id, v_counter);
    END LOOP;

    -- Phase 3: BS-CS (1-20) -> Section 3 (CS301)
    v_section_id := '50000000-0000-0000-0000-000000000003';
    FOR i IN 1..20 LOOP
        v_counter := v_counter + 1;
        v_student_id := ('10000000-0000-0000-0000-' || LPAD(to_hex(i), 12, '0'))::UUID;
        v_enroll_id := ('60000000-0000-0000-0000-' || LPAD(to_hex(v_counter), 12, '0'))::UUID;
        INSERT INTO enrollments (id, student_id, section_id) VALUES (v_enroll_id, v_student_id, v_section_id);
        INSERT INTO _seed_enrollment_ids (id, idx) VALUES (v_enroll_id, v_counter);
    END LOOP;

    -- Phase 4: MS-CS (71-85) -> Section 3 (CS301)
    v_section_id := '50000000-0000-0000-0000-000000000003';
    FOR i IN 71..85 LOOP
        v_counter := v_counter + 1;
        v_student_id := ('10000000-0000-0000-0000-' || LPAD(to_hex(i), 12, '0'))::UUID;
        v_enroll_id := ('60000000-0000-0000-0000-' || LPAD(to_hex(v_counter), 12, '0'))::UUID;
        INSERT INTO enrollments (id, student_id, section_id) VALUES (v_enroll_id, v_student_id, v_section_id);
        INSERT INTO _seed_enrollment_ids (id, idx) VALUES (v_enroll_id, v_counter);
    END LOOP;

    -- Phase 5: MS-CS (71-85) -> Section 4 (CS401)
    v_section_id := '50000000-0000-0000-0000-000000000004';
    FOR i IN 71..85 LOOP
        v_counter := v_counter + 1;
        v_student_id := ('10000000-0000-0000-0000-' || LPAD(to_hex(i), 12, '0'))::UUID;
        v_enroll_id := ('60000000-0000-0000-0000-' || LPAD(to_hex(v_counter), 12, '0'))::UUID;
        INSERT INTO enrollments (id, student_id, section_id) VALUES (v_enroll_id, v_student_id, v_section_id);
        INSERT INTO _seed_enrollment_ids (id, idx) VALUES (v_enroll_id, v_counter);
    END LOOP;

    -- Phase 6: BS-EE (41-70) -> Section 5 (EE101)
    v_section_id := '50000000-0000-0000-0000-000000000005';
    FOR i IN 41..70 LOOP
        v_counter := v_counter + 1;
        v_student_id := ('10000000-0000-0000-0000-' || LPAD(to_hex(i), 12, '0'))::UUID;
        v_enroll_id := ('60000000-0000-0000-0000-' || LPAD(to_hex(v_counter), 12, '0'))::UUID;
        INSERT INTO enrollments (id, student_id, section_id) VALUES (v_enroll_id, v_student_id, v_section_id);
        INSERT INTO _seed_enrollment_ids (id, idx) VALUES (v_enroll_id, v_counter);
    END LOOP;

    -- Phase 7: BS-EE (41-70) -> Section 6 (EE201)
    v_section_id := '50000000-0000-0000-0000-000000000006';
    FOR i IN 41..70 LOOP
        v_counter := v_counter + 1;
        v_student_id := ('10000000-0000-0000-0000-' || LPAD(to_hex(i), 12, '0'))::UUID;
        v_enroll_id := ('60000000-0000-0000-0000-' || LPAD(to_hex(v_counter), 12, '0'))::UUID;
        INSERT INTO enrollments (id, student_id, section_id) VALUES (v_enroll_id, v_student_id, v_section_id);
        INSERT INTO _seed_enrollment_ids (id, idx) VALUES (v_enroll_id, v_counter);
    END LOOP;

    -- Phase 8: BS-EE (41-55) -> Section 7 (EE301)
    v_section_id := '50000000-0000-0000-0000-000000000007';
    FOR i IN 41..55 LOOP
        v_counter := v_counter + 1;
        v_student_id := ('10000000-0000-0000-0000-' || LPAD(to_hex(i), 12, '0'))::UUID;
        v_enroll_id := ('60000000-0000-0000-0000-' || LPAD(to_hex(v_counter), 12, '0'))::UUID;
        INSERT INTO enrollments (id, student_id, section_id) VALUES (v_enroll_id, v_student_id, v_section_id);
        INSERT INTO _seed_enrollment_ids (id, idx) VALUES (v_enroll_id, v_counter);
    END LOOP;

    -- Phase 9: MS-EE (86-100) -> Section 7 (EE301)
    v_section_id := '50000000-0000-0000-0000-000000000007';
    FOR i IN 86..100 LOOP
        v_counter := v_counter + 1;
        v_student_id := ('10000000-0000-0000-0000-' || LPAD(to_hex(i), 12, '0'))::UUID;
        v_enroll_id := ('60000000-0000-0000-0000-' || LPAD(to_hex(v_counter), 12, '0'))::UUID;
        INSERT INTO enrollments (id, student_id, section_id) VALUES (v_enroll_id, v_student_id, v_section_id);
        INSERT INTO _seed_enrollment_ids (id, idx) VALUES (v_enroll_id, v_counter);
    END LOOP;

    -- Phase 10: MS-EE (86-100) -> Section 8 (EE401)
    v_section_id := '50000000-0000-0000-0000-000000000008';
    FOR i IN 86..100 LOOP
        v_counter := v_counter + 1;
        v_student_id := ('10000000-0000-0000-0000-' || LPAD(to_hex(i), 12, '0'))::UUID;
        v_enroll_id := ('60000000-0000-0000-0000-' || LPAD(to_hex(v_counter), 12, '0'))::UUID;
        INSERT INTO enrollments (id, student_id, section_id) VALUES (v_enroll_id, v_student_id, v_section_id);
        INSERT INTO _seed_enrollment_ids (id, idx) VALUES (v_enroll_id, v_counter);
    END LOOP;

    RAISE NOTICE '[Seed] Inserted % enrollments', v_counter;
END;
$$;
-- ============================================================================
-- 11. GRADES (one per enrollment, using compute_letter_grade())
-- ============================================================================
DO $$
DECLARE
    v_rec       RECORD;
    v_counter   INT := 0;
    v_numeric   NUMERIC(5,2);
    v_grade_id  UUID;
BEGIN
    FOR v_rec IN SELECT id FROM _seed_enrollment_ids ORDER BY idx LOOP
        v_counter := v_counter + 1;
        v_numeric := ROUND(((v_counter % 56) + 40)::NUMERIC, 0);
        v_grade_id := ('70000000-0000-0000-0000-' || LPAD(to_hex(v_counter), 12, '0'))::UUID;

        INSERT INTO grades (id, enrollment_id, numeric_grade, letter_grade)
        VALUES (v_grade_id, v_rec.id, v_numeric, compute_letter_grade(v_numeric));
    END LOOP;

    RAISE NOTICE '[Seed] Inserted % grades', v_counter;
END;
$$;

-- ============================================================================
-- 12. ATTENDANCE RECORDS (10 per enrollment, Jan-Mar 2026)
-- ============================================================================
DO $$
DECLARE
    v_rec       RECORD;
    v_counter   INT := 0;
    v_att_id    UUID;
    v_dates     DATE[] := ARRAY[
        '2026-01-12', '2026-01-19', '2026-01-26',
        '2026-02-02', '2026-02-09', '2026-02-16', '2026-02-23',
        '2026-03-02', '2026-03-09', '2026-03-16'
    ];
    v_status    TEXT;
BEGIN
    FOR v_rec IN SELECT id, idx FROM _seed_enrollment_ids ORDER BY idx LOOP
        FOR j IN 1..10 LOOP
            v_counter := v_counter + 1;
            v_att_id := ('80000000-0000-0000-0000-' || LPAD(to_hex(v_counter), 12, '0'))::UUID;

            v_status := CASE (v_rec.idx + j) % 5
                WHEN 0 THEN 'Absent'
                WHEN 1 THEN 'Late'
                ELSE 'Present'
            END;

            INSERT INTO attendance_records (id, enrollment_id, date, status)
            VALUES (v_att_id, v_rec.id, v_dates[j], v_status);
        END LOOP;
    END LOOP;

    RAISE NOTICE '[Seed] Inserted % attendance records', v_counter;
END;
$$;

-- ============================================================================
-- 13. FEE PAYMENTS (100 — one per student)
-- 70% completed, 20% pending, 10% failed
-- ============================================================================
DO $$
DECLARE
    v_id         UUID;
    v_student_id UUID;
    v_fee_id     UUID;
    v_amount     NUMERIC(12,2);
    v_status     TEXT;
    v_paid_at    TIMESTAMPTZ;
    v_txn_ref    TEXT;
BEGIN
    FOR i IN 1..100 LOOP
        v_id := ('a0000000-0000-0000-0000-' || LPAD(to_hex(i), 12, '0'))::UUID;
        v_student_id := ('10000000-0000-0000-0000-' || LPAD(to_hex(i), 12, '0'))::UUID;

        IF i <= 40 THEN
            v_fee_id := '90000000-0000-0000-0000-000000000001';
            v_amount := 45000.00;
        ELSIF i <= 70 THEN
            v_fee_id := '90000000-0000-0000-0000-000000000002';
            v_amount := 50000.00;
        ELSIF i <= 85 THEN
            v_fee_id := '90000000-0000-0000-0000-000000000003';
            v_amount := 60000.00;
        ELSE
            v_fee_id := '90000000-0000-0000-0000-000000000004';
            v_amount := 65000.00;
        END IF;

        IF i <= 70 THEN
            v_status := 'completed';
            v_paid_at := '2026-01-15 09:00:00+05'::TIMESTAMPTZ + (i * interval '1 hour');
            v_txn_ref := 'TXN-' || LPAD(i::TEXT, 6, '0');
        ELSIF i <= 90 THEN
            v_status := 'pending';
            v_paid_at := NULL;
            v_txn_ref := NULL;
        ELSE
            v_status := 'failed';
            v_paid_at := NULL;
            v_txn_ref := 'TXN-' || LPAD(i::TEXT, 6, '0');
        END IF;

        INSERT INTO fee_payments (id, student_id, fee_structure_id, amount, paid_at, transaction_ref, status)
        VALUES (v_id, v_student_id, v_fee_id, v_amount, v_paid_at, v_txn_ref, v_status);
    END LOOP;

    RAISE NOTICE '[Seed] Inserted 100 fee payments';
END;
$$;

-- ============================================================================
-- 14. LIBRARY ITEMS (3 — tsv populated by BEFORE INSERT trigger)
-- ============================================================================
DO $$
DECLARE v_rows INT;
BEGIN
    INSERT INTO library_items (id, title, author, isbn, publisher, category, total_copies, available_copies)
    VALUES
        ('b0000000-0000-0000-0000-000000000001',
         'Introduction to Algorithms',
         'Thomas H. Cormen',
         '978-0-262-03384-8',
         'MIT Press',
         'Computer Science',
         3, 2),
        ('b0000000-0000-0000-0000-000000000002',
         'Database System Concepts',
         'Abraham Silberschatz',
         '978-0-07-802215-9',
         'McGraw-Hill',
         'Computer Science',
         2, 1),
        ('b0000000-0000-0000-0000-000000000003',
         'Clean Code: A Handbook of Agile Software Craftsmanship',
         'Robert C. Martin',
         '978-0-13-235088-4',
         'Prentice Hall',
         'Software Engineering',
         3, 3);
    GET DIAGNOSTICS v_rows := ROW_COUNT;
    RAISE NOTICE '[Seed] Inserted % library items', v_rows;
END;
$$;

-- ============================================================================
-- 15. LIBRARY ISSUES (6 — various statuses)
-- Fine calculation: 50 * days_overdue for overdue items
-- ============================================================================
DO $$
DECLARE v_rows INT;
BEGIN
    INSERT INTO library_issues (id, student_id, item_id, issued_at, due_date, returned_at, status)
    VALUES
        ('c0000000-0000-0000-0000-000000000001',
         '10000000-0000-0000-0000-000000000001',
         'b0000000-0000-0000-0000-000000000001',
         '2026-01-10 09:00:00+05', '2026-02-10', NULL, 'issued'),

        ('c0000000-0000-0000-0000-000000000002',
         '10000000-0000-0000-0000-000000000005',
         'b0000000-0000-0000-0000-000000000002',
         '2026-01-15 09:00:00+05', '2026-02-15', '2026-02-14 10:00:00+05', 'returned'),

        ('c0000000-0000-0000-0000-000000000003',
         '10000000-0000-0000-0000-00000000000a',
         'b0000000-0000-0000-0000-000000000003',
         '2025-12-01 09:00:00+05', '2026-01-01', '2026-01-20 11:00:00+05', 'overdue'),

        ('c0000000-0000-0000-0000-000000000004',
         '10000000-0000-0000-0000-000000000014',
         'b0000000-0000-0000-0000-000000000001',
         '2026-02-01 09:00:00+05', '2026-03-01', '2026-03-15 10:00:00+05', 'overdue'),

        ('c0000000-0000-0000-0000-000000000005',
         '10000000-0000-0000-0000-00000000001e',
         'b0000000-0000-0000-0000-000000000002',
         '2026-01-05 09:00:00+05', '2026-02-05', NULL, 'overdue'),

        ('c0000000-0000-0000-0000-000000000006',
         '10000000-0000-0000-0000-000000000003',
         'b0000000-0000-0000-0000-000000000003',
         '2026-02-15 09:00:00+05', '2026-03-15', '2026-03-10 10:00:00+05', 'returned');
    GET DIAGNOSTICS v_rows := ROW_COUNT;
    RAISE NOTICE '[Seed] Inserted % library issues', v_rows;
END;
$$;

-- ============================================================================
-- 16. AUTH USERS (112 — so every person can log in)
-- Password for ALL: password123
-- Emails match the existing seed data; UUIDs match faculty/students/staff IDs.
-- ============================================================================

-- ── Faculty (10) ──────────────────────────────────────────────────────
DO $$
DECLARE
    v_id    UUID;
    v_email TEXT;
    v_name  TEXT;
    v_role  TEXT := 'faculty';
BEGIN
    FOR i IN 1..10 LOOP
        v_id := ('20000000-0000-0000-0000-00000000000' || to_hex(i))::UUID;
        v_name := CASE i
            WHEN 1 THEN 'Dr. Ahmed Khan'
            WHEN 2 THEN 'Dr. Fatima Ali'
            WHEN 3 THEN 'Dr. Muhammad Usman'
            WHEN 4 THEN 'Dr. Sana Malik'
            WHEN 5 THEN 'Prof. Imran Hashmi'
            WHEN 6 THEN 'Dr. Nadia Javed'
            WHEN 7 THEN 'Dr. Kamran Siddiqui'
            WHEN 8 THEN 'Dr. Hina Tariq'
            WHEN 9 THEN 'Dr. Ali Raza'
            WHEN 10 THEN 'Prof. Sara Zafar'
        END;
        v_email := CASE i
            WHEN 1 THEN 'ahmed.khan@hitecuni.edu.pk'
            WHEN 2 THEN 'fatima.ali@hitecuni.edu.pk'
            WHEN 3 THEN 'muhammad.usman@hitecuni.edu.pk'
            WHEN 4 THEN 'sana.malik@hitecuni.edu.pk'
            WHEN 5 THEN 'imran.hashmi@hitecuni.edu.pk'
            WHEN 6 THEN 'nadia.javed@hitecuni.edu.pk'
            WHEN 7 THEN 'kamran.siddiqui@hitecuni.edu.pk'
            WHEN 8 THEN 'hina.tariq@hitecuni.edu.pk'
            WHEN 9 THEN 'ali.raza@hitecuni.edu.pk'
            WHEN 10 THEN 'sara.zafar@hitecuni.edu.pk'
        END;

        INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password,
            email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
            created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
        VALUES (v_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            v_email,
            crypt('password123', gen_salt('bf', 10)),
            now(),
            jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email'), 'role', v_role),
            jsonb_build_object('role', v_role, 'name', v_name),
            now(), now(), '', '', '', '')
        ON CONFLICT (id) DO NOTHING;
    END LOOP;
    RAISE NOTICE '[Seed] Inserted 10 auth users (faculty)';
END;
$$;

-- ── Staff (2: admin + librarian) ──────────────────────────────────────
DO $$
BEGIN
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES
        ('30000000-0000-0000-0000-000000000001',
         '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'admin@hitecuni.edu.pk',
         crypt('password123', gen_salt('bf', 10)),
         now(),
         jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email'), 'role', 'admin'),
         jsonb_build_object('role', 'admin', 'name', 'Admin User'),
         now(), now(), '', '', '', ''),

        ('30000000-0000-0000-0000-000000000002',
         '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'librarian@hitecuni.edu.pk',
         crypt('password123', gen_salt('bf', 10)),
         now(),
         jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email'), 'role', 'librarian'),
         jsonb_build_object('role', 'librarian', 'name', 'Librarian User'),
         now(), now(), '', '', '', '')
    ON CONFLICT (id) DO NOTHING;

    RAISE NOTICE '[Seed] Inserted 2 auth users (staff)';
END;
$$;

-- ── Students (100) ────────────────────────────────────────────────────
DO $$
DECLARE
    v_id    UUID;
    v_email TEXT;
    v_name  TEXT;
    v_names TEXT[] := ARRAY[
        'Ahmad Khan', 'Ali Ahmed', 'Amir Hussain', 'Asad Malik',
        'Babar Ali', 'Bilal Ahmad', 'Danish Iqbal', 'Faisal Javed',
        'Farhan Ali', 'Ghulam Mustafa', 'Haider Abbas', 'Hamza Sheikh',
        'Haroon Rashid', 'Hasan Raza', 'Hussain Ahmed', 'Imran Khan',
        'Irfan Ullah', 'Junaid Akhtar', 'Kamran Saeed', 'Kashif Mahmood',
        'Khalid Hussain', 'Mansoor Ahmad', 'Mohsin Ali', 'Nadeem Ahmed',
        'Naeem Akhtar', 'Nasir Khan', 'Naveed Iqbal', 'Obaid Ullah',
        'Owais Raza', 'Pervaiz Akhtar', 'Qadir Hussain', 'Qamar Zaman',
        'Rahim Bakhsh', 'Rashid Mahmood', 'Rizwan Ali', 'Saad Ahmed',
        'Sajid Hussain', 'Salman Khan', 'Shahid Afridi', 'Shoaib Akhtar',
        'Sohail Tanvir', 'Tahir Iqbal', 'Tariq Mahmood', 'Tauseef Ahmed',
        'Umar Farooq', 'Usman Ghani', 'Waqar Younis', 'Waseem Akram',
        'Yasir Arafat', 'Zahid Hasan', 'Zubair Ahmed', 'Aisha Bibi',
        'Asma Khatoon', 'Bushra Ansari', 'Fatima Tuz Zahra', 'Farah Naz',
        'Fouzia Hussain', 'Ghazala Parveen', 'Hina Khurshid', 'Humaira Arshad',
        'Iqra Aziz', 'Javeria Khan', 'Komal Rizvi', 'Lubna Obaid',
        'Madiha Ali', 'Mahreen Sheikh', 'Maria Butt', 'Nadia Hussain',
        'Naheed Akhtar', 'Nasreen Javed', 'Nazia Iqbal', 'Rahat Batool',
        'Rabia Sultana', 'Saba Mahmood', 'Saima Riaz', 'Samina Khalid',
        'Sana Mirza', 'Shabnam Kausar', 'Shazia Khan', 'Tahira Yousaf',
        'Uzma Gillani', 'Yasmin Rashid', 'Zainab Ali', 'Zahra Ahmed',
        'Zubaida Khatoon', 'Zunaira Farooq', 'Rizwana Aslam', 'Shamim Akhtar',
        'Talha Iqbal', 'Rimsha Parveen', 'Abdullah Khan', 'Khadija Hassan',
        'Ibrahim Sheikh', 'Maryam Batool', 'Ismail Raza', 'Amina Tariq',
        'Yusuf Patel', 'Hafsa Ahmed', 'Aamir Sohail', 'Saira Bano'
    ];
BEGIN
    FOR i IN 1..100 LOOP
        v_id    := ('10000000-0000-0000-0000-' || LPAD(to_hex(i), 12, '0'))::UUID;

        IF i <= 40 THEN
            v_email := '24-cs-' || LPAD(i::TEXT, 3, '0') || '@student.hitecuni.edu.pk';
        ELSIF i <= 70 THEN
            v_email := '24-ee-' || LPAD((i - 40)::TEXT, 3, '0') || '@student.hitecuni.edu.pk';
        ELSIF i <= 85 THEN
            v_email := '24-mcs-' || LPAD((i - 70)::TEXT, 3, '0') || '@student.hitecuni.edu.pk';
        ELSE
            v_email := '24-mee-' || LPAD((i - 85)::TEXT, 3, '0') || '@student.hitecuni.edu.pk';
        END IF;

        INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password,
            email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
            created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
        VALUES (v_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            v_email,
            crypt('password123', gen_salt('bf', 10)),
            now(),
            jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email'), 'role', 'student'),
            jsonb_build_object('role', 'student', 'name', v_names[i]),
            now(), now(), '', '', '', '')
        ON CONFLICT (id) DO NOTHING;
    END LOOP;
    RAISE NOTICE '[Seed] Inserted 100 auth users (students)';
END;
$$;

-- ============================================================================
-- 17. CLEANUP - drop temp table
-- ============================================================================
DROP TABLE IF EXISTS _seed_enrollment_ids;

-- ============================================================================
-- POST-SEED VALIDATION
-- ============================================================================
DO $$
DECLARE
    v_students    INT;
    v_enrollments INT;
    v_grades      INT;
    v_attendance  INT;
    v_payments    INT;
    v_sections    INT;
    v_lib_items   INT;
    v_lib_issues  INT;
BEGIN
    SELECT COUNT(*) INTO v_students    FROM students;
    SELECT COUNT(*) INTO v_enrollments FROM enrollments;
    SELECT COUNT(*) INTO v_grades      FROM grades;
    SELECT COUNT(*) INTO v_attendance  FROM attendance_records;
    SELECT COUNT(*) INTO v_payments    FROM fee_payments;
    SELECT COUNT(*) INTO v_sections    FROM sections;
    SELECT COUNT(*) INTO v_lib_items   FROM library_items;
    SELECT COUNT(*) INTO v_lib_issues  FROM library_issues;

    RAISE NOTICE '[Seed] Final counts: % students, % enrollments, % grades, % attend, % payments, % sections, % items, % issues',
        v_students, v_enrollments, v_grades, v_attendance, v_payments,
        v_sections, v_lib_items, v_lib_issues;

    RAISE NOTICE '[Seed] Seed complete.';
END;
$$;

-- ============================================================================
-- 17. ASSIGNMENTS (16 — 2 per section, mix of published/draft)
-- ============================================================================
DO $$
DECLARE
    v_section_id UUID;
    v_faculty_id UUID;
    v_counter INT := 0;
    v_assign_id UUID;
    v_titles TEXT[] := ARRAY[
        'Lab Report 1', 'Midterm Review', 'Programming Assignment 1',
        'Research Paper', 'Problem Set 3', 'Final Project Proposal',
        'Quiz Preparation', 'Group Presentation',
        'Circuit Simulation Lab', 'VHDL Exercise', 'Microprocessor Lab 1',
        'Power System Analysis', 'Data Analysis Report', 'Algorithm Design',
        'Embedded Systems Lab', 'Control Systems Review'
    ];
BEGIN
    FOR s_idx IN 1..8 LOOP
        v_section_id := ('50000000-0000-0000-0000-00000000000' || to_hex(s_idx))::UUID;
        v_faculty_id := CASE s_idx
            WHEN 1 THEN '20000000-0000-0000-0000-000000000001'
            WHEN 2 THEN '20000000-0000-0000-0000-000000000002'
            WHEN 3 THEN '20000000-0000-0000-0000-000000000003'
            WHEN 4 THEN '20000000-0000-0000-0000-000000000004'
            WHEN 5 THEN '20000000-0000-0000-0000-000000000007'
            WHEN 6 THEN '20000000-0000-0000-0000-000000000008'
            WHEN 7 THEN '20000000-0000-0000-0000-000000000009'
            WHEN 8 THEN '20000000-0000-0000-0000-00000000000a'
        END;

        FOR a_idx IN 1..2 LOOP
            v_counter := v_counter + 1;
            v_assign_id := ('d1000000-0000-0000-0000-' || LPAD(to_hex(v_counter), 12, '0'))::UUID;
            INSERT INTO assignments (id, section_id, faculty_id, title, description, due_date, max_marks, published, created_at)
            VALUES (
                v_assign_id, v_section_id, v_faculty_id,
                v_titles[((s_idx - 1) * 2 + a_idx)],
                'Complete this assignment as per the instructions given in class. Submit before the deadline.',
                ('2026-04-' || LPAD((10 + v_counter)::TEXT, 2, '0'))::DATE,
                CASE WHEN a_idx = 1 THEN 100 ELSE 50 END,
                a_idx = 1,
                ('2026-03-' || LPAD((v_counter % 28 + 1)::TEXT, 2, '0') || ' 09:00:00+05')::TIMESTAMPTZ
            );
        END LOOP;
    END LOOP;
    RAISE NOTICE '[Seed] Inserted % assignments', v_counter;
END;
$$;

-- ============================================================================
-- 18. ASSIGNMENT SUBMISSIONS (8 — first enrollment in each section)
-- First enrollment per section (counter hex):
--   S1:01 S2:29 S3:51 S4:74 S5:83 S6:a1 S7:bf S8:dd
-- First student per section:
--   S1:01 S2:01 S3:01 S4:47 S5:29 S6:29 S7:29 S8:56
-- ============================================================================
DO $$
DECLARE
    v_counter INT := 0;
    v_sub_id UUID;
    v_assign_id UUID;
    v_enrollment_hex TEXT;
    v_student_hex TEXT;
BEGIN
    FOR s_idx IN 1..8 LOOP
        v_counter := v_counter + 1;
        v_sub_id := ('d2000000-0000-0000-0000-' || LPAD(to_hex(v_counter), 12, '0'))::UUID;
        v_assign_id := ('d1000000-0000-0000-0000-' || LPAD(to_hex((s_idx - 1) * 2 + 1), 12, '0'))::UUID;

        v_enrollment_hex := CASE s_idx
            WHEN 1 THEN '01' WHEN 2 THEN '29' WHEN 3 THEN '51'
            WHEN 4 THEN '74' WHEN 5 THEN '83' WHEN 6 THEN 'a1'
            WHEN 7 THEN 'bf' WHEN 8 THEN 'dd'
        END;
        v_student_hex := CASE s_idx
            WHEN 1 THEN '01' WHEN 2 THEN '01' WHEN 3 THEN '01'
            WHEN 4 THEN '47' WHEN 5 THEN '29' WHEN 6 THEN '29'
            WHEN 7 THEN '29' WHEN 8 THEN '56'
        END;

        INSERT INTO assignment_submissions (id, assignment_id, student_id, marks, feedback, status, submitted_at)
        VALUES (
            v_sub_id, v_assign_id,
            ('10000000-0000-0000-0000-' || LPAD(v_student_hex, 12, '0'))::UUID,
            CASE WHEN s_idx % 2 = 0 THEN ROUND((RANDOM() * 90 + 10)::NUMERIC, 2) ELSE NULL END,
            CASE WHEN s_idx % 2 = 0 THEN 'Good work, but improve citation.' ELSE NULL END,
            CASE WHEN s_idx % 2 = 0 THEN 'graded' ELSE 'submitted' END,
            '2026-03-20 10:00:00+05'::TIMESTAMPTZ
        );
    END LOOP;
    RAISE NOTICE '[Seed] Inserted % assignment submissions', v_counter;
END;
$$;

-- ============================================================================
-- 19. TIMETABLE (24 — 3 per section, spread across week)
-- ============================================================================
DO $$
DECLARE
    v_counter INT := 0;
    v_tt_id UUID;
    v_section_id UUID;
    v_days INT[] := ARRAY[1, 3, 5];
    v_start_hours INT[] := ARRAY[9, 11, 14];
BEGIN
    FOR s_idx IN 1..8 LOOP
        v_section_id := ('50000000-0000-0000-0000-00000000000' || to_hex(s_idx))::UUID;
        FOR t_idx IN 1..3 LOOP
            v_counter := v_counter + 1;
            v_tt_id := ('d3000000-0000-0000-0000-' || LPAD(to_hex(v_counter), 12, '0'))::UUID;
            INSERT INTO timetable (id, section_id, day_of_week, start_time, end_time, room)
            VALUES (
                v_tt_id, v_section_id, v_days[t_idx],
                (v_start_hours[t_idx] || ':00')::TIME,
                ((v_start_hours[t_idx] + 1) || ':30')::TIME,
                'Room ' || (100 + s_idx * 10 + t_idx)
            );
        END LOOP;
    END LOOP;
    RAISE NOTICE '[Seed] Inserted % timetable entries', v_counter;
END;
$$;

-- ============================================================================
-- 20. RESULTS (40 — one per enrollment for first 40 enrollments)
-- ============================================================================
DO $$
DECLARE
    v_counter INT := 0;
    v_result_id UUID;
    v_enr_id UUID;
    v_quiz NUMERIC(5,2);
    v_assign NUMERIC(5,2);
    v_mid NUMERIC(5,2);
    v_final NUMERIC(5,2);
BEGIN
    FOR idx IN 1..40 LOOP
        v_counter := v_counter + 1;
        v_enr_id := ('60000000-0000-0000-0000-' || LPAD(to_hex(idx), 12, '0'))::UUID;
        v_result_id := ('d4000000-0000-0000-0000-' || LPAD(to_hex(v_counter), 12, '0'))::UUID;

        v_quiz := ROUND((RANDOM() * 20 + 10)::NUMERIC, 2);
        v_assign := ROUND((RANDOM() * 20 + 10)::NUMERIC, 2);
        v_mid := ROUND((RANDOM() * 25 + 15)::NUMERIC, 2);
        v_final := ROUND((RANDOM() * 30 + 20)::NUMERIC, 2);

        INSERT INTO results (id, enrollment_id, quiz_marks, assignment_marks, midterm_marks, final_marks, published)
        VALUES (v_result_id, v_enr_id, v_quiz, v_assign, v_mid, v_final, true);
    END LOOP;
    RAISE NOTICE '[Seed] Inserted % results', v_counter;
END;
$$;

-- ============================================================================
-- 21. NOTIFICATIONS (20 — variety of types)
-- ============================================================================
DO $$
DECLARE
    v_counter INT := 0;
    v_notif_id UUID;
BEGIN
    -- Assignment notifications for first 10 students
    FOR i IN 1..10 LOOP
        v_counter := v_counter + 1;
        v_notif_id := ('d5000000-0000-0000-0000-' || LPAD(to_hex(v_counter), 12, '0'))::UUID;
        INSERT INTO notifications (id, user_id, title, message, type, link, read, created_at)
        VALUES (
            v_notif_id,
            ('10000000-0000-0000-0000-' || LPAD(to_hex(i), 12, '0'))::UUID,
            'New Assignment Posted',
            'A new assignment "Lab Report 1" has been posted in Programming Fundamentals. Due: 2026-04-10.',
            'assignment', '/dashboard/student/assignments',
            i <= 5,
            '2026-03-01 09:00:00+05'::TIMESTAMPTZ
        );
    END LOOP;

    -- Grade notifications for next 5 students
    FOR i IN 11..15 LOOP
        v_counter := v_counter + 1;
        v_notif_id := ('d5000000-0000-0000-0000-' || LPAD(to_hex(v_counter), 12, '0'))::UUID;
        INSERT INTO notifications (id, user_id, title, message, type, link, read, created_at)
        VALUES (
            v_notif_id,
            ('10000000-0000-0000-0000-' || LPAD(to_hex(i), 12, '0'))::UUID,
            'Results Published',
            'Your results for Programming Fundamentals have been published. Check your grade.',
            'grade', '/dashboard/student/results',
            i <= 13,
            '2026-03-15 14:00:00+05'::TIMESTAMPTZ
        );
    END LOOP;

    -- Attendance and general notifications
    FOR i IN 16..20 LOOP
        v_counter := v_counter + 1;
        v_notif_id := ('d5000000-0000-0000-0000-' || LPAD(to_hex(v_counter), 12, '0'))::UUID;
        INSERT INTO notifications (id, user_id, title, message, type, link, read, created_at)
        VALUES (
            v_notif_id,
            ('10000000-0000-0000-0000-' || LPAD(to_hex(i), 12, '0'))::UUID,
            CASE i
                WHEN 16 THEN 'Attendance Updated'
                WHEN 17 THEN 'Fee Reminder'
                WHEN 18 THEN 'Library Book Due'
                WHEN 19 THEN 'Schedule Change'
                ELSE 'Welcome to HiSUP'
            END,
            CASE i
                WHEN 16 THEN 'Your attendance for Data Structures has been marked.'
                WHEN 17 THEN 'Tuition fee for Fall 2026 is due by 2026-04-15.'
                WHEN 18 THEN 'Your borrowed book "Introduction to Algorithms" is due in 3 days.'
                WHEN 19 THEN 'Your timetable has been updated. Check the new schedule.'
                ELSE 'Welcome to HITEC Smart University Portal! Explore your dashboard.'
            END,
            CASE i
                WHEN 16 THEN 'attendance'
                WHEN 17 THEN 'fee'
                WHEN 18 THEN 'library'
                WHEN 19 THEN 'timetable'
                ELSE 'general'
            END,
            CASE i
                WHEN 16 THEN '/dashboard/student/attendance'
                WHEN 17 THEN '/dashboard/student/fees'
                WHEN 18 THEN '/dashboard/library'
                WHEN 19 THEN '/dashboard/student/timetable'
                ELSE '/dashboard/student'
            END,
            i <= 18,
            ('2026-03-' || LPAD((i + 5)::TEXT, 2, '0') || ' 10:00:00+05')::TIMESTAMPTZ
        );
    END LOOP;

    RAISE NOTICE '[Seed] Inserted % notifications', v_counter;
END;
$$;

-- ============================================================================
-- POST-SEED VALIDATION (updated)
-- ============================================================================
DO $$
DECLARE
    v_students    INT;
    v_enrollments INT;
    v_grades      INT;
    v_attendance  INT;
    v_payments    INT;
    v_sections    INT;
    v_lib_items   INT;
    v_lib_issues  INT;
    v_assignments INT;
    v_submissions INT;
    v_timetable   INT;
    v_results     INT;
    v_notifs      INT;
BEGIN
    SELECT COUNT(*) INTO v_students    FROM students;
    SELECT COUNT(*) INTO v_enrollments FROM enrollments;
    SELECT COUNT(*) INTO v_grades      FROM grades;
    SELECT COUNT(*) INTO v_attendance  FROM attendance_records;
    SELECT COUNT(*) INTO v_payments    FROM fee_payments;
    SELECT COUNT(*) INTO v_sections    FROM sections;
    SELECT COUNT(*) INTO v_lib_items   FROM library_items;
    SELECT COUNT(*) INTO v_lib_issues  FROM library_issues;
    SELECT COUNT(*) INTO v_assignments FROM assignments;
    SELECT COUNT(*) INTO v_submissions FROM assignment_submissions;
    SELECT COUNT(*) INTO v_timetable   FROM timetable;
    SELECT COUNT(*) INTO v_results     FROM results;
    SELECT COUNT(*) INTO v_notifs      FROM notifications;

    RAISE NOTICE '[Seed] Final counts: % students, % enrollments, % grades, % attend, % payments, % sections, % items, % issues, % assignments, % submissions, % timetable, % results, % notifications',
        v_students, v_enrollments, v_grades, v_attendance, v_payments,
        v_sections, v_lib_items, v_lib_issues, v_assignments, v_submissions,
        v_timetable, v_results, v_notifs;

    RAISE NOTICE '[Seed] Seed complete.';
END;
$$;

-- Library fines report (computed as 50 * days_overdue)
SELECT
    li.id AS issue_id,
    s.name AS student_name,
    lib.title AS item_title,
    li.due_date,
    li.returned_at,
    li.status,
    CASE
        WHEN li.status = 'overdue' AND li.returned_at IS NOT NULL
            THEN 50 * EXTRACT(DAY FROM (li.returned_at - li.due_date))
        WHEN li.status = 'overdue' AND li.returned_at IS NULL
            THEN 50 * EXTRACT(DAY FROM (now() - li.due_date))
        ELSE 0
    END::INT AS fine_amount
FROM library_issues li
JOIN students s ON s.id = li.student_id
JOIN library_items lib ON lib.id = li.item_id
ORDER BY fine_amount DESC;
