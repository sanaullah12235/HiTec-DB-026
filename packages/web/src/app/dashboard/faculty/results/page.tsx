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
  BarChart3, Save, Users, CheckCircle2, XCircle, Award,
  Upload, Eye, FileSpreadsheet,
} from 'lucide-react';

interface Section { id: string; section_name: string; semester: string; courses?: { name: string; code: string } }
interface Enrollment { id: string; students?: { name: string; email: string } }
interface Result {
  enrollment_id: string; quiz_marks: number | null; assignment_marks: number | null;
  midterm_marks: number | null; final_marks: number | null;
  total_marks: number | null; percentage: number | null;
  grade: string | null; gpa_points: number | null; published: boolean;
}

function getGradeColor(grade: string | null): string {
  if (!grade) return 'text-gray-400';
  if (grade.startsWith('A')) return 'text-green-600';
  if (grade.startsWith('B')) return 'text-blue-600';
  if (grade.startsWith('C')) return 'text-yellow-600';
  if (grade.startsWith('D')) return 'text-orange-600';
  return 'text-red-600';
}

export default function ResultsPage() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const [alerts, setAlerts] = useState<{ id: string; variant?: 'info' | 'success' | 'warning' | 'error'; message: string }[]>([]);
  const addAlert = useCallback((v: 'info' | 'success' | 'warning' | 'error', m: string) => {
    setAlerts((p) => [...p, { id: `${Date.now()}-${Math.random()}`, variant: v, message: m }]);
  }, []);

  const [sections, setSections] = useState<Section[]>([]);
  const [sectionId, setSectionId] = useState(searchParams.get('section_id') ?? '');
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [results, setResults] = useState<Record<string, Result>>({});
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
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
        await loadData(searchParams.get('section_id')!);
      }
      setLoading(false);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (sectionId) loadData(sectionId);
  }, [sectionId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadData(sid: string) {
    setDataLoading(true);
    try {
      const { data: enr } = await supabase
        .from('enrollments')
        .select('id, students!inner(name, email)')
        .eq('section_id', sid);
      const enrollmentList = enr as Enrollment[] ?? [];
      setEnrollments(enrollmentList);

      const ids = enrollmentList.map((e) => e.id);
      if (ids.length === 0) { setResults({}); return; }

      const { data: resRows } = await supabase
        .from('results')
        .select('*')
        .in('enrollment_id', ids);

      const resultMap: Record<string, Result> = {};
      for (const r of resRows ?? []) {
        resultMap[r.enrollment_id] = r as Result;
      }
      setResults(resultMap);
    } catch {
      addAlert('error', 'Failed to load results data.');
    } finally {
      setDataLoading(false);
    }
  }

  function setMark(enrollmentId: string, field: 'quiz_marks' | 'assignment_marks' | 'midterm_marks' | 'final_marks', value: string) {
    const num = parseFloat(value);
    if (value === '') {
      setResults((prev) => {
        const current = prev[enrollmentId];
        return { ...prev, [enrollmentId]: { ...current ?? {} as Result, enrollment_id: enrollmentId, [field]: null } as Result };
      });
    } else if (!isNaN(num) && num >= 0) {
      setResults((prev) => {
        const current = prev[enrollmentId] ?? { enrollment_id: enrollmentId } as Result;
        return { ...prev, [enrollmentId]: { ...current, [field]: num } as Result };
      });
    }
  }

  function calcTotal(r: Result | undefined): { total: number | null; percentage: number | null; grade: string | null; gpa: number | null } {
    if (!r) return { total: null, percentage: null, grade: null, gpa: null };
    const q = r.quiz_marks ?? 0;
    const a = r.assignment_marks ?? 0;
    const m = r.midterm_marks ?? 0;
    const f = r.final_marks ?? 0;
    const total = q + a + m + f;
    const percentage = total > 0 ? Math.round((total / 400) * 100) : null;
    let grade: string | null = null;
    let gpa: number | null = null;
    if (percentage !== null) {
      if (percentage >= 90) { grade = 'A'; gpa = 4.0; }
      else if (percentage >= 85) { grade = 'A-'; gpa = 3.7; }
      else if (percentage >= 80) { grade = 'B+'; gpa = 3.3; }
      else if (percentage >= 75) { grade = 'B'; gpa = 3.0; }
      else if (percentage >= 70) { grade = 'B-'; gpa = 2.7; }
      else if (percentage >= 65) { grade = 'C+'; gpa = 2.3; }
      else if (percentage >= 60) { grade = 'C'; gpa = 2.0; }
      else if (percentage >= 55) { grade = 'C-'; gpa = 1.7; }
      else if (percentage >= 50) { grade = 'D'; gpa = 1.0; }
      else { grade = 'F'; gpa = 0.0; }
    }
    return { total, percentage, grade, gpa };
  }

  async function handleSave() {
    const entries = Object.entries(results);
    if (entries.length === 0) { addAlert('warning', 'No results to save.'); return; }

    setSaving(true);
    let success = 0;
    let errors = 0;

    for (const [enrollmentId, r] of entries) {
      const payload = {
        enrollment_id: enrollmentId,
        quiz_marks: r.quiz_marks,
        assignment_marks: r.assignment_marks,
        midterm_marks: r.midterm_marks,
        final_marks: r.final_marks,
      };

      const { error } = await supabase
        .from('results')
        .upsert(payload, { onConflict: 'enrollment_id', ignoreDuplicates: false });

      if (error) errors++;
      else success++;
    }

    if (errors === 0) {
      addAlert('success', `${success} result(s) saved and calculated.`);
    } else {
      addAlert('warning', `Saved ${success}/${entries.length}. ${errors} error(s).`);
    }
    setSaving(false);
  }

  async function handlePublish() {
    if (!confirm('Publish all results for this section? Students will be notified.')) return;
    setSaving(true);
    let success = 0;
    let errors = 0;

    for (const [enrollmentId] of Object.entries(results)) {
      const { error } = await supabase
        .from('results')
        .update({ published: true })
        .eq('enrollment_id', enrollmentId);
      if (error) errors++;
      else success++;
    }

    if (errors === 0) {
      addAlert('success', `${success} result(s) published.`);
      await loadData(sectionId);
    } else {
      addAlert('warning', `Published ${success}/${success + errors}. ${errors} error(s).`);
    }
    setSaving(false);
  }

  const enteredCount = Object.values(results).filter(
    (r) => r.quiz_marks !== null || r.assignment_marks !== null || r.midterm_marks !== null || r.final_marks !== null
  ).length;

  const publishedCount = Object.values(results).filter((r) => r.published).length;

  if (loading) return <PageSpinner />;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Results Management"
        subtitle="Enter quiz, assignment, midterm, and final marks per student"
        gradient="from-teal-600 to-emerald-500"
      >
        <div className="flex gap-2">
          {Object.values(results).length > 0 && (
            <Button variant="outline" onClick={handlePublish} loading={saving} className="gap-2">
              <Upload className="h-4 w-4" /> Publish Results
            </Button>
          )}
          <Button onClick={handleSave} loading={saving} className="gap-2">
            <Save className="h-4 w-4" /> Save Results
          </Button>
        </div>
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

      {dataLoading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex justify-center py-12"
        >
          <Spinner label="Loading results data..." />
        </motion.div>
      ) : !sectionId ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-16 shadow-sm"
        >
          <BarChart3 className="mb-2 h-10 w-10 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">Select a section to enter results.</p>
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
            <Badge variant="info" className="flex items-center gap-1 text-xs font-semibold"><Users className="h-3 w-3" />{enrollments.length} students</Badge>
            <Badge variant="success" className="flex items-center gap-1 text-xs font-semibold"><CheckCircle2 className="h-3 w-3" />{enteredCount} entered</Badge>
            <Badge variant={publishedCount > 0 ? 'success' : 'warning'} className="flex items-center gap-1 text-xs font-semibold">
              <Award className="h-3 w-3" />{publishedCount} published
            </Badge>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm"
          >
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead>
                <tr>
                  <th className="w-10 px-3 py-3.5 text-left font-semibold text-gray-600">#</th>
                  <th className="whitespace-nowrap px-3 py-3.5 text-left font-semibold text-gray-600">Student</th>
                  <th className="w-20 px-2 py-3.5 text-center font-semibold text-gray-600">Quiz (100)</th>
                  <th className="w-20 px-2 py-3.5 text-center font-semibold text-gray-600">Assign (100)</th>
                  <th className="w-20 px-2 py-3.5 text-center font-semibold text-gray-600">Midterm (100)</th>
                  <th className="w-20 px-2 py-3.5 text-center font-semibold text-gray-600">Final (100)</th>
                  <th className="w-16 px-2 py-3.5 text-center font-semibold text-gray-600">Total</th>
                  <th className="w-16 px-2 py-3.5 text-center font-semibold text-gray-600">%</th>
                  <th className="w-16 px-2 py-3.5 text-center font-semibold text-gray-600">Grade</th>
                  <th className="w-16 px-2 py-3.5 text-center font-semibold text-gray-600">GPA</th>
                  <th className="w-16 px-2 py-3.5 text-center font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {enrollments.map((enr, idx) => {
                  const r = results[enr.id];
                  const computed = calcTotal(r);
                  return (
                    <tr key={enr.id} className="transition-colors hover:bg-gray-50">
                      <td className="px-3 py-2.5 text-gray-400">{idx + 1}</td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <div className="font-medium text-gray-900">{enr.students?.name ?? '-'}</div>
                        <div className="text-xs font-medium text-gray-400">{enr.students?.email ?? ''}</div>
                      </td>
                      {(['quiz_marks', 'assignment_marks', 'midterm_marks', 'final_marks'] as const).map((field) => (
                        <td key={field} className="px-2 py-2.5 text-center">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={r?.[field] !== null && r?.[field] !== undefined ? r[field] : ''}
                            onChange={(e) => setMark(enr.id, field, e.target.value)}
                            className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-center text-xs shadow-sm outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                            placeholder="--"
                          />
                        </td>
                      ))}
                      <td className="px-2 py-2.5 text-center font-bold text-gray-800">
                        {computed.total !== null ? computed.total : '-'}
                      </td>
                      <td className="px-2 py-2.5 text-center font-medium text-gray-700">
                        {computed.percentage !== null ? `${computed.percentage}%` : '-'}
                      </td>
                      <td className={`px-2 py-2.5 text-center font-bold ${getGradeColor(computed.grade)}`}>
                        {computed.grade ?? '-'}
                      </td>
                      <td className="px-2 py-2.5 text-center font-medium text-gray-700">
                        {computed.gpa !== null ? computed.gpa.toFixed(1) : '-'}
                      </td>
                      <td className="px-2 py-2.5 text-center">
                        {r?.published ? (
                          <Badge variant="success" className="text-[10px] font-semibold">Published</Badge>
                        ) : (
                          <Badge variant="warning" className="text-[10px] font-semibold">Draft</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </motion.div>
        </>
      )}
    </div>
  );
}
