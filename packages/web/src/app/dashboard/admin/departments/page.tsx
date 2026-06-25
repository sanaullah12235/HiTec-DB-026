'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/form-field';
import { DataTable } from '@/components/ui/data-table';
import { AlertList } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { Building2, Plus } from 'lucide-react';

interface Department {
  id: string;
  name: string;
  code: string;
}

export default function DepartmentsPage() {
  const supabase = createClient();
  const [alerts, setAlerts] = useState<{ id: string; variant?: 'info' | 'success' | 'warning' | 'error'; message: string }[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', code: '' });

  const addAlert = (v: 'info' | 'success' | 'warning' | 'error', m: string) => setAlerts((p) => [...p, { id: `${Date.now()}`, variant: v, message: m }]);

  async function loadData() {
    setLoading(true);
    const { data } = await supabase.from('departments').select('*').order('name');
    setDepartments((data ?? []) as Department[]);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  function openAddForm() {
    setEditing(null);
    setForm({ name: '', code: '' });
    setShowForm(true);
  }

  function openEditForm(row: Record<string, unknown>) {
    setEditing(row.id as string);
    setForm({ name: row.name as string, code: row.code as string });
    setShowForm(true);
  }

  async function handleSave() {
    const payload = { name: form.name, code: form.code.toUpperCase() };
    if (editing) {
      const { error } = await supabase.from('departments').update(payload).eq('id', editing);
      if (error) { addAlert('error', error.message); return; }
      addAlert('success', 'Department updated.');
    } else {
      const { error } = await supabase.from('departments').insert(payload);
      if (error) { addAlert('error', error.message); return; }
      addAlert('success', 'Department created.');
    }
    setShowForm(false);
    await loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this department? This may affect associated programs and faculty.')) return;
    const { error } = await supabase.from('departments').delete().eq('id', id);
    if (error) { addAlert('error', error.message); return; }
    addAlert('success', 'Department deleted.');
    await loadData();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            <span className="text-gradient from-blue-600 to-blue-400">Manage Departments</span>
          </h1>
          <p className="mt-1 text-sm text-gray-500">Create and manage academic departments</p>
        </div>
        <Button onClick={openAddForm}>
          <Plus className="mr-1 h-4 w-4" />
          Add Department
        </Button>
      </div>

      <AlertList alerts={alerts} />

      {loading ? (
        <p className="py-8 text-center text-sm text-gray-400">Loading...</p>
      ) : (
        <Card>
          <DataTable
            columns={[
              { key: 'name', header: 'Department Name' },
              { key: 'code', header: 'Code', render: (r) => <Badge>{r.code as string}</Badge> },
              { key: 'actions', header: '', render: (r) => (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => openEditForm(r)}>Edit</Button>
                  <Button variant="danger" onClick={() => handleDelete(r.id as string)}>Delete</Button>
                </div>
              )},
            ]}
            data={departments as unknown as Record<string, unknown>[]}
            keyExtractor={(r) => r.id as string}
            emptyMessage="No departments found."
          />
        </Card>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-bold">{editing ? 'Edit' : 'Add'} Department</h2>
            </div>
            <div className="flex flex-col gap-3">
              <Input label="Department Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <Input label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. CS, EE, MGT" required />
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
