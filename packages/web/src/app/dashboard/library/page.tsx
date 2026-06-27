'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/form-field';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { createClient } from '@/lib/supabase/client';

interface LibraryHit {
  id: string;
  title: string;
  author: string;
  isbn: string;
  publisher: string | null;
  category: string;
  total_copies: number;
  available_copies: number;
}

export default function LibrarySearchPage() {
  const supabase = createClient();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LibraryHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const performSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }

    setSearching(true);
    setSearched(true);

    // Option A: Full-text search via textSearch (if tsv column + GIN index active)
    let data: LibraryHit[] | null = null;

    if (/^[a-zA-Z0-9\s-]+$/.test(trimmed)) {
      const { data: fts } = await supabase
        .from('library_items')
        .select('id, title, author, isbn, publisher, category, total_copies, available_copies')
        .textSearch('tsv', trimmed, { type: 'websearch', config: 'english' })
        .limit(20);
      data = fts;
    }

    // Fallback / override: ILIKE search
    if (!data || data.length === 0) {
      const pattern = `%${trimmed}%`;
      const { data: ilike } = await supabase
        .from('library_items')
        .select('id, title, author, isbn, publisher, category, total_copies, available_copies')
        .or(`title.ilike.${pattern},author.ilike.${pattern},isbn.ilike.${pattern}`)
        .limit(20);
      data = ilike;
    }

    setResults((data ?? []) as LibraryHit[]);
    setSearching(false);
  }, [supabase]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => performSearch(query), 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query, performSearch]);

  return (
    <div className="mx-auto max-w-4xl px-0 sm:px-2">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Library Catalog Search</h1>
        <p className="mt-1 text-sm text-gray-500">Search the library collection by title, author, or ISBN</p>
      </div>

      <Card className="mb-6 overflow-hidden">
        <Input
          label="Search the catalog"
          placeholder="Search by title, author, or ISBN..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          hint="Full-text search across title, author, and ISBN fields"
        />
      </Card>

      {searching && (
        <div className="flex justify-center py-12">
          <Spinner label="Searching..." />
        </div>
      )}

      {!searching && searched && results.length === 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-12 shadow-sm">
          <p className="text-center text-sm text-gray-400">
            No results found for &quot;{query}&quot;.
          </p>
        </div>
      )}

      {!searching && results.length > 0 && (
        <div className="flex flex-col gap-4">
          <p className="text-sm font-medium text-gray-500">{results.length} result{results.length > 1 ? 's' : ''}</p>
          {results.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900">{item.title}</h3>
                  <p className="mt-0.5 text-sm text-gray-500">{item.author}</p>
                  {item.publisher && <p className="mt-0.5 text-xs text-gray-400">{item.publisher}</p>}
                  <p className="mt-1 text-xs text-gray-400">ISBN: <span className="font-mono">{item.isbn}</span></p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <Badge variant={item.available_copies > 0 ? 'success' : 'error'}>
                    {item.available_copies} / {item.total_copies} available
                  </Badge>
                  <span className="text-xs font-medium text-gray-400">{item.category}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
