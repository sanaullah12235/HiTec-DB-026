'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PageSpinner } from '@/components/ui/spinner';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { AnimatedCard, AnimatedStatCard } from '@/components/ui/animated-card';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Calendar, CheckCircle2, XCircle, Clock, Activity } from 'lucide-react';

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  enrollment: {
    sections: {
      section_name: string;
      courses: { name: string; code: string };
    };
  };
}

interface CourseAttendance {
  courseName: string;
  present: number;
  absent: number;
  late: number;
  total: number;
  percentage: number;
}

export default function AttendancePage() {
  const supabase = createClient();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [courseStats, setCourseStats] = useState<CourseAttendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const { data: student } = await supabase
          .from('students')
          .select('id')
          .eq('email', user.email!)
          .maybeSingle();

        if (!student) { setLoading(false); return; }

        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('id, sections!inner(id, section_name, courses!inner(name, code))')
          .eq('student_id', student.id);

        const enrollmentIds = (enrollments ?? []).map((e) => e.id);
        if (enrollmentIds.length === 0) { setLoading(false); return; }

        const { data: attRecords } = await supabase
          .from('attendance_records')
          .select('*, enrollment:enrollments!inner(id, sections!inner(section_name, courses!inner(name, code)))')
          .in('enrollment_id', enrollmentIds)
          .order('date', { ascending: false });

        const fetched = (attRecords ?? []) as unknown as AttendanceRecord[];
        setRecords(fetched);

        // Per-course stats
        const statsMap = new Map<string, { present: number; absent: number; late: number; total: number }>();
        for (const rec of fetched) {
          const courseName = rec.enrollment?.sections?.courses?.name ?? 'Unknown';
          const s = statsMap.get(courseName) ?? { present: 0, absent: 0, late: 0, total: 0 };
          s.total++;
          const st = rec.status.toLowerCase();
          if (st === 'present') s.present++;
          else if (st === 'absent') s.absent++;
          else if (st === 'late') s.late++;
          statsMap.set(courseName, s);
        }

        setCourseStats(
          Array.from(statsMap.entries()).map(([courseName, st]) => ({
            courseName,
            ...st,
            percentage: st.total > 0 ? Math.round((st.present / st.total) * 100) : 0,
          }))
        );

        setLoading(false);
      } catch {
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <PageSpinner />;

  const totalPresent = records.filter((r) => r.status.toLowerCase() === 'present').length;
  const totalAbsent = records.filter((r) => r.status.toLowerCase() === 'absent').length;
  const totalLate = records.filter((r) => r.status.toLowerCase() === 'late').length;
  const overallPct = records.length > 0 ? Math.round((totalPresent / records.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Attendance" subtitle="Track your course attendance records" />

      {/* Overall Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <AnimatedStatCard
          icon={<Activity className="h-5 w-5 text-cyan-600" />}
          label="Overall Attendance"
          value={`${overallPct}%`}
          color="#06b6d4"
          delay={0}
        />
        <AnimatedStatCard
          icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
          label="Present"
          value={totalPresent}
          color="#10b981"
          delay={0.1}
        />
        <AnimatedStatCard
          icon={<XCircle className="h-5 w-5 text-red-600" />}
          label="Absent"
          value={totalAbsent}
          color="#ef4444"
          delay={0.2}
        />
        <AnimatedStatCard
          icon={<Clock className="h-5 w-5 text-yellow-600" />}
          label="Late"
          value={totalLate}
          color="#f59e0b"
          delay={0.3}
        />
      </div>

      {/* Per-Course Stats */}
      {courseStats.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courseStats.map((cs, i) => (
            <AnimatedCard key={cs.courseName} delay={i * 0.1}>
              <div className="flex items-center gap-4">
                <ProgressRing progress={cs.percentage} size={80} strokeWidth={6}
                  color={cs.percentage >= 75 ? '#10b981' : cs.percentage >= 60 ? '#f59e0b' : '#ef4444'}
                >
                  <span className="text-sm font-bold" style={{
                    color: cs.percentage >= 75 ? '#10b981' : cs.percentage >= 60 ? '#f59e0b' : '#ef4444',
                  }}>{cs.percentage}%</span>
                </ProgressRing>
                <div>
                  <p className="font-semibold text-gray-900">{cs.courseName}</p>
                  <div className="mt-1 flex gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" />{cs.present}</span>
                    <span className="flex items-center gap-1"><XCircle className="h-3 w-3 text-red-500" />{cs.absent}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-yellow-500" />{cs.late}</span>
                  </div>
                </div>
              </div>
            </AnimatedCard>
          ))}
        </div>
      )}

      {/* Attendance History Table */}
      <AnimatedCard delay={0.4}>
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Attendance History</h3>
        <DataTable
          columns={[
            { key: 'date', header: 'Date', render: (r) => new Date(r.date as string).toLocaleDateString() },
            { key: 'course', header: 'Course', render: (r) => {
              const enrollment = r.enrollment as Record<string, unknown> | undefined;
              const sections = enrollment?.sections as Record<string, unknown> | undefined;
              const course = sections?.courses as Record<string, unknown> | undefined;
              return course ? `${course.name as string} (${course.code as string})` : '-';
            }},
            { key: 'status', header: 'Status', render: (r) => {
              const status = r.status as string;
              const variant = status === 'present' ? 'success' : status === 'late' ? 'warning' : 'error';
              const Icon = status === 'present' ? CheckCircle2 : status === 'late' ? Clock : XCircle;
              return (
                <Badge variant={variant} className="flex w-fit items-center gap-1">
                  <Icon className="h-3 w-3" /> {status}
                </Badge>
              );
            }},
          ]}
          data={records as unknown as Record<string, unknown>[]}
          keyExtractor={(r) => r.id as string}
          emptyMessage="No attendance records found."
        />
      </AnimatedCard>
    </div>
  );
}
