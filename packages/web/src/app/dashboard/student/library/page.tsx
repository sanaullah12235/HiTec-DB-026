'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/form-field';
import { DataTable } from '@/components/ui/data-table';
import { PageSpinner } from '@/components/ui/spinner';
import { PageHeader } from '@/components/ui/page-header';
import { AnimatedCard } from '@/components/ui/animated-card';
import { createClient } from '@/lib/supabase/client';
import { Search } from 'lucide-react';

interface LibraryIssue {
  id: string;
  issued_at: string;
  due_date: string;
  returned_at: string | null;
  status: string;
  library_items: { title: string; author: string };
}

interface CatalogHit {
  id: string;
  title: string;
  author: string;
  isbn: string;
  publisher: string | null;
  category: string;
  total_copies: number;
  available_copies: number;
}

export default function StudentLibraryPage() {
  const supabase = createClient();
  const [issues, setIssues] = useState<LibraryIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [catalogResults, setCatalogResults] = useState<CatalogHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

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

  const performSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setCatalogResults([]);
      setSearched(false);
      return;
    }
    setSearching(true);
    setSearched(true);

    let data: CatalogHit[] | null = null;
    if (/^[a-zA-Z0-9\s-]+$/.test(trimmed)) {
      const { data: fts } = await supabase
        .from('library_items')
        .select('id, title, author, isbn, publisher, category, total_copies, available_copies')
        .textSearch('tsv', trimmed, { type: 'websearch', config: 'english' })
        .limit(20);
      data = fts;
    }

    if (!data || data.length === 0) {
      const pattern = `%${trimmed}%`;
      const { data: ilike } = await supabase
        .from('library_items')
        .select('id, title, author, isbn, publisher, category, total_copies, available_copies')
        .or(`title.ilike.${pattern},author.ilike.${pattern},isbn.ilike.${pattern}`)
        .limit(20);
      data = ilike;
    }

    setCatalogResults(data ?? []);
    setSearching(false);
  }, [supabase]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => performSearch(query), 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query, performSearch]);

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
      <PageHeader title="My Library Books" subtitle="View your borrowed books and manage checkouts" />

      {/* Catalog Search */}
      <AnimatedCard delay={0}>
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Search className="h-4 w-4 text-amber-500" />
            Search Library Catalog
          </h3>
          <p className="mt-0.5 text-xs text-gray-400">Find books available in the library</p>
        </div>
        <Input
          label=""
          placeholder="Search by title, author, or ISBN..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {searching && <p className="mt-2 text-xs text-gray-400">Searching...</p>}
        {!searching && searched && catalogResults.length === 0 && (
          <p className="mt-2 text-xs text-gray-400">No results found for &quot;{query}&quot;.</p>
        )}
        {!searching && catalogResults.length > 0 && (
          <div className="mt-3 flex flex-col gap-2">
            {catalogResults.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.author}</p>
                  <p className="text-xs text-gray-400">ISBN: {item.isbn}</p>
                </div>
                <Badge variant={item.available_copies > 0 ? 'success' : 'error'}>
                  {item.available_copies}/{item.total_copies}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </AnimatedCard>

      {/* My Issues */}
      <AnimatedCard delay={1}>
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
          emptyMessage="No books issued. Use the search above to find books in the catalog."
        />
      </AnimatedCard>
    </div>
  );
}
