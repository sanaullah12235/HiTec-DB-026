'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Alert, AlertList } from '@/components/ui/alert';
import { PageSpinner } from '@/components/ui/spinner';
import { createClient } from '@/lib/supabase/client';
import { DollarSign, BookOpen, AlertTriangle } from 'lucide-react';

interface LibraryIssue {
  id: string;
  student_id: string;
  issued_at: string;
  due_date: string;
  returned_at: string | null;
  status: string;
  fine_paid: boolean;
  library_items: { title: string; author: string };
  students: { name: string; email: string };
}

export default function LibrarianFinesPage() {
  const supabase = createClient();
  const [issues, setIssues] = useState<LibraryIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<{ id: string; variant?: 'info' | 'success' | 'warning' | 'error'; message: string }[]>([]);
  const [payingId, setPayingId] = useState<string | null>(null);

  useEffect(() => {
    loadIssues();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadIssues() {
    setLoading(true);
    const { data } = await supabase
      .from('library_issues')
      .select('*, library_items(title, author), students(name, email)')
      .order('issued_at', { ascending: false });
    setIssues(data as LibraryIssue[] ?? []);
    setLoading(false);
  }

  function calcFine(issue: LibraryIssue): number {
    const due = new Date(issue.due_date);
    const end = issue.returned_at ? new Date(issue.returned_at) : new Date();
    if (end > due) {
      return Math.floor((end.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)) * 50;
    }
    return 0;
  }

  function daysOverdue(issue: LibraryIssue): number {
    const due = new Date(issue.due_date);
    const end = issue.returned_at ? new Date(issue.returned_at) : new Date();
    if (end > due) {
      return Math.floor((end.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    }
    return 0;
  }

  async function markPaid(id: string) {
    setPayingId(id);
    const { error } = await supabase
      .from('library_issues')
      .update({ fine_paid: true })
      .eq('id', id);
    if (error) {
      setAlerts([{ id: 'error', variant: 'error', message: error.message }]);
    } else {
      setAlerts([{ id: 'success', variant: 'success', message: 'Fine marked as paid.' }]);
      loadIssues();
    }
    setPayingId(null);
  }

  const outstandingTotal = issues
    .filter((i) => i.status === 'issued' && !i.fine_paid)
    .reduce((sum, i) => sum + calcFine(i), 0);

  if (loading) return <PageSpinner />;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="animate-fade-up">
        <h1 className="text-3xl font-bold text-gray-900">
          <span className="text-gradient from-amber-600 to-amber-400">Library Fines</span>
        </h1>
        <p className="mt-1 text-sm text-gray-500">Manage overdue fines & payments</p>
      </div>

      <AlertList alerts={alerts} />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="animate-fade-up animate-delay-100 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500">Overdue Items</p>
              <p className="mt-1 text-3xl font-bold text-red-600">
                {issues.filter((i) => i.status === 'issued' && new Date(i.due_date) < new Date()).length}
              </p>
            </div>
            <div className="rounded-xl bg-red-500/10 p-3">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
          </div>
        </div>

        <div className="animate-fade-up animate-delay-200 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500">Unpaid Fines</p>
              <p className="mt-1 text-3xl font-bold text-amber-600">
                {issues.filter((i) => !i.fine_paid && calcFine(i) > 0).length}
              </p>
            </div>
            <div className="rounded-xl bg-amber-500/10 p-3">
              <BookOpen className="h-5 w-5 text-amber-500" />
            </div>
          </div>
        </div>

        <div className="animate-fade-up animate-delay-300 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500">Total Outstanding</p>
              <p className="mt-1 text-3xl font-bold text-amber-600">PKR {outstandingTotal.toLocaleString()}</p>
            </div>
            <div className="rounded-xl bg-amber-500/10 p-3">
              <DollarSign className="h-5 w-5 text-amber-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Fines Table */}
      <div className="animate-fade-up animate-delay-400">
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 border-b border-gray-100 px-6 py-4">
            <DollarSign className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-gray-900">All Issues & Fines</h2>
          </div>
          <div className="p-1">
            <DataTable
              columns={[
                { key: 'student', header: 'Student', render: (r) => (r.students as Record<string, unknown>)?.name as string ?? '-' },
                { key: 'book', header: 'Book', render: (r) => (r.library_items as Record<string, unknown>)?.title as string ?? '-' },
                { key: 'issued', header: 'Issued', render: (r) => new Date(r.issued_at as string).toLocaleDateString() },
                { key: 'due', header: 'Due', render: (r) => new Date(r.due_date as string).toLocaleDateString() },
                { key: 'status', header: 'Status', render: (r) => {
                  const s = r.status as string;
                  const overdue = s === 'issued' && new Date(r.due_date as string) < new Date();
                  return <Badge variant={s === 'returned' ? 'success' : overdue ? 'error' : 'info'}>{overdue ? 'overdue' : s}</Badge>;
                }},
                { key: 'days_overdue', header: 'Days Overdue', render: (r) => {
                  const issue = r as unknown as LibraryIssue;
                  const d = daysOverdue(issue);
                  return d > 0 ? <span className="font-medium text-red-600">{d}d</span> : <span className="text-gray-400">-</span>;
                }},
                { key: 'fine', header: 'Fine (PKR)', render: (r) => {
                  const issue = r as unknown as LibraryIssue;
                  const fine = calcFine(issue);
                  return fine > 0 ? <span className="font-medium text-red-600">{fine.toLocaleString()}</span> : <span className="text-gray-400">0</span>;
                }},
                { key: 'fine_paid', header: 'Fine Paid', render: (r) => {
                  const fp = r.fine_paid as boolean;
                  return fp ? <Badge variant="success">Paid</Badge> : <Badge variant="error">Unpaid</Badge>;
                }},
                { key: 'actions', header: 'Actions', render: (r) => {
                  const issue = r as unknown as LibraryIssue;
                  const fine = calcFine(issue);
                  if (issue.fine_paid || fine === 0) return <span className="text-xs text-gray-400">-</span>;
                  return (
                    <Button
                      variant="primary"
                      size="sm"
                      loading={payingId === issue.id}
                      onClick={() => markPaid(issue.id)}
                    >
                      Mark Paid
                    </Button>
                  );
                }},
              ]}
              data={issues as unknown as Record<string, unknown>[]}
              keyExtractor={(r) => r.id as string}
              emptyMessage="No library issues found."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
