'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/form-field';
import { DataTable } from '@/components/ui/data-table';
import { AlertList } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { BookMarked, Plus } from 'lucide-react';

interface Program {
  id: string;
  department_id: string;
  name: string;
  code: string;
  duration_years: number;
  departments?: { name: string };
}

export default function ProgramsPage() {
  const supabase = createClient();
  const [alerts, setAlerts] = useState<{ id: string; variant?: 'info' | 'success' | 'warning' | 'error'; message: string }[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', code: '', duration_years: '', department_id: '' });

  const addAlert = (v: 'info' | 'success' | 'warning' | 'error', m: string) => setAlerts((p) => [...p, { id: `${Date.now()}`, variant: v, message: m }]);

  async function loadData() {
    setLoading(true);
    const [pRes, dRes] = await Promise.all([
      supabase.from('programs').select('*, departments(name)'),
      supabase.from('departments').select('id, name'),
    ]);
    setPrograms((pRes.data ?? []) as Program[]);
    setDepartments((dRes.data ?? []) as { id: string; name: string }[]);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  function openAddForm() {
    setEditing(null);
    setForm({ name: '', code: '', duration_years: '4', department_id: departments[0]?.id || '' });
    setShowForm(true);
  }

  function openEditForm(row: Record<string, unknown>) {
    setEditing(row.id as string);
    setForm({
      name: row.name as string,
      code: row.code as string,
      duration_years: String(row.duration_years ?? '4'),
      department_id: row.department_id as string,
    });
    setShowForm(true);
  }

  async function handleSave() {
    const payload = {
      name: form.name,
      code: form.code.toUpperCase(),
      duration_years: parseInt(form.duration_years) || 4,
      department_id: form.department_id,
    };
    if (editing) {
      const { error } = await supabase.from('programs').update(payload).eq('id', editing);
      if (error) { addAlert('error', error.message); return; }
      addAlert('success', 'Program updated.');
    } else {
      const { error } = await supabase.from('programs').insert(payload);
      if (error) { addAlert('error', error.message); return; }
      addAlert('success', 'Program created.');
    }
    setShowForm(false);
    await loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this program? This may affect associated students.')) return;
    const { error } = await supabase.from('programs').delete().eq('id', id);
    if (error) { addAlert('error', error.message); return; }
    addAlert('success', 'Program deleted.');
    await loadData();
  }

  const filtered = programs.filter((p) => !deptFilter || p.department_id === deptFilter);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            <span className="text-gradient from-blue-600 to-blue-400">Manage Programs</span>
          </h1>
          <p className="mt-1 text-sm text-gray-500">Create and manage academic programs under departments</p>
        </div>
        <Button onClick={openAddForm}>
          <Plus className="mr-1 h-4 w-4" />
          Add Program
        </Button>
      </div>

      <AlertList alerts={alerts} />

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

      {loading ? (
        <p className="py-8 text-center text-sm text-gray-400">Loading...</p>
      ) : (
        <Card>
          <DataTable
            columns={[
              { key: 'name', header: 'Program Name' },
              { key: 'code', header: 'Code', render: (r) => <Badge>{r.code as string}</Badge> },
              { key: 'dept', header: 'Department', render: (r) => (r.departments as Record<string, unknown>)?.name as string ?? '-' },
              { key: 'duration', header: 'Duration', render: (r) => `${r.duration_years as number} years` },
              { key: 'actions', header: '', render: (r) => (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => openEditForm(r)}>Edit</Button>
                  <Button variant="danger" onClick={() => handleDelete(r.id as string)}>Delete</Button>
                </div>
              )},
            ]}
            data={filtered as unknown as Record<string, unknown>[]}
            keyExtractor={(r) => r.id as string}
            emptyMessage="No programs found."
          />
        </Card>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center gap-2">
              <BookMarked className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-bold">{editing ? 'Edit' : 'Add'} Program</h2>
            </div>
            <div className="flex flex-col gap-3">
              <Select label="Department" value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })} required options={departments.map((d) => ({ value: d.id, label: d.name }))} />
              <Input label="Program Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <Input label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. BSCS, BBA" required />
              <Input label="Duration (years)" type="number" min="1" max="8" value={form.duration_years} onChange={(e) => setForm({ ...form, duration_years: e.target.value })} required />
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
