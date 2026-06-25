'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { AlertList } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';

interface PendingRequest {
  id: string;
  student_id: string;
  section_id: string;
  program_id: string;
  status: string;
  students?: { name: string; email: string };
  sections?: { section_name: string; semester: string; courses?: { name: string; code: string } };
  programs?: { name: string };
}

export default function ApprovalsPage() {
  const supabase = createClient();
  const [alerts, setAlerts] = useState<{ id: string; variant?: 'info' | 'success' | 'warning' | 'error'; message: string }[]>([]);
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadRequests() {
    setLoading(true);
    const { data } = await supabase
      .from('enrollments')
      .select('id, student_id, section_id, enrolled_at, students!inner(name, email), sections!inner(section_name, semester, course_id, courses!inner(name, code))')
      .order('enrolled_at', { ascending: false })
      .limit(50);
    setRequests((data ?? []) as unknown as PendingRequest[]);
    setLoading(false);
  }

  useEffect(() => { loadRequests(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addAlert = (v: 'info' | 'success' | 'warning' | 'error', m: string) => setAlerts((p) => [...p, { id: `${Date.now()}`, variant: v, message: m }]);

  async function handleRemove(id: string) {
    if (!confirm('Remove this enrollment?')) return;
    const { error } = await supabase.from('enrollments').delete().eq('id', id);
    if (error) addAlert('error', error.message);
    else { addAlert('success', 'Enrollment removed.'); await loadRequests(); }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          <span className="text-gradient from-blue-600 to-blue-400">Manage Enrollments</span>
        </h1>
        <p className="mt-1 text-sm text-gray-500">View and remove student enrollments</p>
      </div>
      <AlertList alerts={alerts} />

      {loading ? (
        <p className="py-8 text-center text-sm text-gray-400">Loading...</p>
      ) : (
        <Card>
          <DataTable
            columns={[
              { key: 'student', header: 'Student', render: (r) => (r.students as Record<string, unknown>)?.name as string ?? '-' },
              { key: 'email', header: 'Email', render: (r) => (r.students as Record<string, unknown>)?.email as string ?? '-' },
              { key: 'course', header: 'Course', render: (r) => { const s = r.sections as Record<string, unknown>; const c = s?.courses as Record<string, unknown> | undefined; return c ? `${c.name as string}` : '-'; }},
              { key: 'section', header: 'Section', render: (r) => (r.sections as Record<string, unknown>)?.section_name as string ?? '-' },
              { key: 'actions', header: '', render: (r) => <div className="flex gap-2"><Button variant="danger" onClick={() => handleRemove(r.id as string)}>Remove</Button></div> },
            ]}
            data={requests as unknown as Record<string, unknown>[]}
            keyExtractor={(r) => r.id as string}
            emptyMessage="No enrollments found."
          />
        </Card>
      )}
    </div>
  );
}
