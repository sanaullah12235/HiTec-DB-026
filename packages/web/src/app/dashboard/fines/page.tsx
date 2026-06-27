'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Alert, AlertList } from '@/components/ui/alert';
import { PageSpinner } from '@/components/ui/spinner';
import { createClient } from '@/lib/supabase/client';
import { DollarSign, BookOpen, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface FineRecord {
  id: string;
  issue_id: string;
  amount: number;
  days_overdue: number;
  paid: boolean;
  paid_at: string | null;
  created_at: string;
  library_issues: {
    issued_at: string;
    due_date: string;
    returned_at: string | null;
    status: string;
    students: { name: string; email: string };
    library_items: { title: string; author: string };
  };
}

export default function FinesOverviewPage() {
  const supabase = createClient();
  const [fines, setFines] = useState<FineRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<{ id: string; variant?: 'info' | 'success' | 'warning' | 'error'; message: string }[]>([]);
  const [payingId, setPayingId] = useState<string | null>(null);

  useEffect(() => {
    loadFines();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadFines() {
    setLoading(true);
    const { data } = await supabase
      .from('library_fines')
      .select('*, library_issues!inner(issued_at, due_date, returned_at, status, students!inner(name, email), library_items!inner(title, author))')
      .order('created_at', { ascending: false });
    setFines(data as FineRecord[] ?? []);
    setLoading(false);
  }

  async function markPaid(id: string) {
    setPayingId(id);
    const { error } = await supabase
      .from('library_fines')
      .update({ paid: true, paid_at: new Date().toISOString() })
      .eq('id', id);
    if (error) {
      setAlerts([{ id: 'err', variant: 'error', message: error.message }]);
    } else {
      setAlerts([{ id: 'ok', variant: 'success', message: 'Fine marked as paid.' }]);
      loadFines();
    }
    setPayingId(null);
  }

  const unpaidFines = fines.filter((f) => !f.paid);
  const outstandingTotal = unpaidFines.reduce((sum, f) => sum + f.amount, 0);

  if (loading) return <PageSpinner />;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="animate-fade-up flex items-center gap-4">
        <Link href="/dashboard/librarian">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            <span className="text-gradient from-amber-600 to-amber-400">Fines Overview</span>
          </h1>
          <p className="mt-1 text-sm text-gray-500">Quick access to all library fines</p>
        </div>
      </div>

      <AlertList alerts={alerts} />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="animate-fade-up animate-delay-100 rounded-2xl border border-gray-100 bg-white p-4 sm:p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500">Recorded Fines</p>
              <p className="mt-1 text-3xl font-bold text-amber-600">{fines.length}</p>
            </div>
            <div className="rounded-xl bg-amber-500/10 p-3">
              <BookOpen className="h-5 w-5 text-amber-500" />
            </div>
          </div>
        </div>

        <div className="animate-fade-up animate-delay-200 rounded-2xl border border-gray-100 bg-white p-4 sm:p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500">Unpaid Fines</p>
              <p className="mt-1 text-3xl font-bold text-amber-600">{unpaidFines.length}</p>
            </div>
            <div className="rounded-xl bg-amber-500/10 p-3">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
          </div>
        </div>

        <div className="animate-fade-up animate-delay-300 rounded-2xl border border-gray-100 bg-white p-4 sm:p-6 shadow-sm hover:shadow-md transition-all">
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
          <div className="flex items-center gap-2 border-b border-gray-100 px-4 sm:px-6 py-4">
            <DollarSign className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-gray-900">Fines Record</h2>
          </div>
          <div className="p-1">
            <DataTable
              columns={[
                { key: 'student', header: 'Student', render: (r) => {
                  const li = r.library_issues as Record<string, unknown> | undefined;
                  const s = li?.students as Record<string, unknown> | undefined;
                  return (s?.name as string) ?? '-';
                }},
                { key: 'book', header: 'Book', render: (r) => {
                  const li = r.library_issues as Record<string, unknown> | undefined;
                  const lib = li?.library_items as Record<string, unknown> | undefined;
                  return (lib?.title as string) ?? '-';
                }},
                { key: 'due', header: 'Due Date', render: (r) => {
                  const li = r.library_issues as Record<string, unknown> | undefined;
                  return new Date(li?.due_date as string).toLocaleDateString();
                }},
                { key: 'returned', header: 'Returned', render: (r) => {
                  const li = r.library_issues as Record<string, unknown> | undefined;
                  const returned = li?.returned_at as string | null | undefined;
                  return returned ? new Date(returned).toLocaleDateString() : '-';
                }},
                { key: 'days', header: 'Days Overdue', render: (r) => {
                  const f = r as unknown as FineRecord;
                  return <span className="font-medium text-red-600">{f.days_overdue}d</span>;
                }},
                { key: 'amount', header: 'Fine (PKR)', render: (r) => {
                  const f = r as unknown as FineRecord;
                  return <span className="font-medium text-red-600">{f.amount.toLocaleString()}</span>;
                }},
                { key: 'paid', header: 'Status', render: (r) => {
                  const f = r as unknown as FineRecord;
                  return f.paid ? <Badge variant="success">Paid</Badge> : <Badge variant="error">Unpaid</Badge>;
                }},
                { key: 'actions', header: 'Actions', render: (r) => {
                  const f = r as unknown as FineRecord;
                  if (f.paid) return <span className="text-xs text-gray-400">-</span>;
                  return (
                    <Button
                      variant="primary"
                      size="sm"
                      loading={payingId === f.id}
                      onClick={() => markPaid(f.id)}
                    >
                      Mark Paid
                    </Button>
                  );
                }},
              ]}
              data={fines as unknown as Record<string, unknown>[]}
              keyExtractor={(r) => (r as unknown as FineRecord).id}
              emptyMessage="No fines recorded."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
