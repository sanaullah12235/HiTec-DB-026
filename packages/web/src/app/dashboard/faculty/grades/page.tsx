'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/form-field';
import { Badge } from '@/components/ui/badge';
import { AlertList } from '@/components/ui/alert';
import { Spinner, PageSpinner } from '@/components/ui/spinner';
import { PageHeader } from '@/components/ui/page-header';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import {
  Download, Save, Users, BarChart3, CheckCircle2, XCircle,
} from 'lucide-react';

interface Section { id: string; section_name: string; semester: string; courses?: { name: string; code: string } }
interface Enrollment { id: string; students?: { name: string; email: string } }
interface GradeRow { enrollment_id: string; numeric_grade: number | null; letter_grade: string | null }

function letterGrade(n: number): string {
  if (n >= 90) return 'A';
  if (n >= 80) return 'B';
  if (n >= 70) return 'C';
  if (n >= 60) return 'D';
  return 'F';
}

function gradeColor(letter: string | null): string {
  if (!letter) return 'text-gray-400';
  if (letter === 'A') return 'text-green-600';
  if (letter === 'B') return 'text-blue-600';
  if (letter === 'C') return 'text-yellow-600';
  if (letter === 'D') return 'text-orange-600';
  return 'text-red-600';
}

export default function GradesPage() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const [alerts, setAlerts] = useState<{ id: string; variant?: 'info' | 'success' | 'warning' | 'error'; message: string }[]>([]);
  const addAlert = useCallback((v: 'info' | 'success' | 'warning' | 'error', m: string) => {
    setAlerts((p) => [...p, { id: `${Date.now()}-${Math.random()}`, variant: v, message: m }]);
  }, []);

  const [sections, setSections] = useState<Section[]>([]);
  const [sectionId, setSectionId] = useState(searchParams.get('section_id') ?? '');
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [grades, setGrades] = useState<Record<string, number | null>>({});
  const [loading, setLoading] = useState(true);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data: fac } = await supabase.from('faculty').select('id').eq('email', user.email!).maybeSingle();
      if (!fac) { setLoading(false); return; }
      const { data: secs } = await supabase.from('sections').select('*, courses(name, code)').eq('faculty_id', fac.id);
      setSections(secs ?? []);
      if (searchParams.get('section_id') && secs?.some((s) => s.id === searchParams.get('section_id'))) {
        await loadRoster(searchParams.get('section_id')!);
      }
      setLoading(false);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (sectionId) loadRoster(sectionId);
  }, [sectionId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadRoster(sid: string) {
    setRosterLoading(true);
    try {
      const { data: enr } = await supabase
        .from('enrollments')
        .select('id, students!inner(name, email)')
        .eq('section_id', sid);
      const enrollmentList = enr as Enrollment[] ?? [];
      setEnrollments(enrollmentList);

      const ids = enrollmentList.map((e) => e.id);
      if (ids.length === 0) { setGrades({}); return; }

      const { data: gradeRows } = await supabase
        .from('grades')
        .select('enrollment_id, numeric_grade, letter_grade')
        .in('enrollment_id', ids);

      const gradeMap: Record<string, number | null> = {};
      for (const g of gradeRows ?? []) {
        gradeMap[g.enrollment_id] = g.numeric_grade;
      }
      setGrades(gradeMap);
    } catch {
      addAlert('error', 'Failed to load grades.');
    } finally {
      setRosterLoading(false);
    }
  }

  function setGrade(enrollmentId: string, value: string) {
    const num = parseFloat(value);
    if (value === '' || value === '0') {
      setGrades((prev) => ({ ...prev, [enrollmentId]: null }));
    } else if (!isNaN(num) && num >= 0 && num <= 100) {
      setGrades((prev) => ({ ...prev, [enrollmentId]: num }));
    }
  }

  async function handleSave() {
    const entries = Object.entries(grades).filter(([, v]) => v !== null && v !== undefined);
    if (entries.length === 0) { addAlert('warning', 'No grades to save.'); return; }

    setSaving(true);
    let success = 0;
    let errors = 0;

    for (const [enrollmentId, numericGrade] of entries) {
      const letter = letterGrade(numericGrade!);
      const { error } = await supabase
        .from('grades')
        .upsert(
          { enrollment_id: enrollmentId, numeric_grade: numericGrade, letter_grade: letter },
          { onConflict: 'enrollment_id', ignoreDuplicates: false },
        );
      if (error) errors++;
      else success++;
    }

    if (errors === 0) {
      addAlert('success', `${success} grade(s) saved successfully.`);
    } else {
      addAlert('warning', `Saved ${success}/${entries.length}. ${errors} error(s).`);
    }
    setSaving(false);
  }

  const gradedCount = Object.values(grades).filter((v) => v !== null && v !== undefined).length;

  if (loading) return <PageSpinner />;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Grade Management"
        subtitle="Enter numeric grades per student (0-100)"
        gradient="from-teal-600 to-emerald-500"
      >
        <Button onClick={handleSave} loading={saving} className="gap-2">
          <Save className="h-4 w-4" /> Save Grades
        </Button>
      </PageHeader>

      <AlertList alerts={alerts} />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <Card>
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[260px] flex-1">
              <Select
                label="Section"
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                options={sections.map((s) => ({
                  value: s.id,
                  label: `${s.courses?.name ?? ''} \u2014 ${s.section_name} (${s.semester})`,
                }))}
              />
            </div>
          </div>
        </Card>
      </motion.div>

      {rosterLoading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex justify-center py-12"
        >
          <Spinner label="Loading roster..." />
        </motion.div>
      ) : !sectionId ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-16 shadow-sm"
        >
          <Users className="mb-2 h-10 w-10 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">Select a section to manage grades.</p>
        </motion.div>
      ) : enrollments.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-16 shadow-sm"
        >
          <Users className="mb-2 h-10 w-10 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">No enrollments found for this section.</p>
        </motion.div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="flex items-center gap-3 text-sm"
          >
            <Badge variant="info" className="flex items-center gap-1 text-xs font-semibold">
              <Users className="h-3 w-3" />
              {enrollments.length} students
            </Badge>
            <Badge variant="success" className="flex items-center gap-1 text-xs font-semibold">
              <CheckCircle2 className="h-3 w-3" />
              {gradedCount} graded
            </Badge>
            <Badge variant="warning" className="flex items-center gap-1 text-xs font-semibold">
              <XCircle className="h-3 w-3" />
              {enrollments.length - gradedCount} pending
            </Badge>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <Card>
              <div className="overflow-x-auto rounded-xl">
                <table className="min-w-full divide-y divide-gray-100 text-sm">
                  <thead>
                    <tr>
                      <th className="w-12 px-4 py-3.5 text-left font-semibold text-gray-600">#</th>
                      <th className="px-4 py-3.5 text-left font-semibold text-gray-600">Student</th>
                      <th className="hidden px-4 py-3.5 text-left font-semibold text-gray-600 sm:table-cell">Email</th>
                      <th className="w-32 px-4 py-3.5 text-center font-semibold text-gray-600">Numeric Grade (0-100)</th>
                      <th className="w-24 px-4 py-3.5 text-center font-semibold text-gray-600">Letter Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 bg-white">
                    {enrollments.map((enr, idx) => {
                      const grade = grades[enr.id];
                      const letter = grade !== null && grade !== undefined ? letterGrade(grade) : null;
                      return (
                        <tr key={enr.id} className="transition-colors hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                          <td className="px-4 py-3 font-medium text-gray-900">{enr.students?.name ?? '-'}</td>
                          <td className="hidden px-4 py-3 font-medium text-gray-500 sm:table-cell">{enr.students?.email ?? '-'}</td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={0.1}
                              value={grade !== null && grade !== undefined ? grade : ''}
                              onChange={(e) => setGrade(enr.id, e.target.value)}
                              className="w-24 rounded-xl border border-gray-300 px-3 py-1.5 text-center text-sm shadow-sm outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                              placeholder="--"
                            />
                          </td>
                          <td className={`px-4 py-3 text-center font-bold text-lg ${gradeColor(letter)}`}>
                            {letter ?? '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        </>
      )}
    </div>
  );
}
