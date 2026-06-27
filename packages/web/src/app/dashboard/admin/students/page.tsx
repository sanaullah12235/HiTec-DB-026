'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/form-field';
import { DataTable } from '@/components/ui/data-table';
import { AlertList } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { GraduationCap, Plus, Search, Eye } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  email: string;
  cnic: string;
  gpa: number;
  enrollment_semester: string;
  program_id: string;
  programs?: { name: string };
}

export default function StudentsPage() {
  const supabase = createClient();
  const [alerts, setAlerts] = useState<{ id: string; variant?: 'info' | 'success' | 'warning' | 'error'; message: string }[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [programs, setPrograms] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [programFilter, setProgramFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Student | null>(null);
  const [form, setForm] = useState({ name: '', email: '', cnic: '', gpa: '', enrollment_semester: '', program_id: '' });

  const addAlert = (v: 'info' | 'success' | 'warning' | 'error', m: string) => setAlerts((p) => [...p, { id: `${Date.now()}`, variant: v, message: m }]);

  async function loadData() {
    setLoading(true);
    const [sRes, pRes] = await Promise.all([
      supabase.from('students').select('*'),
      supabase.from('programs').select('id, name'),
    ]);
    if (sRes.error) {
      addAlert('error', `Failed to load students: ${sRes.error.message}`);
      setStudents([]);
    } else {
      const programMap = new Map((pRes.data ?? []).map((p) => [p.id, p]));
      setStudents((sRes.data as Student[] ?? []).map((s) => ({
        ...s,
        programs: programMap.get(s.program_id) ? { name: (programMap.get(s.program_id) as { name: string }).name } : undefined,
      })));
    }
    if (pRes.error) addAlert('error', `Failed to load programs: ${pRes.error.message}`);
    setPrograms((pRes.data ?? []) as { id: string; name: string }[]);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  function openAddForm() {
    setEditing(null);
    setForm({ name: '', email: '', cnic: '', gpa: '', enrollment_semester: '', program_id: '' });
    setShowForm(true);
  }

  function openEditForm(row: Record<string, unknown>) {
    setEditing(row.id as string);
    setForm({
      name: row.name as string,
      email: row.email as string,
      cnic: row.cnic as string ?? '',
      gpa: String(row.gpa ?? ''),
      enrollment_semester: row.enrollment_semester as string,
      program_id: row.program_id as string,
    });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name || !form.email || !form.cnic || !form.enrollment_semester || !form.program_id) {
      addAlert('error', 'Name, email, CNIC, semester, and program are required.');
      return;
    }
    const payload = {
      name: form.name,
      email: form.email,
      cnic: form.cnic,
      gpa: form.gpa ? parseFloat(form.gpa) : null,
      enrollment_semester: form.enrollment_semester,
      program_id: form.program_id,
    };
    if (editing) {
      const { error } = await supabase.from('students').update(payload).eq('id', editing);
      if (error) { addAlert('error', error.message); return; }
      addAlert('success', 'Student updated.');
    } else {
      const { error } = await supabase.from('students').insert(payload);
      if (error) { addAlert('error', error.message); return; }
      addAlert('success', 'Student created.');
    }
    setShowForm(false);
    await loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this student? This will also remove their enrollments and records.')) return;
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) { addAlert('error', error.message); return; }
    addAlert('success', 'Student deleted.');
    await loadData();
  }

  const filtered = students.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase());
    const matchesProgram = !programFilter || s.program_id === programFilter;
    return matchesSearch && matchesProgram;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            <span className="text-gradient from-blue-600 to-blue-400">Manage Students</span>
          </h1>
          <p className="mt-1 text-sm text-gray-500">View, add, edit, and delete student records</p>
        </div>
        <Button onClick={openAddForm}>
          <Plus className="mr-1 h-4 w-4" />
          Add Student
        </Button>
      </div>

      <AlertList alerts={alerts} />

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <div className="w-48">
          <select
            value={programFilter}
            onChange={(e) => setProgramFilter(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="">All Programs</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-gray-400">Loading...</p>
      ) : (
        <Card>
          <DataTable
            columns={[
              { key: 'name', header: 'Name' },
              { key: 'email', header: 'Email' },
              { key: 'program', header: 'Program', render: (r) => (r.programs as Record<string, unknown>)?.name as string ?? '-' },
              { key: 'semester', header: 'Semester', render: (r) => <Badge>{r.enrollment_semester as string}</Badge> },
              { key: 'gpa', header: 'GPA', render: (r) => r.gpa ? Number(r.gpa).toFixed(2) : '-' },
              { key: 'actions', header: '', render: (r) => (
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setViewing(r as unknown as Student)}><Eye className="h-4 w-4" /></Button>
                  <Button variant="outline" onClick={() => openEditForm(r)}>Edit</Button>
                  <Button variant="danger" onClick={() => handleDelete(r.id as string)}>Delete</Button>
                </div>
              )},
            ]}
            data={filtered as unknown as Record<string, unknown>[]}
            keyExtractor={(r) => r.id as string}
            emptyMessage="No students found."
          />
        </Card>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-bold">{editing ? 'Edit' : 'Add'} Student</h2>
            </div>
            <div className="flex flex-col gap-3">
              <Input label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              <Input label="CNIC" value={form.cnic} onChange={(e) => setForm({ ...form, cnic: e.target.value })} placeholder="e.g. 12345-6789012-3" />
              <Select label="Program" value={form.program_id} onChange={(e) => setForm({ ...form, program_id: e.target.value })} required options={programs.map((p) => ({ value: p.id, label: p.name }))} />
              <Input label="Enrollment Semester" value={form.enrollment_semester} onChange={(e) => setForm({ ...form, enrollment_semester: e.target.value })} placeholder="e.g. 2026F" required />
              <Input label="GPA" type="number" step="0.01" min="0" max="4" value={form.gpa} onChange={(e) => setForm({ ...form, gpa: e.target.value })} />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleSave}>Save</Button>
            </div>
          </div>
        </div>
      )}

      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setViewing(null)}>
          <div className="w-full max-w-lg rounded-2xl border border-gray-100 bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-bold">Student Details</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-lg bg-gray-50 p-3"><span className="block text-xs font-semibold text-gray-500">Name</span><p className="mt-0.5 font-medium text-gray-900">{viewing.name}</p></div>
              <div className="rounded-lg bg-gray-50 p-3"><span className="block text-xs font-semibold text-gray-500">Email</span><p className="mt-0.5 font-medium text-gray-900">{viewing.email}</p></div>
              <div className="rounded-lg bg-gray-50 p-3"><span className="block text-xs font-semibold text-gray-500">CNIC</span><p className="mt-0.5 font-medium text-gray-900">{viewing.cnic || '-'}</p></div>
              <div className="rounded-lg bg-gray-50 p-3"><span className="block text-xs font-semibold text-gray-500">GPA</span><p className="mt-0.5 font-medium text-gray-900">{viewing.gpa ? Number(viewing.gpa).toFixed(2) : '-'}</p></div>
              <div className="rounded-lg bg-gray-50 p-3"><span className="block text-xs font-semibold text-gray-500">Program</span><p className="mt-0.5 font-medium text-gray-900">{viewing.programs?.name ?? '-'}</p></div>
              <div className="rounded-lg bg-gray-50 p-3"><span className="block text-xs font-semibold text-gray-500">Semester</span><p className="mt-0.5 font-medium text-gray-900">{viewing.enrollment_semester}</p></div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={() => setViewing(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
