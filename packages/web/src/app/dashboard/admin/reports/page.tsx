'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/form-field';
import { DataTable } from '@/components/ui/data-table';
import { AlertList } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  ClipboardCheck, Award, DollarSign, BookOpen, Download, FileSpreadsheet,
} from 'lucide-react';

type ReportTab = 'attendance' | 'results' | 'fees' | 'library';

export default function ReportsPage() {
  const supabase = createClient();
  const [alerts, setAlerts] = useState<{ id: string; variant?: 'info' | 'success' | 'warning' | 'error'; message: string }[]>([]);
  const [tab, setTab] = useState<ReportTab>('attendance');
  const [loading, setLoading] = useState(false);

  const [courses, setCourses] = useState<{ id: string; name: string; code: string }[]>([]);
  const [sections, setSections] = useState<{ id: string; section_name: string; course_id: string; semester: string }[]>([]);
  const [programs, setPrograms] = useState<{ id: string; name: string }[]>([]);

  const [attendanceData, setAttendanceData] = useState<Record<string, unknown>[]>([]);
  const [resultData, setResultData] = useState<Record<string, unknown>[]>([]);
  const [feeData, setFeeData] = useState<Record<string, unknown>[]>([]);
  const [libraryData, setLibraryData] = useState<Record<string, unknown>[]>([]);
  const [chartData, setChartData] = useState<{ name: string; value: number }[]>([]);

  const addAlert = (v: 'info' | 'success' | 'warning' | 'error', m: string) => setAlerts((p) => [...p, { id: `${Date.now()}`, variant: v, message: m }]);

  useEffect(() => {
    (async () => {
      const [c, s, p] = await Promise.all([
        supabase.from('courses').select('id, name, code'),
        supabase.from('sections').select('id, section_name, course_id, semester'),
        supabase.from('programs').select('id, name'),
      ]);
      setCourses((c.data ?? []) as { id: string; name: string; code: string }[]);
      setSections((s.data ?? []) as { id: string; section_name: string; course_id: string; semester: string }[]);
      setPrograms((p.data ?? []) as { id: string; name: string }[]);
    })();
  }, []);

  const tabs: { key: ReportTab; label: string; icon: typeof ClipboardCheck }[] = [
    { key: 'attendance', label: 'Attendance', icon: ClipboardCheck },
    { key: 'results', label: 'Results', icon: Award },
    { key: 'fees', label: 'Fees', icon: DollarSign },
    { key: 'library', label: 'Library', icon: BookOpen },
  ];

  async function generateAttendanceReport(formData: FormData) {
    setLoading(true);
    const courseId = formData.get('course_id') as string;
    const sectionId = formData.get('section_id') as string;
    const dateFrom = formData.get('date_from') as string;
    const dateTo = formData.get('date_to') as string;

    let query = supabase
      .from('attendance_records')
      .select('id, date, status, enrollment_id!inner(student_id, section_id, students(name, email), sections(section_name, courses(name)))')
      .gte('date', dateFrom || '2000-01-01')
      .lte('date', dateTo || '2099-12-31');

    if (sectionId) {
      query = query.eq('enrollment_id.section_id', sectionId);
    }

    const { data } = await query.order('date', { ascending: false }).limit(500);
    const records = (data ?? []) as Record<string, unknown>[];
    setAttendanceData(records);

    const statusCounts: Record<string, number> = {};
    for (const r of records) {
      const s = r.status as string;
      statusCounts[s] = (statusCounts[s] || 0) + 1;
    }
    setChartData(Object.entries(statusCounts).map(([name, value]) => ({ name, value })));
    setLoading(false);
  }

  async function generateResultReport(formData: FormData) {
    setLoading(true);
    const sectionId = formData.get('section_id') as string;
    const courseId = formData.get('course_id') as string;

    let query = supabase
      .from('results')
      .select('*, enrollment_id!inner(student_id, section_id, students(name, email), sections(section_name, courses(name, code)))')
      .limit(500);

    if (sectionId) query = query.eq('enrollment_id.section_id', sectionId);

    const { data } = await query;
    const records = (data ?? []) as Record<string, unknown>[];
    setResultData(records);

    const gradeDist: Record<string, number> = {};
    for (const r of records) {
      const g = (r.grade as string) || 'N/A';
      gradeDist[g] = (gradeDist[g] || 0) + 1;
    }
    setChartData(Object.entries(gradeDist).map(([name, value]) => ({ name, value })));
    setLoading(false);
  }

  async function generateFeeReport(formData: FormData) {
    setLoading(true);
    const programId = formData.get('program_id') as string;
    const semester = formData.get('semester') as string;

    let query = supabase
      .from('fee_payments')
      .select('*, students!inner(name, email, program_id), fee_structure!inner(program_id, semester, amount, description)')
      .limit(500);

    if (semester) query = query.eq('fee_structure.semester', semester);

    const { data } = await query;
    const records = (data ?? []) as Record<string, unknown>[];
    setFeeData(records);

    const statusCounts: Record<string, number> = { completed: 0, pending: 0, failed: 0 };
    for (const r of records) {
      const s = (r.status as string) || 'pending';
      statusCounts[s] = (statusCounts[s] || 0) + 1;
    }
    setChartData(Object.entries(statusCounts).map(([name, value]) => ({ name, value })));
    setLoading(false);
  }

  async function generateLibraryReport() {
    setLoading(true);
    const [overdue, items] = await Promise.all([
      supabase
        .from('library_issues')
        .select('*, students(name, email), library_items(title, author, isbn, category)')
        .in('status', ['issued', 'overdue'])
        .limit(500),
      supabase.from('library_items').select('*'),
    ]);
    setLibraryData((overdue.data ?? []) as Record<string, unknown>[]);

    const categoryCounts: Record<string, number> = {};
    for (const item of (items.data ?? []) as Record<string, unknown>[]) {
      const cat = (item.category as string) || 'Other';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    }
    setChartData(Object.entries(categoryCounts).map(([name, value]) => ({ name, value })));
    setLoading(false);
  }

  function exportCSV(data: Record<string, unknown>[], filename: string) {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]!).filter((k) => !k.includes('enrollment_id') && !k.includes('enrollment'));
    const csv = [
      headers.join(','),
      ...data.map((row) => headers.map((h) => {
        const val = row[h];
        if (val && typeof val === 'object') {
          const nested = val as Record<string, unknown>;
          return `"${(nested.name || nested.title || JSON.stringify(val).replace(/"/g, '""')) as string}"`;
        }
        return `"${String(val ?? '').replace(/"/g, '""')}"`;
      }).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          <span className="text-gradient from-blue-600 to-blue-400">Reports</span>
        </h1>
        <p className="mt-1 text-sm text-gray-500">Generate and export system reports</p>
      </div>

      <AlertList alerts={alerts} />

      <div className="flex gap-1 rounded-xl bg-gray-100 p-1.5">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setChartData([]); }}
              className={`flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium capitalize transition ${
                tab === t.key ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Card title="Filters">
            {tab === 'attendance' && (
              <form action={generateAttendanceReport} className="flex flex-col gap-3">
                <Select label="Course" name="course_id" options={[{ value: '', label: 'All Courses' }, ...courses.map((c) => ({ value: c.id, label: `${c.name} (${c.code})` }))]} />
                <Select label="Section" name="section_id" options={[{ value: '', label: 'All Sections' }, ...sections.map((s) => ({ value: s.id, label: `${s.section_name} - ${s.semester}` }))]} />
                <Input label="Date From" type="date" name="date_from" />
                <Input label="Date To" type="date" name="date_to" />
                <Button type="submit" loading={loading}>
                  <FileSpreadsheet className="mr-1 h-4 w-4" />
                  Generate Report
                </Button>
              </form>
            )}

            {tab === 'results' && (
              <form action={generateResultReport} className="flex flex-col gap-3">
                <Select label="Course" name="course_id" options={[{ value: '', label: 'All Courses' }, ...courses.map((c) => ({ value: c.id, label: `${c.name} (${c.code})` }))]} />
                <Select label="Section" name="section_id" options={[{ value: '', label: 'All Sections' }, ...sections.map((s) => ({ value: s.id, label: `${s.section_name} - ${s.semester}` }))]} />
                <Button type="submit" loading={loading}>
                  <FileSpreadsheet className="mr-1 h-4 w-4" />
                  Generate Report
                </Button>
              </form>
            )}

            {tab === 'fees' && (
              <form action={generateFeeReport} className="flex flex-col gap-3">
                <Select label="Program" name="program_id" options={[{ value: '', label: 'All Programs' }, ...programs.map((p) => ({ value: p.id, label: p.name }))]} />
                <Input label="Semester" name="semester" placeholder="e.g. 2026F" />
                <Button type="submit" loading={loading}>
                  <FileSpreadsheet className="mr-1 h-4 w-4" />
                  Generate Report
                </Button>
              </form>
            )}

            {tab === 'library' && (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-gray-500">View all currently issued and overdue library items.</p>
                <Button onClick={generateLibraryReport} loading={loading}>
                  <FileSpreadsheet className="mr-1 h-4 w-4" />
                  Load Library Data
                </Button>
              </div>
            )}
          </Card>
        </div>

        <div className="lg:col-span-3 flex flex-col gap-4">
          {chartData.length > 0 && (
            <Card>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.2)',
                        background: 'rgba(255,255,255,0.9)',
                        backdropFilter: 'blur(8px)',
                      }}
                    />
                    <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          <Card
            title={
              tab === 'attendance' ? 'Attendance Records' :
              tab === 'results' ? 'Result Records' :
              tab === 'fees' ? 'Fee Payments' :
              'Library Issues'
            }
            action={
              <>
                {(tab === 'attendance' && attendanceData.length > 0) && (
                  <Button variant="outline" onClick={() => exportCSV(attendanceData, 'attendance-report.csv')}>
                    <Download className="mr-1 h-4 w-4" />
                    Export CSV
                  </Button>
                )}
                {(tab === 'results' && resultData.length > 0) && (
                  <Button variant="outline" onClick={() => exportCSV(resultData, 'results-report.csv')}>
                    <Download className="mr-1 h-4 w-4" />
                    Export CSV
                  </Button>
                )}
                {(tab === 'fees' && feeData.length > 0) && (
                  <Button variant="outline" onClick={() => exportCSV(feeData, 'fee-report.csv')}>
                    <Download className="mr-1 h-4 w-4" />
                    Export CSV
                  </Button>
                )}
                {(tab === 'library' && libraryData.length > 0) && (
                  <Button variant="outline" onClick={() => exportCSV(libraryData, 'library-report.csv')}>
                    <Download className="mr-1 h-4 w-4" />
                    Export CSV
                  </Button>
                )}
              </>
            }
          >
            {tab === 'attendance' && (
              <DataTable
                columns={[
                  { key: 'student', header: 'Student', render: (r) => {
                    const e = r.enrollment_id as Record<string, unknown> | undefined;
                    const s = e?.students as Record<string, unknown> | undefined;
                    return (s?.name as string) ?? '-';
                  }},
                  { key: 'email', header: 'Email', render: (r) => {
                    const e = r.enrollment_id as Record<string, unknown> | undefined;
                    const s = e?.students as Record<string, unknown> | undefined;
                    return (s?.email as string) ?? '-';
                  }},
                  { key: 'date', header: 'Date', render: (r) => new Date(r.date as string).toLocaleDateString() },
                  { key: 'status', header: 'Status', render: (r) => {
                    const v = r.status as string;
                    return (
                      <Badge variant={v === 'Present' ? 'success' : v === 'Late' ? 'warning' : 'error'}>
                        {v}
                      </Badge>
                    );
                  }},
                ]}
                data={attendanceData as Record<string, unknown>[]}
                keyExtractor={(r) => r.id as string}
                emptyMessage="No attendance records. Use the filters and generate a report."
              />
            )}

            {tab === 'results' && (
              <DataTable
                columns={[
                  { key: 'student', header: 'Student', render: (r) => {
                    const e = r.enrollment_id as Record<string, unknown> | undefined;
                    const s = e?.students as Record<string, unknown> | undefined;
                    return (s?.name as string) ?? '-';
                  }},
                  { key: 'course', header: 'Course', render: (r) => {
                    const e = r.enrollment_id as Record<string, unknown> | undefined;
                    const sec = e?.sections as Record<string, unknown> | undefined;
                    const c = sec?.courses as Record<string, unknown> | undefined;
                    return c ? `${c.name as string}` : '-';
                  }},
                  { key: 'total', header: 'Total', render: (r) => r.total_marks as string ?? '-' },
                  { key: 'percentage', header: '%', render: (r) => r.percentage ? `${Number(r.percentage).toFixed(1)}%` : '-' },
                  { key: 'grade', header: 'Grade', render: (r) => <Badge variant={Number(r.percentage) >= 80 ? 'success' : Number(r.percentage) >= 60 ? 'info' : 'warning'}>{r.grade as string}</Badge> },
                ]}
                data={resultData as Record<string, unknown>[]}
                keyExtractor={(r) => r.id as string}
                emptyMessage="No result records. Use the filters and generate a report."
              />
            )}

            {tab === 'fees' && (
              <DataTable
                columns={[
                  { key: 'student', header: 'Student', render: (r) => {
                    const s = r.students as Record<string, unknown> | undefined;
                    return (s?.name as string) ?? '-';
                  }},
                  { key: 'amount', header: 'Amount', render: (r) => `PKR ${Number(r.amount).toLocaleString()}` },
                  { key: 'status', header: 'Status', render: (r) => {
                    const v = r.status as string;
                    return <Badge variant={v === 'completed' ? 'success' : v === 'pending' ? 'warning' : 'error'}>{v}</Badge>;
                  }},
                  { key: 'date', header: 'Paid At', render: (r) => r.paid_at ? new Date(r.paid_at as string).toLocaleDateString() : '-' },
                  { key: 'ref', header: 'Ref #', render: (r) => (r.transaction_ref as string)?.slice(0, 12) ?? '-' },
                ]}
                data={feeData as Record<string, unknown>[]}
                keyExtractor={(r) => r.id as string}
                emptyMessage="No fee records. Use the filters and generate a report."
              />
            )}

            {tab === 'library' && (
              <DataTable
                columns={[
                  { key: 'student', header: 'Student', render: (r) => {
                    const s = r.students as Record<string, unknown> | undefined;
                    return (s?.name as string) ?? '-';
                  }},
                  { key: 'item', header: 'Item', render: (r) => {
                    const i = r.library_items as Record<string, unknown> | undefined;
                    return (i?.title as string) ?? '-';
                  }},
                  { key: 'author', header: 'Author', render: (r) => {
                    const i = r.library_items as Record<string, unknown> | undefined;
                    return (i?.author as string) ?? '-';
                  }},
                  { key: 'issued', header: 'Issued', render: (r) => new Date(r.issued_at as string).toLocaleDateString() },
                  { key: 'due', header: 'Due Date', render: (r) => new Date(r.due_date as string).toLocaleDateString() },
                  { key: 'status', header: 'Status', render: (r) => {
                    const v = r.status as string;
                    return <Badge variant={v === 'overdue' ? 'error' : v === 'issued' ? 'warning' : 'success'}>{v}</Badge>;
                  }},
                ]}
                data={libraryData as Record<string, unknown>[]}
                keyExtractor={(r) => r.id as string}
                emptyMessage="No library issues. Click 'Load Library Data' to fetch records."
              />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
