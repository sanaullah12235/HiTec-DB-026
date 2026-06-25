'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/form-field';
import { DataTable } from '@/components/ui/data-table';
import { AlertList } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { Users, Plus, Search } from 'lucide-react';

interface Faculty {
  id: string;
  name: string;
  email: string;
  employee_code: string;
  department_id: string;
  departments?: { name: string; code: string };
}

export default function FacultyPage() {
  const supabase = createClient();
  const [alerts, setAlerts] = useState<{ id: string; variant?: 'info' | 'success' | 'warning' | 'error'; message: string }[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', employee_code: '', department_id: '' });

  const addAlert = (v: 'info' | 'success' | 'warning' | 'error', m: string) => setAlerts((p) => [...p, { id: `${Date.now()}`, variant: v, message: m }]);

  async function loadData() {
    setLoading(true);
    const [fRes, dRes] = await Promise.all([
      supabase.from('faculty').select('*, departments(name, code)'),
      supabase.from('departments').select('id, name'),
    ]);
    setFaculty((fRes.data ?? []) as Faculty[]);
    setDepartments((dRes.data ?? []) as { id: string; name: string }[]);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  function openAddForm() {
    setEditing(null);
    setForm({ name: '', email: '', employee_code: '', department_id: departments[0]?.id || '' });
    setShowForm(true);
  }

  function openEditForm(row: Record<string, unknown>) {
    setEditing(row.id as string);
    setForm({
      name: row.name as string,
      email: row.email as string,
      employee_code: row.employee_code as string,
      department_id: row.department_id as string,
    });
    setShowForm(true);
  }

  async function handleSave() {
    const payload = { name: form.name, email: form.email, employee_code: form.employee_code, department_id: form.department_id };
    if (editing) {
      const { error } = await supabase.from('faculty').update(payload).eq('id', editing);
      if (error) { addAlert('error', error.message); return; }
      addAlert('success', 'Faculty updated.');
    } else {
      const { error } = await supabase.from('faculty').insert(payload);
      if (error) { addAlert('error', error.message); return; }
      addAlert('success', 'Faculty added.');
    }
    setShowForm(false);
    await loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this faculty member?')) return;
    const { error } = await supabase.from('faculty').delete().eq('id', id);
    if (error) { addAlert('error', error.message); return; }
    addAlert('success', 'Faculty deleted.');
    await loadData();
  }

  const filtered = faculty.filter((f) => {
    const ms = f.name.toLowerCase().includes(search.toLowerCase()) || f.email.toLowerCase().includes(search.toLowerCase()) || f.employee_code.toLowerCase().includes(search.toLowerCase());
    const md = !deptFilter || f.department_id === deptFilter;
    return ms && md;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            <span className="text-gradient from-blue-600 to-blue-400">Manage Faculty</span>
          </h1>
          <p className="mt-1 text-sm text-gray-500">Add, edit, and manage faculty members</p>
        </div>
        <Button onClick={openAddForm}>
          <Plus className="mr-1 h-4 w-4" />
          Add Faculty
        </Button>
      </div>

      <AlertList alerts={alerts} />

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Search by name, email, or employee code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <div className="w-48">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
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
              { key: 'code', header: 'Employee Code', render: (r) => <Badge>{r.employee_code as string}</Badge> },
              { key: 'dept', header: 'Department', render: (r) => (r.departments as Record<string, unknown>)?.name as string ?? '-' },
              { key: 'actions', header: '', render: (r) => (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => openEditForm(r)}>Edit</Button>
                  <Button variant="danger" onClick={() => handleDelete(r.id as string)}>Delete</Button>
                </div>
              )},
            ]}
            data={filtered as unknown as Record<string, unknown>[]}
            keyExtractor={(r) => r.id as string}
            emptyMessage="No faculty members found."
          />
        </Card>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-bold">{editing ? 'Edit' : 'Add'} Faculty Member</h2>
            </div>
            <div className="flex flex-col gap-3">
              <Input label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              <Input label="Employee Code" value={form.employee_code} onChange={(e) => setForm({ ...form, employee_code: e.target.value })} required />
              <Select label="Department" value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })} required options={departments.map((d) => ({ value: d.id, label: d.name }))} />
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
