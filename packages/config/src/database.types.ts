export interface Department {
  id: string;
  name: string;
  code: string;
  created_at: string;
}

export interface Program {
  id: string;
  department_id: string;
  name: string;
  code: string;
  duration_years: number;
  created_at: string;
}

export interface Student {
  id: string;
  program_id: string;
  name: string;
  email: string;
  cnic: string;
  bank_account: string | null;
  gpa: number | null;
  enrollment_semester: string;
  created_at: string;
  updated_at: string;
}

export interface Faculty {
  id: string;
  department_id: string;
  name: string;
  email: string;
  employee_code: string;
  created_at: string;
}

export interface Staff {
  id: string;
  department_id: string;
  name: string;
  email: string;
  employee_code: string;
  role: string;
  created_at: string;
}

export interface Course {
  id: string;
  department_id: string;
  name: string;
  code: string;
  credits: number;
  created_at: string;
}

export interface Section {
  id: string;
  course_id: string;
  faculty_id: string;
  section_name: string;
  semester: string;
  total_seats: number;
  allocated_seats: number;
  created_at: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  section_id: string;
  enrolled_at: string;
}

export interface Grade {
  id: string;
  enrollment_id: string;
  numeric_grade: number | null;
  letter_grade: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecord {
  id: string;
  enrollment_id: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late' | 'Excused';
  created_at: string;
}

export interface FeeStructure {
  id: string;
  program_id: string;
  semester: string;
  amount: number;
  description: string;
  created_at: string;
}

export interface FeePayment {
  id: string;
  student_id: string;
  fee_structure_id: string;
  amount: number;
  paid_at: string;
  transaction_ref: string | null;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  created_at: string;
}

export interface LibraryItem {
  id: string;
  title: string;
  author: string;
  isbn: string;
  publisher: string | null;
  category: string;
  total_copies: number;
  available_copies: number;
  created_at: string;
}

export interface LibraryIssue {
  id: string;
  student_id: string;
  item_id: string;
  issued_at: string;
  due_date: string;
  returned_at: string | null;
  status: 'issued' | 'returned' | 'overdue';
}

export interface AuditLog {
  id: string;
  table_name: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  changed_by: string;
  changed_at: string;
}

export interface Admission {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  cnic: string;
  program_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface Assignment {
  id: string;
  section_id: string;
  faculty_id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  due_date: string;
  max_marks: number;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  file_url: string | null;
  marks: number | null;
  feedback: string | null;
  submitted_at: string;
  status: 'submitted' | 'graded' | 'returned';
}

export interface Timetable {
  id: string;
  section_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'assignment' | 'attendance' | 'grade' | 'timetable' | 'fee' | 'library' | 'general';
  link: string | null;
  read: boolean;
  created_at: string;
}

export interface Result {
  id: string;
  enrollment_id: string;
  quiz_marks: number | null;
  assignment_marks: number | null;
  midterm_marks: number | null;
  final_marks: number | null;
  total_marks: number | null;
  percentage: number | null;
  grade: string | null;
  gpa_points: number | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export type Role = 'student' | 'faculty' | 'finance' | 'admin' | 'librarian';
