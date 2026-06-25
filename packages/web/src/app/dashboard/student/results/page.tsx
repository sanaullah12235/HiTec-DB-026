'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PageSpinner } from '@/components/ui/spinner';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { AnimatedCard, AnimatedStatCard } from '@/components/ui/animated-card';
import { ProgressRing } from '@/components/ui/progress-ring';
import { motion } from 'framer-motion';
import { Award, BarChart3, Trophy, Percent, Clock, AlertTriangle } from 'lucide-react';

interface ResultRow {
  id: string;
  quiz_marks: number;
  assignment_marks: number;
  midterm_marks: number;
  final_marks: number;
  total_marks: number;
  percentage: number;
  grade: string;
  gpa_points: number;
  published: boolean;
  enrollment: {
    sections: {
      section_name: string;
      courses: { name: string; code: string; credits: number };
    };
  };
}

export default function ResultsPage() {
  const supabase = createClient();
  const [results, setResults] = useState<ResultRow[]>([]);
  const [studentGpa, setStudentGpa] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const { data: student } = await supabase
          .from('students')
          .select('id, gpa')
          .eq('email', user.email!)
          .maybeSingle();

        if (!student) { setLoading(false); return; }
        setStudentGpa(student.gpa ?? 0);

        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('id, sections!inner(section_name, courses!inner(name, code, credits))')
          .eq('student_id', student.id);

        const enrollmentIds = (enrollments ?? []).map((e) => e.id);
        if (enrollmentIds.length === 0) { setLoading(false); return; }

        const { data: resultData } = await supabase
          .from('results')
          .select('*, enrollment:enrollments!inner(id, sections!inner(section_name, courses!inner(name, code, credits)))')
          .in('enrollment_id', enrollmentIds)
          .eq('published', true)
          .order('percentage', { ascending: false });

        setResults((resultData ?? []) as unknown as ResultRow[]);
        setLoading(false);
      } catch {
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <PageSpinner />;

  const semesterGpa = results.length > 0
    ? results.reduce((sum, r) => {
        const credits = r.enrollment?.sections?.courses?.credits ?? 3;
        return sum + (r.gpa_points ?? 0) * credits;
      }, 0) / results.reduce((sum, r) => sum + (r.enrollment?.sections?.courses?.credits ?? 3), 0)
    : 0;

  const avgPercentage = results.length > 0
    ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / results.length)
    : 0;

  function getGradeColor(grade: string): string {
    const g = grade?.toUpperCase() ?? '';
    if (g.startsWith('A')) return '#10b981';
    if (g.startsWith('B')) return '#6366f1';
    if (g.startsWith('C')) return '#f59e0b';
    if (g.startsWith('D')) return '#f97316';
    return '#ef4444';
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Results" subtitle="View your academic performance" />

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <AnimatedCard delay={0} glowColor="#6366f1">
          <div className="flex items-start justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm font-medium text-gray-500">
                Semester GPA
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
                  <Clock className="h-3 w-3" /> In-Progress
                </span>
              </p>
              <motion.p
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.2, type: 'spring' }}
                className="mt-1 text-3xl font-bold text-indigo-600"
              >
                {semesterGpa ? semesterGpa.toFixed(2) : 'N/A'}
              </motion.p>
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1, type: 'spring' }}
              className="rounded-xl p-3"
              style={{ backgroundColor: '#6366f115' }}
            >
              <Trophy className="h-5 w-5 text-indigo-600" />
            </motion.div>
          </div>
        </AnimatedCard>
        <AnimatedStatCard
          icon={<Award className="h-5 w-5 text-purple-600" />}
          label="CGPA"
          value={studentGpa ? studentGpa.toFixed(2) : 'N/A'}
          color="#8b5cf6"
          delay={0.1}
        />
        <AnimatedStatCard
          icon={<Percent className="h-5 w-5 text-cyan-600" />}
          label="Average"
          value={`${avgPercentage}%`}
          color="#06b6d4"
          delay={0.2}
        />
        <AnimatedStatCard
          icon={<BarChart3 className="h-5 w-5 text-green-600" />}
          label="Subjects"
          value={results.length}
          color="#10b981"
          delay={0.3}
        />
      </div>

      {/* GPA Progress Rings */}
      <div className="grid gap-6 sm:grid-cols-2">
        <AnimatedCard delay={0.1}>
          <div className="flex flex-col items-center">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Semester GPA</h3>
            <ProgressRing
              progress={semesterGpa ? Math.round((semesterGpa / 4) * 100) : 0}
              color="#6366f1"
              size={140}
              strokeWidth={10}
            >
              <div className="flex flex-col items-center">
                <span className="text-3xl font-bold text-indigo-600">{semesterGpa ? semesterGpa.toFixed(2) : '-'}</span>
                <span className="text-xs text-gray-400">/ 4.0</span>
              </div>
            </ProgressRing>
          </div>
        </AnimatedCard>

        <AnimatedCard delay={0.2}>
          <div className="flex flex-col items-center">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">CGPA</h3>
            <ProgressRing
              progress={studentGpa ? Math.round((studentGpa / 4) * 100) : 0}
              color="#8b5cf6"
              size={140}
              strokeWidth={10}
            >
              <div className="flex flex-col items-center">
                <span className="text-3xl font-bold text-purple-600">{studentGpa ? studentGpa.toFixed(2) : '-'}</span>
                <span className="text-xs text-gray-400">/ 4.0</span>
              </div>
            </ProgressRing>
          </div>
        </AnimatedCard>
      </div>

      {/* Subject-wise Results */}
      <AnimatedCard delay={0.3}>
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Subject-wise Results</h3>
        <DataTable
          columns={[
            { key: 'subject', header: 'Subject', render: (r) => {
              const enrollment = r.enrollment as Record<string, unknown> | undefined;
              const sections = enrollment?.sections as Record<string, unknown> | undefined;
              const course = sections?.courses as Record<string, unknown> | undefined;
              return course ? `${course.name as string} (${course.code as string})` : '-';
            }},
            { key: 'quiz', header: 'Quiz', render: (r) => (r.quiz_marks ?? '-') as string },
            { key: 'assignment', header: 'Assignment', render: (r) => (r.assignment_marks ?? '-') as string },
            { key: 'midterm', header: 'Midterm', render: (r) => (r.midterm_marks ?? '-') as string },
            { key: 'final', header: 'Final', render: (r) => (r.final_marks ?? '-') as string },
            { key: 'total', header: 'Total', render: (r) => <span className="font-medium">{r.total_marks as number}</span> },
            { key: 'percentage', header: '%', render: (r) => {
              const raw = r.percentage as number;
              const pct = Math.min(raw, 100);
              const color = pct >= 80 ? 'text-green-600' : pct >= 60 ? 'text-yellow-600' : 'text-red-600';
              return <span className={`font-semibold ${color}`}>{pct}%{raw > 100 ? <span className="ml-1 inline-flex items-center gap-1 text-[10px] font-medium text-amber-600"><AlertTriangle className="h-3 w-3" /> adj.</span> : ''}</span>;
            }},
            { key: 'grade', header: 'Grade', render: (r) => {
              const grade = r.grade as string;
              return <Badge variant="default" className="font-semibold" style={{ backgroundColor: `${getGradeColor(grade)}20`, color: getGradeColor(grade) }}>{grade}</Badge>;
            }},
            { key: 'gpa_points', header: 'GPA', render: (r) => (r.gpa_points as number)?.toFixed(1) ?? '-' },
          ]}
          data={results as unknown as Record<string, unknown>[]}
          keyExtractor={(r) => r.id as string}
          emptyMessage="No results published yet."
        />
      </AnimatedCard>
    </div>
  );
}
