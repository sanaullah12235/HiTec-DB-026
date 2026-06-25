-- Seed data for HiSUP portal — run after 001_hisup_schema.sql

-- Departments
INSERT INTO departments (id, name, code) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'Engineering', 'ENG'),
  ('d0000000-0000-0000-0000-000000000002', 'Management', 'MGT')
ON CONFLICT (id) DO NOTHING;

-- Programs
INSERT INTO programs (id, name, code, department_id, duration_years) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Computer Science', 'CS', 'd0000000-0000-0000-0000-000000000001', 4),
  ('a0000000-0000-0000-0000-000000000002', 'Business Administration', 'BBA', 'd0000000-0000-0000-0000-000000000002', 4)
ON CONFLICT (id) DO NOTHING;

-- Courses (use unique codes so this works standalone or alongside migration seed)
INSERT INTO courses (id, name, code, credits, department_id) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Data Structures', 'CS210', 3, 'd0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000002', 'Operating Systems', 'CS310', 4, 'd0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000003', 'Principles of Marketing', 'MKT101', 3, 'd0000000-0000-0000-0000-000000000002')
ON CONFLICT (id) DO NOTHING;

-- Faculty
INSERT INTO faculty (id, name, email, employee_code, department_id) VALUES
  ('f0000000-0000-0000-0000-000000000001', 'Dr. Alan Turing', 'aturing@university.edu', 'FAC001', 'd0000000-0000-0000-0000-000000000001'),
  ('f0000000-0000-0000-0000-000000000002', 'Dr. Grace Hopper', 'ghopper@university.edu', 'FAC002', 'd0000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Sections (need valid course_id + faculty_id)
INSERT INTO sections (id, course_id, faculty_id, section_name, semester, total_seats, allocated_seats) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'Section A', '2026F', 30, 10),
  ('e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000002', 'Section A', '2026F', 25, 15)
ON CONFLICT (id) DO NOTHING;

-- Library items
INSERT INTO library_items (id, title, author, isbn, publisher, category, total_copies, available_copies, tsv) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'Introduction to Algorithms', 'Thomas Cormen', '978-0262033848', 'MIT Press', 'Textbook', 5, 3, to_tsvector('english', 'Introduction to Algorithms Thomas Cormen')),
  ('b0000000-0000-0000-0000-000000000002', 'Database Systems', 'Abraham Silberschatz', '978-0078022159', 'McGraw-Hill', 'Textbook', 3, 1, to_tsvector('english', 'Database Systems Abraham Silberschatz')),
  ('b0000000-0000-0000-0000-000000000003', 'Clean Code', 'Robert C. Martin', '978-0132350884', 'Prentice Hall', 'Reference', 4, 4, to_tsvector('english', 'Clean Code Robert C. Martin'))
ON CONFLICT (id) DO NOTHING;

-- After signing up a student via the app, update:
-- UPDATE students SET program_id = 'a0000000-0000-0000-0000-000000000001', enrollment_semester = '2026F' WHERE email = 'your-email@example.com';

-- ============================================================================
-- NEW TABLES DUMMY DATA (for 002_hisup_extensions migration)
-- ============================================================================

-- Assignments (2 per section — uses e1 prefix to avoid collision with migration seed's d1)
INSERT INTO assignments (id, section_id, faculty_id, title, description, due_date, max_marks, published) VALUES
  ('e1000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'Data Structures Lab 1', 'Implement a balanced BST in C++.', '2026-04-15', 100, true),
  ('e1000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'Data Structures Problem Set', 'Solve graph traversal problems.', '2026-05-01', 50, false),
  ('e1000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000002', 'OS Lab 1', 'Implement a simple shell.', '2026-04-20', 100, true),
  ('e1000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000002', 'OS Research Paper', 'Write on process synchronization.', '2026-05-10', 50, false)
ON CONFLICT (id) DO NOTHING;

-- Timetable (2 per section — uses e3 prefix to avoid collision with migration seed's d3)
INSERT INTO timetable (id, section_id, day_of_week, start_time, end_time, room) VALUES
  ('e3000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 1, '09:00', '10:30', 'Room 101'),
  ('e3000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', 3, '09:00', '10:30', 'Lab 2'),
  ('e3000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000002', 2, '11:00', '12:30', 'Room 202'),
  ('e3000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000002', 4, '14:00', '15:30', 'Lab 3')
ON CONFLICT (id) DO NOTHING;

-- Notifications (uses e5 prefix to avoid collision with migration seed's d5)
INSERT INTO notifications (id, user_id, title, message, type, link, read) VALUES
  ('e5000000-0000-0000-0000-000000000001', (SELECT id FROM students LIMIT 1), 'New Assignment', 'Data Structures Lab 1 has been posted.', 'assignment', '/dashboard/student/assignments', false),
  ('e5000000-0000-0000-0000-000000000002', (SELECT id FROM students LIMIT 1), 'Fee Reminder', 'Tuition fee is due by April 15.', 'fee', '/dashboard/student/fees', false);
