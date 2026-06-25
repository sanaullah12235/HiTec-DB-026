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
  ClipboardCheck, ChevronLeft, ChevronRight, CheckCircle2,
  XCircle, Timer, AlertTriangle, Save, Users,
} from 'lucide-react';

interface Section { id: string; section_name: string; semester: string; courses?: { name: string; code: string } }
interface Enrollment { id: string; students?: { name: string; email: string } }

const STATUSES = ['Present', 'Absent', 'Late', 'Excused'] as const;
type AttendanceStatus = typeof STATUSES[number];

const STATUS_STYLES: Record<AttendanceStatus, { bg: string; text: string; ring: string; icon: React.ReactNode }> = {
  Present: { bg: 'bg-green-100', text: 'text-green-800', ring: 'ring-green-500', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  Absent: { bg: 'bg-red-100', text: 'text-red-800', ring: 'ring-red-500', icon: <XCircle className="h-3.5 w-3.5" /> },
  Late: { bg: 'bg-yellow-100', text: 'text-yellow-800', ring: 'ring-yellow-500', icon: <Timer className="h-3.5 w-3.5" /> },
  Excused: { bg: 'bg-blue-100', text: 'text-blue-800', ring: 'ring-blue-500', icon: <AlertTriangle className="h-3.5 w-3.5" /> },
};

export default function AttendancePage() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const [alerts, setAlerts] = useState<{ id: string; variant?: 'info' | 'success' | 'warning' | 'error'; message: string }[]>([]);
  const addAlert = useCallback((v: 'info' | 'success' | 'warning' | 'error', m: string) => {
    setAlerts((p) => [...p, { id: `${Date.now()}-${Math.random()}`, variant: v, message: m }]);
  }, []);

  const [sections, setSections] = useState<Section[]>([]);
  const [sectionId, setSectionId] = useState(searchParams.get('section_id') ?? '');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
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
  }, [sectionId, date]); // eslint-disable-line react-hooks/exhaustive-deps

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
      if (ids.length === 0) { setAttendance({}); return; }

      const { data: att } = await supabase
        .from('attendance_records')
        .select('enrollment_id, status')
        .eq('date', date)
        .in('enrollment_id', ids);

      const attMap: Record<string, AttendanceStatus> = {};
      for (const a of att ?? []) {
        if (STATUSES.includes(a.status as AttendanceStatus)) {
          attMap[a.enrollment_id] = a.status as AttendanceStatus;
        }
      }
      setAttendance(attMap);
    } catch {
      addAlert('error', 'Failed to load roster.');
    } finally {
      setRosterLoading(false);
    }
  }

  async function handleSave() {
    const entries = Object.entries(attendance);
    if (entries.length === 0) { addAlert('warning', 'No attendance records to save.'); return; }

    setSaving(true);
    let success = 0;
    let errors = 0;

    for (const [enrollmentId, status] of entries) {
      const { error } = await supabase
        .from('attendance_records')
        .upsert(
          { enrollment_id: enrollmentId, date, status },
          { onConflict: 'enrollment_id, date', ignoreDuplicates: false },
        );
      if (error) errors++;
      else success++;
    }

    const { present, absent, late, excused } = getCounts();
    if (errors === 0) {
      addAlert('success', `Saved: ${present} Present, ${absent} Absent, ${late} Late, ${excused} Excused`);
    } else {
      addAlert('warning', `Saved ${success}/${entries.length} records. ${errors} error(s).`);
    }
    setSaving(false);
  }

  function markAll(status: AttendanceStatus) {
    const next: Record<string, AttendanceStatus> = {};
    for (const e of enrollments) next[e.id] = status;
    setAttendance(next);
  }

  function getCounts() {
    const vals = Object.values(attendance);
    return {
      present: vals.filter((s) => s === 'Present').length,
      absent: vals.filter((s) => s === 'Absent').length,
      late: vals.filter((s) => s === 'Late').length,
      excused: vals.filter((s) => s === 'Excused').length,
    };
  }

  function changeDate(delta: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    setDate(d.toISOString().slice(0, 10));
  }

  const selectedSection = sections.find((s) => s.id === sectionId);
  const counts = getCounts();

  if (loading) return <PageSpinner />;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Attendance Matrix"
        subtitle="Mark and manage student attendance per section"
        gradient="from-teal-600 to-emerald-500"
      >
        <Button onClick={handleSave} loading={saving} className="gap-2">
          <Save className="h-4 w-4" /> Save Attendance
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

            <div className="flex items-end gap-2">
              <Button variant="outline" onClick={() => changeDate(-1)} className="flex h-10 w-10 items-center justify-center rounded-xl p-0">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-44 rounded-xl border border-gray-300 px-3 py-2 text-sm shadow-sm outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <Button variant="outline" onClick={() => changeDate(1)} className="flex h-10 w-10 items-center justify-center rounded-xl p-0">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-end gap-1.5">
              {STATUSES.map((s) => (
                <Button key={s} variant="outline" onClick={() => markAll(s)} className="h-10 gap-1 rounded-xl text-xs font-semibold">
                  {STATUS_STYLES[s].icon} All {s}
                </Button>
              ))}
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
          <p className="text-sm font-medium text-gray-500">Select a section to view the attendance roster.</p>
        </motion.div>
      ) : enrollments.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-16 shadow-sm"
        >
          <Users className="mb-2 h-10 w-10 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">No students enrolled in {selectedSection?.courses?.name ?? 'this section'}.</p>
        </motion.div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="flex flex-wrap items-center gap-3 text-sm"
          >
            <Badge variant="success" className="flex items-center gap-1 text-xs font-semibold">
              <CheckCircle2 className="h-3 w-3" /> Present: {counts.present}
            </Badge>
            <Badge variant="error" className="flex items-center gap-1 text-xs font-semibold">
              <XCircle className="h-3 w-3" /> Absent: {counts.absent}
            </Badge>
            <Badge variant="warning" className="flex items-center gap-1 text-xs font-semibold">
              <Timer className="h-3 w-3" /> Late: {counts.late}
            </Badge>
            <Badge variant="info" className="flex items-center gap-1 text-xs font-semibold">
              <AlertTriangle className="h-3 w-3" /> Excused: {counts.excused}
            </Badge>
            <span className="text-xs font-medium text-gray-400">
              {Object.keys(attendance).length}/{enrollments.length} marked
            </span>
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
                      {STATUSES.map((s) => (
                        <th key={s} className="px-3 py-3.5 text-center font-semibold text-gray-600">{s}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 bg-white">
                    {enrollments.map((enr, idx) => {
                      const currentStatus = attendance[enr.id];
                      return (
                        <tr
                          key={enr.id}
                          className={`transition-colors hover:bg-gray-50 ${
                            currentStatus ? STATUS_STYLES[currentStatus].bg + ' bg-opacity-20' : ''
                          }`}
                        >
                          <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                          <td className="px-4 py-3 font-medium text-gray-900">{enr.students?.name ?? '-'}</td>
                          <td className="hidden px-4 py-3 text-gray-500 sm:table-cell">{enr.students?.email ?? '-'}</td>
                          {STATUSES.map((s) => (
                            <td key={s} className="px-3 py-3 text-center">
                              <label className="relative inline-flex cursor-pointer items-center">
                                <input
                                  type="radio"
                                  name={`att-${enr.id}`}
                                  checked={currentStatus === s}
                                  onChange={() => setAttendance((prev) => ({ ...prev, [enr.id]: s }))}
                                  className="peer sr-only"
                                />
                                <span className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all ${
                                  currentStatus === s
                                    ? `${STATUS_STYLES[s].bg} ${STATUS_STYLES[s].text} ${STATUS_STYLES[s].ring} ring-2 border-transparent scale-110`
                                    : 'border-gray-200 bg-white text-transparent hover:border-gray-300'
                                }`}>
                                  {STATUS_STYLES[s].icon}
                                </span>
                              </label>
                            </td>
                          ))}
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
