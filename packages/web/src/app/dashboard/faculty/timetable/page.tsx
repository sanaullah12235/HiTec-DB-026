'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, Input } from '@/components/ui/form-field';
import { Badge } from '@/components/ui/badge';
import { AlertList } from '@/components/ui/alert';
import { Spinner, PageSpinner } from '@/components/ui/spinner';
import { PageHeader } from '@/components/ui/page-header';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import {
  Calendar, Clock, Plus, Edit, Trash2, Save, X,
  Building2, Users, ChevronLeft, ChevronRight,
} from 'lucide-react';

interface Section { id: string; section_name: string; semester: string; courses?: { name: string; code: string } }
interface TimetableEntry {
  id: string; section_id: string; day_of_week: number;
  start_time: string; end_time: string; room: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_OPTIONS = DAYS.map((d, i) => ({ value: String(i), label: d }));

const DAY_COLORS: Record<number, string> = {
  0: 'border-l-blue-400', 1: 'border-l-green-400', 2: 'border-l-yellow-400',
  3: 'border-l-purple-400', 4: 'border-l-pink-400', 5: 'border-l-red-400', 6: 'border-l-orange-400',
};

export default function TimetablePage() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const [alerts, setAlerts] = useState<{ id: string; variant?: 'info' | 'success' | 'warning' | 'error'; message: string }[]>([]);
  const addAlert = useCallback((v: 'info' | 'success' | 'warning' | 'error', m: string) => {
    setAlerts((p) => [...p, { id: `${Date.now()}-${Math.random()}`, variant: v, message: m }]);
  }, []);

  const [sections, setSections] = useState<Section[]>([]);
  const [sectionId, setSectionId] = useState(searchParams.get('section_id') ?? '');
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ day_of_week: 0, start_time: '08:00', end_time: '09:00', room: '' });

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data: fac } = await supabase.from('faculty').select('id').eq('email', user.email!).maybeSingle();
      if (!fac) { setLoading(false); return; }
      const { data: secs } = await supabase.from('sections').select('*, courses(name, code)').eq('faculty_id', fac.id);
      setSections(secs ?? []);
      if (searchParams.get('section_id') && secs?.some((s) => s.id === searchParams.get('section_id'))) {
        await loadEntries(searchParams.get('section_id')!);
      }
      setLoading(false);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (sectionId) loadEntries(sectionId);
  }, [sectionId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadEntries(sid: string) {
    setDataLoading(true);
    const { data } = await supabase
      .from('timetable')
      .select('*')
      .eq('section_id', sid)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });
    setEntries(data ?? []);
    setDataLoading(false);
  }

  function resetForm() {
    setForm({ day_of_week: 0, start_time: '08:00', end_time: '09:00', room: '' });
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(e: TimetableEntry) {
    setForm({
      day_of_week: e.day_of_week,
      start_time: e.start_time.slice(0, 5),
      end_time: e.end_time.slice(0, 5),
      room: e.room,
    });
    setEditingId(e.id);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.room.trim()) { addAlert('error', 'Room is required.'); return; }
    if (!sectionId) { addAlert('error', 'No section selected.'); return; }

    setSaving(true);
    const payload = {
      section_id: sectionId,
      day_of_week: form.day_of_week,
      start_time: form.start_time,
      end_time: form.end_time,
      room: form.room.trim(),
    };

    if (editingId) {
      const { error } = await supabase.from('timetable').update(payload).eq('id', editingId);
      if (error) { addAlert('error', `Update failed: ${error.message}`); } else {
        addAlert('success', 'Timetable entry updated.');
        await loadEntries(sectionId);
        resetForm();
      }
    } else {
      const { error } = await supabase.from('timetable').insert(payload);
      if (error) { addAlert('error', `Create failed: ${error.message}`); } else {
        addAlert('success', 'Timetable entry created.');
        await loadEntries(sectionId);
        resetForm();
      }
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this timetable entry?')) return;
    const { error } = await supabase.from('timetable').delete().eq('id', id);
    if (error) { addAlert('error', `Delete failed: ${error.message}`); } else {
      addAlert('success', 'Timetable entry deleted.');
      await loadEntries(sectionId);
    }
  }

  const groupedByDay: Record<number, TimetableEntry[]> = {};
  for (const e of entries) {
    (groupedByDay[e.day_of_week] ??= []).push(e);
  }

  if (loading) return <PageSpinner />;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Timetable"
        subtitle="Manage class schedules per section"
        gradient="from-teal-600 to-emerald-500"
      >
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Add Entry
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
          <Card title={editingId ? 'Edit Timetable Entry' : 'New Timetable Entry'}>
            <div className="grid gap-4 sm:grid-cols-4">
              <Select
                label="Day"
                value={String(form.day_of_week)}
                onChange={(e) => setForm((p) => ({ ...p, day_of_week: parseInt(e.target.value) }))}
                options={DAY_OPTIONS}
              />
              <Input
                label="Start Time"
                type="time"
                value={form.start_time}
                onChange={(e) => setForm((p) => ({ ...p, start_time: e.target.value }))}
              />
              <Input
                label="End Time"
                type="time"
                value={form.end_time}
                onChange={(e) => setForm((p) => ({ ...p, end_time: e.target.value }))}
              />
              <Input
                label="Room"
                value={form.room}
                onChange={(e) => setForm((p) => ({ ...p, room: e.target.value }))}
                placeholder="e.g. Room 301"
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={resetForm} className="rounded-xl font-semibold">Cancel</Button>
              <Button onClick={handleSave} loading={saving} className="gap-2 rounded-xl font-semibold">
                <Save className="h-4 w-4" /> {editingId ? 'Update' : 'Add'}
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
          <Spinner label="Loading timetable..." />
        </motion.div>
      ) : !sectionId ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-16 shadow-sm"
        >
          <Calendar className="mb-2 h-10 w-10 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">Select a section to view the timetable.</p>
        </motion.div>
      ) : entries.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-16 shadow-sm"
        >
          <Calendar className="mb-2 h-10 w-10 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">No timetable entries. Click &quot;Add Entry&quot; to create one.</p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="grid gap-3 md:grid-cols-2 lg:grid-cols-3"
        >
          {DAYS.map((day, dayIdx) => {
            const dayEntries = groupedByDay[dayIdx] ?? [];
            if (dayEntries.length === 0) return null;
            return (
              <motion.div
                key={dayIdx}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + dayIdx * 0.05, duration: 0.3 }}
              >
                <Card className="overflow-hidden">
                  <div className={`border-l-4 px-5 py-3 ${DAY_COLORS[dayIdx] ?? 'border-l-gray-400'}`}>
                    <h3 className="font-semibold text-gray-900">{day}</h3>
                    <p className="text-xs font-medium text-gray-500">{dayEntries.length} class(es)</p>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {dayEntries.map((e) => (
                      <div key={e.id} className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-gray-50">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                            <span className="font-semibold text-gray-700">
                              {e.start_time.slice(0, 5)} - {e.end_time.slice(0, 5)}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs font-medium text-gray-500">
                            <Building2 className="mr-1 inline h-3 w-3" />
                            {e.room}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" onClick={() => startEdit(e)} className="h-7 w-7 rounded-lg p-0">
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" onClick={() => handleDelete(e.id)} className="h-7 w-7 rounded-lg p-0 text-red-500 hover:text-red-700">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
