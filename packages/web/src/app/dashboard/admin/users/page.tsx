'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/form-field';
import { DataTable } from '@/components/ui/data-table';
import { AlertList } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { UserPlus, Search, Shield, UserCog } from 'lucide-react';

type UserTab = 'students' | 'faculty' | 'staff';

interface Student { id: string; name: string; email: string; program_id: string; programs?: { name: string }; enrollment_semester: string; }
interface Faculty { id: string; name: string; email: string; department_id: string; departments?: { name: string }; employee_code: string; }
interface Staff { id: string; name: string; email: string; department_id: string; departments?: { name: string }; role: string; employee_code: string; }
interface Alert { id: string; variant?: 'info' | 'success' | 'warning' | 'error'; message: string }

export default function UsersPage() {
  const supabase = createClient();
  const [tab, setTab] = useState<UserTab>('students');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [search, setSearch] = useState('');

  const [students, setStudents] = useState<Student[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [programs, setPrograms] = useState<{ id: string; name: string }[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  const emptyStudent = { name: '', email: '', program_id: '', enrollment_semester: '' };
  const emptyFaculty = { name: '', email: '', department_id: '', employee_code: '' };
  const emptyStaff = { name: '', email: '', department_id: '', role: 'admin', employee_code: '' };
  const [form, setForm] = useState<Record<string, string>>(emptyStudent);

  const addAlert = useCallback((v: 'info' | 'success' | 'warning' | 'error', m: string) => {
    setAlerts((p) => [...p, { id: `${Date.now()}`, variant: v, message: m }]);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [progRes, deptRes] = await Promise.all([
        supabase.from('programs').select('id, name'),
        supabase.from('departments').select('id, name'),
      ]);
      setPrograms(progRes.data ?? []);
      setDepartments(deptRes.data ?? []);
      await loadData();
      setLoading(false);
    })();
  }, []);

  async function loadData() {
    const [sRes, fRes, stRes] = await Promise.all([
      supabase.from('students').select('*, programs(name)'),
      supabase.from('faculty').select('*, departments(name)'),
      supabase.from('staff').select('*, departments(name)'),
    ]);
    setStudents(sRes.data as Student[] ?? []);
    setFaculty(fRes.data as Faculty[] ?? []);
    setStaff(stRes.data as Staff[] ?? []);
  }

  function openAddForm() {
    setEditing(null);
    setForm(tab === 'students' ? { ...emptyStudent } : tab === 'faculty' ? { ...emptyFaculty } : { ...emptyStaff });
    setShowForm(true);
  }

  function openEdit(row: Record<string, unknown>) {
    setEditing(row.id as string);
    const f: Record<string, string> = {};
    if (tab === 'students') { f.name = row.name as string; f.email = row.email as string; f.program_id = row.program_id as string; f.enrollment_semester = row.enrollment_semester as string; }
    else if (tab === 'faculty') { f.name = row.name as string; f.email = row.email as string; f.department_id = row.department_id as string; f.employee_code = row.employee_code as string; }
    else { f.name = row.name as string; f.email = row.email as string; f.department_id = row.department_id as string; f.role = row.role as string; f.employee_code = row.employee_code as string; }
    setForm(f);
    setShowForm(true);
  }

  async function handleSave() {
    const table = tab;
    if (editing) {
      const { error } = await supabase.from(table).update(form).eq('id', editing);
      if (error) { addAlert('error', error.message); return; }
      addAlert('success', 'Updated successfully.');
    } else {
      const { error } = await supabase.from(table).insert(form);
      if (error) { addAlert('error', error.message); return; }
      addAlert('success', 'Created successfully.');
    }
    setShowForm(false);
    await loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this record?')) return;
    const { error } = await supabase.from(tab).delete().eq('id', id);
    if (error) { addAlert('error', error.message); return; }
    addAlert('success', 'Deleted successfully.');
    await loadData();
  }

  const filteredStudents = students.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.email.includes(search));
  const filteredFaculty = faculty.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.email.includes(search));
  const filteredStaff = staff.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.email.includes(search));

  const tabs: { key: UserTab; label: string; icon: typeof UserPlus }[] = [
    { key: 'students', label: 'Students', icon: UserPlus },
    { key: 'faculty', label: 'Faculty', icon: Shield },
    { key: 'staff', label: 'Staff', icon: UserCog },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            <span className="text-gradient from-blue-600 to-blue-400">Manage Users</span>
          </h1>
          <p className="mt-1 text-sm text-gray-500">Add, edit, and manage all system users</p>
        </div>
        <Button onClick={openAddForm}>
          <UserPlus className="mr-1 h-4 w-4" />
          Add {tab.slice(0, -1)}
        </Button>
      </div>

      <AlertList alerts={alerts} />

      <div className="flex gap-1 rounded-xl bg-gray-100 p-1.5">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setSearch(''); }}
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

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
        />
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-gray-400">Loading...</p>
      ) : tab === 'students' ? (
        <Card>
          <DataTable
            columns={[
              { key: 'name', header: 'Name' },
              { key: 'email', header: 'Email' },
              { key: 'program', header: 'Program', render: (r) => (r.programs as Record<string, unknown>)?.name as string ?? '-' },
              { key: 'semester', header: 'Semester', render: (r) => r.enrollment_semester as string },
              { key: 'actions', header: '', render: (r) => (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => openEdit(r)}>Edit</Button>
                  <Button variant="danger" onClick={() => handleDelete(r.id as string)}>Delete</Button>
                </div>
              )},
            ]}
            data={filteredStudents as unknown as Record<string, unknown>[]}
            keyExtractor={(r) => r.id as string}
          />
        </Card>
      ) : tab === 'faculty' ? (
        <Card>
          <DataTable
            columns={[
              { key: 'name', header: 'Name' },
              { key: 'email', header: 'Email' },
              { key: 'dept', header: 'Department', render: (r) => (r.departments as Record<string, unknown>)?.name as string ?? '-' },
              { key: 'code', header: 'Employee Code', render: (r) => r.employee_code as string },
              { key: 'actions', header: '', render: (r) => (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => openEdit(r)}>Edit</Button>
                  <Button variant="danger" onClick={() => handleDelete(r.id as string)}>Delete</Button>
                </div>
              )},
            ]}
            data={filteredFaculty as unknown as Record<string, unknown>[]}
            keyExtractor={(r) => r.id as string}
          />
        </Card>
      ) : (
        <Card>
          <DataTable
            columns={[
              { key: 'name', header: 'Name' },
              { key: 'email', header: 'Email' },
              { key: 'dept', header: 'Department', render: (r) => (r.departments as Record<string, unknown>)?.name as string ?? '-' },
              { key: 'role', header: 'Role', render: (r) => <Badge>{r.role as string}</Badge> },
              { key: 'code', header: 'Employee Code', render: (r) => r.employee_code as string },
              { key: 'actions', header: '', render: (r) => (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => openEdit(r)}>Edit</Button>
                  <Button variant="danger" onClick={() => handleDelete(r.id as string)}>Delete</Button>
                </div>
              )},
            ]}
            data={filteredStaff as unknown as Record<string, unknown>[]}
            keyExtractor={(r) => r.id as string}
          />
        </Card>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-bold">{editing ? 'Edit' : 'Add'} {tab.slice(0, -1)}</h2>
            <div className="flex flex-col gap-3">
              <Input label="Name" value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <Input label="Email" type="email" value={form.email ?? ''} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              {tab === 'students' && (
                <>
                  <Select label="Program" value={form.program_id ?? ''} onChange={(e) => setForm({ ...form, program_id: e.target.value })} required options={programs.map((p) => ({ value: p.id, label: p.name }))} />
                  <Input label="Semester" value={form.enrollment_semester ?? ''} onChange={(e) => setForm({ ...form, enrollment_semester: e.target.value })} placeholder="e.g. 2026F" required />
                </>
              )}
              {tab === 'faculty' && (
                <>
                  <Select label="Department" value={form.department_id ?? ''} onChange={(e) => setForm({ ...form, department_id: e.target.value })} required options={departments.map((d) => ({ value: d.id, label: d.name }))} />
                  <Input label="Employee Code" value={form.employee_code ?? ''} onChange={(e) => setForm({ ...form, employee_code: e.target.value })} required />
                </>
              )}
              {tab === 'staff' && (
                <>
                  <Select label="Department" value={form.department_id ?? ''} onChange={(e) => setForm({ ...form, department_id: e.target.value })} required options={departments.map((d) => ({ value: d.id, label: d.name }))} />
                  <Select label="Role" value={form.role ?? 'admin'} onChange={(e) => setForm({ ...form, role: e.target.value })} required options={[
                    { value: 'admin', label: 'Admin' },
                    { value: 'librarian', label: 'Librarian' },
                  ]} />
                  <Input label="Employee Code" value={form.employee_code ?? ''} onChange={(e) => setForm({ ...form, employee_code: e.target.value })} required />
                </>
              )}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleSave}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
