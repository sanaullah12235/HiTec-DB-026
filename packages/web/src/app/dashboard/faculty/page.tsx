'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, StatCard, StatGrid } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner, PageSpinner } from '@/components/ui/spinner';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import {
  BookOpen, Users, ClipboardCheck, Calendar, Clock, FileText,
  Plus, GraduationCap, Building2, Bell, ChevronRight, CheckCircle2,
  XCircle, Timer, Award, BarChart3, AlertTriangle, ListChecks,
} from 'lucide-react';

interface DashboardData {
  facultyName: string;
  departmentName: string;
  employeeCode: string;
  sectionCount: number;
  studentCount: number;
  pendingAssignmentCount: number;
  todayAttendance: { present: number; absent: number; late: number; excused: number; total: number };
  sections: { id: string; name: string; code: string; sectionName: string; semester: string; credits: number; studentCount: number; totalSeats: number }[];
  recentActivity: { type: string; message: string; time: string }[];
}

export default function FacultyDashboard() {
  const supabase = createClient();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const { data: faculty } = await supabase
          .from('faculty')
          .select('*, departments(name)')
          .eq('email', user.email!)
          .maybeSingle();

        if (!faculty) { setLoading(false); return; }

        const { data: sections } = await supabase
          .from('sections')
          .select('*, courses(name, code, credits), enrollments!inner(id, students!inner(id))')
          .eq('faculty_id', faculty.id);

        const sectionList = (sections ?? []).map((s) => ({
          id: s.id,
          name: s.courses?.name ?? 'Unknown',
          code: s.courses?.code ?? '',
          sectionName: s.section_name,
          semester: s.semester,
          credits: s.courses?.credits ?? 0,
          studentCount: s.enrollments?.length ?? 0,
          totalSeats: s.total_seats,
        }));

        const allEnrollmentIds: string[] = [];
        const studentSet = new Set<string>();
        for (const s of sections ?? []) {
          for (const e of s.enrollments ?? []) {
            allEnrollmentIds.push(e.id);
            if (e.students?.id) studentSet.add(e.students.id);
          }
        }

        const { data: assignments } = await supabase
          .from('assignments')
          .select('id')
          .eq('faculty_id', faculty.id)
          .eq('published', false);

        const today = new Date().toISOString().slice(0, 10);
        const { data: attRecords } = allEnrollmentIds.length > 0
          ? await supabase
              .from('attendance_records')
              .select('status')
              .eq('date', today)
              .in('enrollment_id', allEnrollmentIds)
          : { data: [] };

        const counts = { present: 0, absent: 0, late: 0, excused: 0 };
        for (const r of attRecords ?? []) {
          const s = r.status?.toLowerCase() ?? '';
          if (s === 'present') counts.present++;
          else if (s === 'absent') counts.absent++;
          else if (s === 'late') counts.late++;
          else if (s === 'excused') counts.excused++;
        }

        const recentActivity: DashboardData['recentActivity'] = [];

        if (allEnrollmentIds.length > 0) {
          const { data: recentResults } = await supabase
            .from('results')
            .select('created_at')
            .in('enrollment_id', allEnrollmentIds)
            .order('created_at', { ascending: false })
            .limit(5);

          if (recentResults && recentResults.length > 0) {
            for (const r of recentResults.slice(0, 3)) {
              recentActivity.push({
                type: 'grade',
                message: 'Results updated for a student',
                time: timeAgo(r.created_at),
              });
            }
          }
        }

        if (attRecords && attRecords.length > 0) {
          recentActivity.unshift({
            type: 'attendance',
            message: `Attendance marked for ${attRecords.length} students today`,
            time: 'Today',
          });
        }

        if (assignments && assignments.length > 0) {
          recentActivity.unshift({
            type: 'assignment',
            message: `${assignments.length} pending assignment(s) need publishing`,
            time: 'Now',
          });
        }

        setData({
          facultyName: faculty.name,
          departmentName: faculty.departments?.name ?? '',
          employeeCode: faculty.employee_code,
          sectionCount: sectionList.length,
          studentCount: studentSet.size,
          pendingAssignmentCount: assignments?.length ?? 0,
          todayAttendance: {
            present: counts.present,
            absent: counts.absent,
            late: counts.late,
            excused: counts.excused,
            total: attRecords?.length ?? 0,
          },
          sections: sectionList,
          recentActivity,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <PageSpinner />;
  if (!data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <GraduationCap className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-sm text-gray-500">Faculty record not found.</p>
        </div>
      </div>
    );
  }

  const attTotal = data.todayAttendance.total;

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome, <span className="bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">{data.facultyName}</span>
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {data.departmentName} &middot; {data.employeeCode}
        </p>
      </motion.div>

      <StatGrid>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <StatCard
            label="Total Courses"
            value={data.sectionCount}
            icon={<BookOpen className="h-5 w-5" />}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          <StatCard
            label="Total Students"
            value={data.studentCount}
            icon={<Users className="h-5 w-5" />}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <StatCard
            label="Pending Assignments"
            value={data.pendingAssignmentCount}
            icon={<FileText className="h-5 w-5" />}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
        >
          <StatCard
            label="Today's Attendance"
            value={attTotal > 0 ? `${Math.round((data.todayAttendance.present / attTotal) * 100)}%` : '--'}
            icon={<ClipboardCheck className="h-5 w-5" />}
          />
        </motion.div>
      </StatGrid>

      {attTotal > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="grid gap-3 sm:grid-cols-4"
        >
          <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 sm:px-4 py-3 text-sm font-medium shadow-sm">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="font-semibold text-green-700">Present: {data.todayAttendance.present}</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 sm:px-4 py-3 text-sm font-medium shadow-sm">
            <XCircle className="h-4 w-4 text-red-600" />
            <span className="font-semibold text-red-700">Absent: {data.todayAttendance.absent}</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-yellow-200 bg-yellow-50 px-3 sm:px-4 py-3 text-sm font-medium shadow-sm">
            <Timer className="h-4 w-4 text-yellow-600" />
            <span className="font-semibold text-yellow-700">Late: {data.todayAttendance.late}</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 sm:px-4 py-3 text-sm font-medium shadow-sm">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <span className="font-semibold text-blue-700">Excused: {data.todayAttendance.excused}</span>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="grid gap-6 lg:grid-cols-3"
      >
        <div className="lg:col-span-2">
          <Card title="Course Management" subtitle={`${data.sectionCount} active section(s)`}>
            <div className="grid gap-3 sm:grid-cols-2">
              {data.sections.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.08, duration: 0.4 }}
                  className="group rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm transition-all hover:border-teal-200 hover:shadow-md hover:bg-teal-50/50"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{s.name}</h3>
                      <p className="text-xs text-gray-400">{s.code} &middot; {s.sectionName} &middot; {s.semester}</p>
                    </div>
                    <Badge variant="info">{s.studentCount} students</Badge>
                  </div>
                  <div className="mb-3 flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Award className="h-3 w-3" />{s.credits} cr</span>
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" />{s.studentCount}/{s.totalSeats} seats</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Link href={`/dashboard/faculty/attendance?section_id=${s.id}`}>
                      <Button variant="outline" className="h-7 gap-1 rounded-lg px-2 text-xs font-semibold">
                        <ClipboardCheck className="h-3 w-3" /> Attendance
                      </Button>
                    </Link>
                    <Link href={`/dashboard/faculty/grades?section_id=${s.id}`}>
                      <Button variant="outline" className="h-7 gap-1 rounded-lg px-2 text-xs font-semibold">
                        <BarChart3 className="h-3 w-3" /> Grades
                      </Button>
                    </Link>
                    <Link href={`/dashboard/faculty/assignments?section_id=${s.id}`}>
                      <Button variant="outline" className="h-7 gap-1 rounded-lg px-2 text-xs font-semibold">
                        <FileText className="h-3 w-3" /> Assignments
                      </Button>
                    </Link>
                    <Link href={`/dashboard/faculty/results?section_id=${s.id}`}>
                      <Button variant="outline" className="h-7 gap-1 rounded-lg px-2 text-xs font-semibold">
                        <ListChecks className="h-3 w-3" /> Results
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              ))}
              {data.sections.length === 0 && (
                <div className="col-span-2 flex items-center justify-center py-12">
                  <div className="text-center">
                    <Building2 className="mx-auto h-8 w-8 text-gray-300" />
                    <p className="mt-2 text-sm text-gray-400">No sections assigned yet.</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div>
          <Card title="Recent Activity" subtitle="Latest updates">
            {data.recentActivity.length > 0 ? (
              <div className="flex flex-col gap-3">
                {data.recentActivity.map((act, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.1, duration: 0.3 }}
                    className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-3 sm:p-3 shadow-sm transition-all hover:border-gray-200 hover:shadow-md"
                  >
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                      act.type === 'attendance' ? 'bg-green-100 text-green-600'
                        : act.type === 'grade' ? 'bg-blue-100 text-blue-600'
                        : 'bg-amber-100 text-amber-600'
                    }`}>
                      {act.type === 'attendance' ? <ClipboardCheck className="h-4 w-4" />
                        : act.type === 'grade' ? <Award className="h-4 w-4" />
                        : <FileText className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">{act.message}</p>
                      <p className="mt-0.5 text-xs font-medium text-gray-400">{act.time}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <Clock className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-2 text-sm text-gray-400">No recent activity</p>
              </div>
            )}
          </Card>

          <Card title="Quick Actions" className="mt-4">
            <div className="flex flex-col gap-2">
              <Link href="/dashboard/faculty/attendance">
                <Button variant="outline" className="w-full justify-start gap-2 rounded-xl font-semibold">
                  <ClipboardCheck className="h-4 w-4" /> Mark Attendance
                </Button>
              </Link>
              <Link href="/dashboard/faculty/assignments">
                <Button variant="outline" className="w-full justify-start gap-2 rounded-xl font-semibold">
                  <Plus className="h-4 w-4" /> New Assignment
                </Button>
              </Link>
              <Link href="/dashboard/faculty/timetable">
                <Button variant="outline" className="w-full justify-start gap-2 rounded-xl font-semibold">
                  <Calendar className="h-4 w-4" /> Manage Timetable
                </Button>
              </Link>
              <Link href="/dashboard/faculty/results">
                <Button variant="outline" className="w-full justify-start gap-2 rounded-xl font-semibold">
                  <BarChart3 className="h-4 w-4" /> Enter Results
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
