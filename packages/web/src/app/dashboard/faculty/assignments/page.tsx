'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, Input, Textarea } from '@/components/ui/form-field';
import { Badge } from '@/components/ui/badge';
import { AlertList } from '@/components/ui/alert';
import { Spinner, PageSpinner } from '@/components/ui/spinner';
import { PageHeader } from '@/components/ui/page-header';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import {
  FileText, Plus, Edit, Trash2, CheckCircle2, XCircle,
  Eye, Upload, Save, Calendar, Clock, Link, Users,
} from 'lucide-react';

interface Section { id: string; section_name: string; semester: string; courses?: { name: string; code: string } }
interface Assignment {
  id: string; section_id: string; faculty_id: string;
  title: string; description: string | null; file_url: string | null;
  due_date: string | null; max_marks: number; published: boolean;
  created_at: string;
}

export default function AssignmentsPage() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const [alerts, setAlerts] = useState<{ id: string; variant?: 'info' | 'success' | 'warning' | 'error'; message: string }[]>([]);
  const addAlert = useCallback((v: 'info' | 'success' | 'warning' | 'error', m: string) => {
    setAlerts((p) => [...p, { id: `${Date.now()}-${Math.random()}`, variant: v, message: m }]);
  }, []);

  const [sections, setSections] = useState<Section[]>([]);
  const [sectionId, setSectionId] = useState(searchParams.get('section_id') ?? '');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [facultyId, setFacultyId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    file_url: '',
    due_date: '',
    max_marks: 100,
  });

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data: fac } = await supabase.from('faculty').select('id').eq('email', user.email!).maybeSingle();
      if (!fac) { setLoading(false); return; }
      setFacultyId(fac.id);
      const { data: secs } = await supabase.from('sections').select('*, courses(name, code)').eq('faculty_id', fac.id);
      setSections(secs ?? []);
      if (searchParams.get('section_id') && secs?.some((s) => s.id === searchParams.get('section_id'))) {
        await loadAssignments(searchParams.get('section_id')!);
      }
      setLoading(false);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (sectionId && facultyId) loadAssignments(sectionId);
  }, [sectionId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadAssignments(sid: string) {
    setDataLoading(true);
    const { data } = await supabase
      .from('assignments')
      .select('*')
      .eq('section_id', sid)
      .order('created_at', { ascending: false });
    setAssignments(data ?? []);
    setDataLoading(false);
  }

  function resetForm() {
    setForm({ title: '', description: '', file_url: '', due_date: '', max_marks: 100 });
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(a: Assignment) {
    setForm({
      title: a.title,
      description: a.description ?? '',
      file_url: a.file_url ?? '',
      due_date: a.due_date ? a.due_date.slice(0, 16) : '',
      max_marks: a.max_marks,
    });
    setEditingId(a.id);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.title.trim()) { addAlert('error', 'Title is required.'); return; }
    if (!facultyId || !sectionId) { addAlert('error', 'No section selected.'); return; }

    setSaving(true);
    const payload = {
      section_id: sectionId,
      faculty_id: facultyId,
      title: form.title.trim(),
      description: form.description.trim() || null,
      file_url: form.file_url.trim() || null,
      due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
      max_marks: form.max_marks,
    };

    if (editingId) {
      const { error } = await supabase.from('assignments').update(payload).eq('id', editingId);
      if (error) { addAlert('error', `Update failed: ${error.message}`); } else {
        addAlert('success', 'Assignment updated.');
        await loadAssignments(sectionId);
        resetForm();
      }
    } else {
      const { error } = await supabase.from('assignments').insert(payload);
      if (error) { addAlert('error', `Create failed: ${error.message}`); } else {
        addAlert('success', 'Assignment created.');
        await loadAssignments(sectionId);
        resetForm();
      }
    }
    setSaving(false);
  }

  async function togglePublish(a: Assignment) {
    const { error } = await supabase
      .from('assignments')
      .update({ published: !a.published })
      .eq('id', a.id);
    if (error) { addAlert('error', `Failed to update: ${error.message}`); } else {
      addAlert('success', `Assignment ${a.published ? 'unpublished' : 'published'}.`);
      await loadAssignments(sectionId);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this assignment? This action cannot be undone.')) return;
    const { error } = await supabase.from('assignments').delete().eq('id', id);
    if (error) { addAlert('error', `Delete failed: ${error.message}`); } else {
      addAlert('success', 'Assignment deleted.');
      await loadAssignments(sectionId);
    }
  }

  if (loading) return <PageSpinner />;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Assignments"
        subtitle="Create, publish, and manage assignments"
        gradient="from-teal-600 to-emerald-500"
      >
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> New Assignment
        </Button>
      </PageHeader>

      <AlertList alerts={alerts} />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <Card>
          <Select
            label="Section"
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            options={sections.map((s) => ({
              value: s.id,
              label: `${s.courses?.name ?? ''} \u2014 ${s.section_name} (${s.semester})`,
            }))}
          />
        </Card>
      </motion.div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card title={editingId ? 'Edit Assignment' : 'New Assignment'}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input
                  label="Title"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Week 4 Problem Set"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <Textarea
                  label="Description"
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Assignment details, instructions, etc."
                  rows={3}
                />
              </div>
              <Input
                label="File URL (optional)"
                value={form.file_url}
                onChange={(e) => setForm((p) => ({ ...p, file_url: e.target.value }))}
                placeholder="https://example.com/assignment.pdf"
                hint="Upload to a storage service and paste the link"
              />
              <Input
                label="Due Date & Time"
                type="datetime-local"
                value={form.due_date}
                onChange={(e) => setForm((p) => ({ ...p, due_date: e.target.value }))}
              />
              <Input
                label="Max Marks"
                type="number"
                min={1}
                value={form.max_marks}
                onChange={(e) => setForm((p) => ({ ...p, max_marks: parseInt(e.target.value) || 100 }))}
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={resetForm} className="rounded-xl font-semibold">Cancel</Button>
              <Button onClick={handleSave} loading={saving} className="gap-2 rounded-xl font-semibold">
                <Save className="h-4 w-4" /> {editingId ? 'Update' : 'Create'}
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {dataLoading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex justify-center py-12"
        >
          <Spinner label="Loading assignments..." />
        </motion.div>
      ) : !sectionId ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-16 shadow-sm"
        >
          <FileText className="mb-2 h-10 w-10 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">Select a section to manage assignments.</p>
        </motion.div>
      ) : assignments.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-16 shadow-sm"
        >
          <FileText className="mb-2 h-10 w-10 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">No assignments yet. Click &quot;New Assignment&quot; to create one.</p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="grid gap-3"
        >
          {assignments.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.05, duration: 0.3 }}
            >
              <Card>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-1.5 flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{a.title}</h3>
                      <Badge variant={a.published ? 'success' : 'warning'}>
                        {a.published ? 'Published' : 'Draft'}
                      </Badge>
                    </div>
                    {a.description && (
                      <p className="mb-2 text-sm leading-relaxed text-gray-600 line-clamp-2">{a.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-gray-500">
                      <span className="flex items-center gap-1">
                        <Award className="h-3 w-3" />
                        Max: {a.max_marks}
                      </span>
                      {a.due_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Due: {new Date(a.due_date).toLocaleString()}
                        </span>
                      )}
                      {a.file_url && (
                        <a
                          href={a.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 font-semibold text-brand-600 hover:underline"
                        >
                          <Link className="h-3 w-3" /> Attachment
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button variant="ghost" onClick={() => startEdit(a)} className="h-8 w-8 rounded-lg p-0">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => togglePublish(a)}
                      className="h-8 w-8 rounded-lg p-0"
                      title={a.published ? 'Unpublish' : 'Publish'}
                    >
                      {a.published ? <XCircle className="h-4 w-4 text-amber-500" /> : <CheckCircle2 className="h-4 w-4 text-green-500" />}
                    </Button>
                    <Button variant="ghost" onClick={() => handleDelete(a.id)} className="h-8 w-8 rounded-lg p-0 text-red-500 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

function Award(props: { className?: string }) {
  return (
    <svg className={props.className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
    </svg>
  );
}
