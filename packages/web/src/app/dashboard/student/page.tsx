'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PageSpinner } from '@/components/ui/spinner';
import { ProgressRing } from '@/components/ui/progress-ring';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { motion } from 'framer-motion';
import { Trophy, GraduationCap, Percent, DollarSign, BookOpen, Calendar, Bell, Activity, CheckCircle2, AlertTriangle } from 'lucide-react';

interface StudentData {
  id: string;
  name: string;
  email: string;
  gpa: number;
  enrollment_semester: string;
  program_id: string;
}

interface EnrollmentRow {
  id: string;
  enrolled_at: string;
  sections: {
    section_name: string;
    semester: string;
    courses: { name: string; code: string };
  };
}

interface FeeStatus {
  status: string;
  amount: number;
}

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
} as const;

const item = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

export default function StudentDashboard() {
  const supabase = createClient();
  const [student, setStudent] = useState<StudentData | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);
  const [attendancePct, setAttendancePct] = useState(0);
  const [feeStatus, setFeeStatus] = useState<FeeStatus | null>(null);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const { data: stu } = await supabase
          .from('students')
          .select('id, name, email, gpa, enrollment_semester, program_id')
          .eq('email', user.email!)
          .maybeSingle();

        if (!stu) { setLoading(false); setError('Student record not found.'); return; }
        setStudent(stu);

        const [enrollRes, feeRes, notifRes] = await Promise.all([
          supabase
            .from('enrollments')
            .select('id, enrolled_at, sections!inner(section_name, semester, courses!inner(name, code))')
            .eq('student_id', stu.id)
            .order('enrolled_at', { ascending: false }),
          supabase
            .from('fee_payments')
            .select('status, amount')
            .eq('student_id', stu.id)
            .order('paid_at', { ascending: false })
            .limit(1),
          supabase
            .from('notifications')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('read', false),
        ]);

        if (enrollRes.data) setEnrollments(enrollRes.data as EnrollmentRow[]);
        if (feeRes.data?.length) setFeeStatus(feeRes.data[0] as FeeStatus);
        setUnreadNotifs(notifRes.count ?? 0);

        const enrollmentIds = (enrollRes.data as EnrollmentRow[] ?? []).map((e) => e.id);
        if (enrollmentIds.length > 0) {
          const { data: attRecords } = await supabase
            .from('attendance_records')
            .select('status')
            .in('enrollment_id', enrollmentIds);

          if (attRecords?.length) {
            const present = attRecords.filter((r) => r.status.toLowerCase() === 'present').length;
            setAttendancePct(Math.round((present / attRecords.length) * 100));
          }
        }

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data.');
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <PageSpinner />;

  const gpaPercent = student?.gpa ? Math.round((student.gpa / 4) * 100) : 0;
  const totalCourses = enrollments.length;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-6"
    >
      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      <motion.div variants={item}>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, <span className="bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent">{student?.name ?? 'Student'}</span>
        </h1>
        <p className="mt-1.5 text-sm font-medium text-gray-500">
          {student?.enrollment_semester ?? 'N/A'} Semester &middot; Student Dashboard
        </p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={item} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[
          { label: 'GPA', value: student?.gpa?.toFixed(2) ?? 'N/A', sub: 'Current GPA', icon: Trophy, color: '#6366f1' },
          { label: 'Attendance', value: `${attendancePct}%`, sub: 'Overall', icon: Activity, color: '#06b6d4' },
          { label: 'Courses', value: totalCourses, sub: 'Enrolled', icon: BookOpen, color: '#8b5cf6' },
          { label: 'Fee Status', value: feeStatus?.status ?? 'N/A', sub: feeStatus?.amount ? `PKR ${feeStatus.amount}` : '', icon: DollarSign, color: '#10b981' },
          { label: 'Notifications', value: unreadNotifs, sub: 'Unread', icon: Bell, color: '#f59e0b' },
          { label: 'Semester', value: student?.enrollment_semester ?? 'N/A', sub: 'Enrolled', icon: GraduationCap, color: '#ec4899' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-200 hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                <p className="mt-0.5 text-xs font-medium text-gray-400">{stat.sub}</p>
              </div>
              <div className="rounded-xl p-3 transition-transform group-hover:scale-110 group-hover:rotate-3" style={{ backgroundColor: `${stat.color}15` }}>
                <stat.icon className="h-5 w-5" style={{ color: stat.color }} />
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Progress Rings Row */}
      <motion.div variants={item} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition-all duration-200 hover:shadow-md">
          <h3 className="mb-5 text-lg font-semibold text-gray-900">GPA</h3>
          <ProgressRing progress={gpaPercent} color="#6366f1" size={140} strokeWidth={10}>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-indigo-600">{student?.gpa?.toFixed(2) ?? '-'}</span>
              <span className="text-xs font-medium text-gray-400">/ 4.0</span>
            </div>
          </ProgressRing>
          <p className="mt-4 text-sm font-medium text-gray-500">
            {gpaPercent >= 75 ? 'Excellent standing' : gpaPercent >= 50 ? 'Good progress' : 'Needs improvement'}
          </p>
        </div>

        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition-all duration-200 hover:shadow-md">
          <h3 className="mb-5 text-lg font-semibold text-gray-900">Attendance</h3>
          <ProgressRing progress={attendancePct} color="#06b6d4" size={140} strokeWidth={10}>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-cyan-600">{attendancePct}%</span>
              <span className="text-xs font-medium text-gray-400">Overall</span>
            </div>
          </ProgressRing>
          <p className="mt-4 text-sm font-medium text-gray-500">
            {attendancePct >= 75 ? 'Good attendance' : attendancePct >= 60 ? 'Needs improvement' : 'Low attendance'}
          </p>
        </div>

        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition-all duration-200 hover:shadow-md">
          <h3 className="mb-5 text-lg font-semibold text-gray-900">Courses</h3>
          <ProgressRing progress={totalCourses > 0 ? Math.min((totalCourses / 7) * 100, 100) : 0} color="#8b5cf6" size={140} strokeWidth={10}>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-purple-600">{totalCourses}</span>
              <span className="text-xs font-medium text-gray-400">Enrolled</span>
            </div>
          </ProgressRing>
          <p className="mt-4 text-sm font-medium text-gray-500">
            {totalCourses > 0 ? `${totalCourses} course${totalCourses > 1 ? 's' : ''} this semester` : 'No enrollments yet'}
          </p>
        </div>
      </motion.div>

      {/* Enrollments Table */}
      <motion.div variants={item}>
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-gray-50 px-6 py-4">
            <div className="rounded-lg bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 p-2">
              <BookOpen className="h-5 w-5 text-indigo-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Course Enrollments</h2>
            <div className="ml-auto flex items-center gap-1.5 text-xs font-medium text-gray-400">
              <Calendar className="h-3.5 w-3.5" />
              {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
          </div>
          <div className="p-1">
            <DataTable
              columns={[
                { key: 'course', header: 'Course', render: (r) => {
                  const section = (r.sections as Record<string, unknown>);
                  const course = section?.courses as Record<string, unknown> | undefined;
                  return course ? `${course.name as string} (${course.code as string})` : '-';
                }},
                { key: 'section_name', header: 'Section', render: (r) => ((r.sections as Record<string, unknown>)?.section_name as string) ?? '-' },
                { key: 'semester', header: 'Semester', render: (r) => ((r.sections as Record<string, unknown>)?.semester as string) ?? '-' },
                { key: 'enrolled_at', header: 'Enrolled', render: (r) => new Date(r.enrolled_at as string).toLocaleDateString() },
              ]}
              data={enrollments as unknown as Record<string, unknown>[]}
              keyExtractor={(r) => r.id as string}
              emptyMessage="Not enrolled in any courses yet."
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
