'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { PageSpinner } from '@/components/ui/spinner';
import { PageHeader } from '@/components/ui/page-header';
import { AnimatedCard } from '@/components/ui/animated-card';
import { createClient } from '@/lib/supabase/client';

interface LibraryIssue {
  id: string;
  issued_at: string;
  due_date: string;
  returned_at: string | null;
  status: string;
  library_items: { title: string; author: string };
}

export default function StudentLibraryPage() {
  const supabase = createClient();
  const [issues, setIssues] = useState<LibraryIssue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: student } = await supabase.from('students').select('id').eq('email', user.email!).maybeSingle();
      if (!student) { setLoading(false); return; }

      const { data } = await supabase
        .from('library_issues')
        .select('*, library_items(title, author)')
        .eq('student_id', student.id)
        .order('issued_at', { ascending: false });

      setIssues(data as LibraryIssue[] ?? []);
      setLoading(false);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function calcFine(issue: LibraryIssue): number {
    const due = new Date(issue.due_date);
    const end = issue.returned_at ? new Date(issue.returned_at) : new Date();
    if (end > due) {
      return Math.floor((end.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)) * 50;
    }
    return 0;
  }

  if (loading) return <PageSpinner />;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="My Library Books" subtitle="View your borrowed books and manage checkouts">
        <a href="/dashboard/library"><Button variant="outline">Search Catalog</Button></a>
      </PageHeader>

      <AnimatedCard delay={0}>
        <DataTable
          columns={[
            { key: 'title', header: 'Title', render: (r) => (r.library_items as Record<string, unknown>)?.title as string ?? '-' },
            { key: 'author', header: 'Author', render: (r) => (r.library_items as Record<string, unknown>)?.author as string ?? '-' },
            { key: 'issued', header: 'Issued', render: (r) => new Date(r.issued_at as string).toLocaleDateString() },
            { key: 'due', header: 'Due', render: (r) => new Date(r.due_date as string).toLocaleDateString() },
            { key: 'status', header: 'Status', render: (r) => {
              const s = r.status as string;
              const overdue = s === 'issued' && new Date(r.due_date as string) < new Date();
              return <Badge variant={s === 'returned' ? 'success' : overdue ? 'error' : 'info'}>{overdue ? 'overdue' : s}</Badge>;
            }},
            { key: 'fine', header: 'Fine', render: (r) => {
              const fine = calcFine(r as unknown as LibraryIssue);
              return fine > 0 ? <span className="font-medium text-red-600">PKR {fine}</span> : <span className="text-gray-400">-</span>;
            }},
          ]}
          data={issues as unknown as Record<string, unknown>[]}
          keyExtractor={(r) => r.id as string}
          emptyMessage="No books issued. Visit the library catalog to borrow books."
        />
      </AnimatedCard>
    </div>
  );
}
