'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/form-field';
import { DataTable } from '@/components/ui/data-table';
import { Alert, AlertList } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { useSearchParams } from 'next/navigation';

interface LibraryItem {
  id: string;
  title: string;
  author: string;
  isbn: string;
  publisher: string | null;
  category: string;
  total_copies: number;
  available_copies: number;
}

export default function InventoryPage() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [results, setResults] = useState<LibraryItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [alerts, setAlerts] = useState<{ id: string; variant?: 'info' | 'success' | 'warning' | 'error'; message: string }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', author: '', isbn: '', publisher: '', category: 'Textbook', total_copies: '1' });
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const addAlert = useCallback((v: 'info' | 'success' | 'warning' | 'error', m: string) => setAlerts((p) => [...p, { id: `${Date.now()}`, variant: v, message: m }]), []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => performSearch(query), 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  async function performSearch(q: string) {
    const trimmed = q.trim();
    if (trimmed.length < 2) { setResults([]); return; }
    setSearching(true);

    let data: LibraryItem[] | null = null;
    const { data: fts } = await supabase
      .from('library_items')
      .select('*')
      .textSearch('tsv', trimmed, { type: 'websearch', config: 'english' })
      .limit(20);
    data = fts;

    if (!data || data.length === 0) {
      const pattern = `%${trimmed}%`;
      const { data: ilike } = await supabase
        .from('library_items')
        .select('*')
        .or(`title.ilike.${pattern},author.ilike.${pattern},isbn.ilike.${pattern}`)
        .limit(20);
      data = ilike;
    }

    setResults(data ?? []);
    setSearching(false);
  }

  function openAdd() { setEditId(null); setForm({ title: '', author: '', isbn: '', publisher: '', category: 'Textbook', total_copies: '1' }); setShowForm(true); }

  function openEdit(item: LibraryItem) { setEditId(item.id); setForm({ title: item.title, author: item.author, isbn: item.isbn, publisher: item.publisher ?? '', category: item.category, total_copies: String(item.total_copies) }); setShowForm(true); }

  async function handleSave() {
    const newTotal = parseInt(form.total_copies);
    if (isNaN(newTotal) || newTotal < 1) { addAlert('error', 'Total copies must be at least 1.'); return; }
    const payload = { title: form.title, author: form.author, isbn: form.isbn, publisher: form.publisher || null, category: form.category, total_copies: newTotal };
    if (!editId) {
      const { error } = await supabase.from('library_items').insert({ ...payload, available_copies: newTotal });
      if (error) { addAlert('error', error.message); return; }
      addAlert('success', 'Book added.');
    } else {
      const current = results.find((r) => r.id === editId);
      const avail = current ? Math.min(current.available_copies, newTotal) : newTotal;
      const { error } = await supabase.from('library_items').update({ ...payload, available_copies: avail }).eq('id', editId);
      if (error) { addAlert('error', error.message); return; }
      addAlert('success', 'Book updated.');
    }
    setShowForm(false);
    await performSearch(query);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this book?')) return;
    const { error } = await supabase.from('library_items').delete().eq('id', id);
    if (error) { addAlert('error', error.message); return; }
    addAlert('success', 'Book deleted.');
    await performSearch(query);
  }

  const categories = ['Textbook', 'Reference', 'Fiction', 'Journal', 'Magazine'];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Library Inventory</h1>
        <Button onClick={openAdd} className="shadow-md">Add Book</Button>
      </div>

      <AlertList alerts={alerts} />

      <Input label="" placeholder="Search by title, author, or ISBN..." value={query} onChange={(e) => setQuery(e.target.value)} />

      {searching ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          <p className="text-center text-sm text-gray-400">Searching...</p>
        </div>
      ) : results.length === 0 && query.length >= 2 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          <p className="text-center text-sm text-gray-400">No results for &quot;{query}&quot;.</p>
        </div>
      ) : results.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          <p className="text-center text-sm text-gray-400">Type at least 2 characters to search.</p>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <DataTable
            columns={[
              { key: 'title', header: 'Title' },
              { key: 'author', header: 'Author' },
              { key: 'isbn', header: 'ISBN' },
              { key: 'category', header: 'Category', render: (r) => <Badge>{r.category as string}</Badge> },
              { key: 'copies', header: 'Copies', render: (r) => <span>{r.available_copies as number}/{r.total_copies as number}</span> },
              { key: 'actions', header: '', render: (r) => <div className="flex gap-2"><Button variant="outline" onClick={() => openEdit(r as unknown as LibraryItem)}>Edit</Button><Button variant="danger" onClick={() => handleDelete(r.id as string)}>Delete</Button></div> },
            ]}
            data={results as unknown as Record<string, unknown>[]}
            keyExtractor={(r) => r.id as string}
          />
        </Card>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl animate-fade-up" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-bold text-gray-900">{editId ? 'Edit' : 'Add'} Book</h2>
            <div className="flex flex-col gap-3">
              <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              <Input label="Author" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} required />
              <Input label="ISBN" value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} required />
              <Input label="Publisher" value={form.publisher} onChange={(e) => setForm({ ...form, publisher: e.target.value })} />
              <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} options={categories.map((c) => ({ value: c, label: c }))} />
              <Input label="Total Copies" type="number" value={form.total_copies} onChange={(e) => setForm({ ...form, total_copies: e.target.value })} required />
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
