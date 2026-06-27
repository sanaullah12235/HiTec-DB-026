'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/form-field';
import { DataTable } from '@/components/ui/data-table';
import { Alert, AlertList } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';

interface Student { id: string; name: string; email: string; }
interface Book { id: string; title: string; author: string; isbn: string; available_copies: number; }
interface Issue { id: string; student_id: string; item_id: string; issued_at: string; due_date: string; returned_at: string | null; status: string; library_items?: Book; students?: Student; }

export default function CirculationPage() {
  const supabase = createClient();
  const [alerts, setAlerts] = useState<{ id: string; variant?: 'info' | 'success' | 'warning' | 'error'; message: string }[]>([]);
  const addAlert = useCallback((v: 'info' | 'success' | 'warning' | 'error', m: string) => setAlerts((p) => [...p, { id: `${Date.now()}`, variant: v, message: m }]), []);

  // Issue form
  const [studentSearch, setStudentSearch] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [bookSearch, setBookSearch] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [dueDate, setDueDate] = useState(() => { const d = new Date(); d.setDate(d.getDate() + 14); return d.toISOString().slice(0, 10); });

  // Return form
  const [returnMode, setReturnMode] = useState<'id' | 'isbn'>('id');
  const [issueId, setIssueId] = useState('');
  const [returnIsbn, setReturnIsbn] = useState('');
  const [returnStudentSearch, setReturnStudentSearch] = useState('');
  const [returnStudents, setReturnStudents] = useState<Student[]>([]);
  const [returnStudent, setReturnStudent] = useState<Student | null>(null);
  const [foundIssue, setFoundIssue] = useState<Issue | null>(null);

  // History
  const [historyStudent, setHistoryStudent] = useState('');
  const [historyResults, setHistoryResults] = useState<Issue[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Search students for issue
  useEffect(() => {
    if (studentSearch.length < 2) { setStudents([]); return; }
    const t = setTimeout(async () => {
      const { data } = await supabase.from('students').select('id, name, email').ilike('name', `%${studentSearch}%`).limit(10);
      setStudents(data ?? []);
    }, 300);
    return () => clearTimeout(t);
  }, [studentSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Search books for issue
  useEffect(() => {
    if (bookSearch.length < 2) { setBooks([]); return; }
    const t = setTimeout(async () => {
      const { data } = await supabase.from('library_items').select('id, title, author, isbn, available_copies').gt('available_copies', 0).or(`title.ilike.%${bookSearch}%,author.ilike.%${bookSearch}%,isbn.ilike.%${bookSearch}%`).limit(10);
      setBooks(data ?? []);
    }, 300);
    return () => clearTimeout(t);
  }, [bookSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Search students for return
  useEffect(() => {
    if (returnStudentSearch.length < 2) { setReturnStudents([]); return; }
    const t = setTimeout(async () => {
      const { data } = await supabase.from('students').select('id, name, email').ilike('name', `%${returnStudentSearch}%`).limit(10);
      setReturnStudents(data ?? []);
    }, 300);
    return () => clearTimeout(t);
  }, [returnStudentSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleIssue() {
    if (!selectedStudent || !selectedBook) return;
    const { error } = await supabase.from('library_issues').insert({
      student_id: selectedStudent.id,
      item_id: selectedBook.id,
      due_date: dueDate,
      status: 'issued',
    });
    if (error) { addAlert('error', error.message); return; }
    await supabase.from('library_items').update({ available_copies: selectedBook.available_copies - 1 }).eq('id', selectedBook.id);
    addAlert('success', `Issued "${selectedBook.title}" to ${selectedStudent.name}`);
    setSelectedStudent(null); setSelectedBook(null); setStudentSearch(''); setBookSearch(''); setStudents([]); setBooks([]);
  }

  async function searchIssue() {
    setFoundIssue(null);
    if (returnMode === 'id') {
      const { data } = await supabase.from('library_issues').select('*, library_items(*), students(*)').eq('id', issueId).eq('status', 'issued').single();
      if (data) setFoundIssue(data as unknown as Issue); else addAlert('warning', 'No active issue found with that ID.');
    } else {
      if (!returnStudent) { addAlert('warning', 'Select a student first.'); return; }
      const { data: book } = await supabase.from('library_items').select('id').eq('isbn', returnIsbn).single();
      if (!book) { addAlert('warning', 'Book not found by ISBN.'); return; }
      const { data } = await supabase.from('library_issues').select('*, library_items(*), students(*)').eq('student_id', returnStudent.id).eq('item_id', book.id).eq('status', 'issued').maybeSingle();
      if (data) setFoundIssue(data as unknown as Issue); else addAlert('warning', 'No active issue for this student + ISBN combination.');
    }
  }

  async function handleReturn() {
    if (!foundIssue) return;
    const now = new Date();
    const due = new Date(foundIssue.due_date);
    const daysOverdue = Math.max(0, Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)));
    const fine = daysOverdue * 50;

    const { error } = await supabase.from('library_issues').update({ returned_at: now.toISOString(), status: 'returned' }).eq('id', foundIssue.id);
    if (error) { addAlert('error', error.message); return; }
    await supabase.from('library_items').update({ available_copies: (foundIssue.library_items?.available_copies ?? 0) + 1 }).eq('id', foundIssue.item_id);

    if (fine > 0) {
      await supabase.from('library_fines').insert({ issue_id: foundIssue.id, amount: fine, days_overdue: daysOverdue });
      addAlert('warning', `Returned. Fine: PKR ${fine} (${daysOverdue} days overdue @ PKR 50/day)`);
    } else {
      addAlert('success', 'Book returned on time. No fine.');
    }
    setFoundIssue(null); setIssueId(''); setReturnIsbn(''); setReturnStudent(null); setReturnStudentSearch('');
  }

  async function loadHistory() {
    if (historyStudent.length < 2) return;
    setShowHistory(true);
    const { data: s } = await supabase.from('students').select('id').ilike('name', `%${historyStudent}%`).limit(1);
    if (!s || s.length === 0) { setHistoryResults([]); return; }
    const { data } = await supabase.from('library_issues').select('*, library_items(title, author), students(name)').eq('student_id', s[0].id).order('issued_at', { ascending: false }).limit(20);
    setHistoryResults(data as unknown as Issue[] ?? []);
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold text-gray-900">Circulation</h1>
      <AlertList alerts={alerts} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Issue Book" className="h-full">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Input label="Search Student" value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} placeholder="Type student name..." />
              {students.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-xl border border-gray-100 bg-white shadow-lg">
                  {students.map((s) => (
                    <button key={s.id} onClick={() => { setSelectedStudent(s); setStudentSearch(s.name); setStudents([]); }} className="w-full px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl">{s.name} ({s.email})</button>
                  ))}
                </div>
              )}
            </div>
            {selectedStudent && <p className="text-xs font-medium text-green-600">Selected: {selectedStudent.name}</p>}

            <div className="relative">
              <Input label="Search Book" value={bookSearch} onChange={(e) => setBookSearch(e.target.value)} placeholder="Type book title..." />
              {books.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-xl border border-gray-100 bg-white shadow-lg">
                  {books.map((b) => (
                    <button key={b.id} onClick={() => { setSelectedBook(b); setBookSearch(b.title); setBooks([]); }} className="w-full px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl">{b.title} — {b.author} ({b.available_copies} avail)</button>
                  ))}
                </div>
              )}
            </div>
            {selectedBook && <p className="text-xs font-medium text-green-600">Selected: {selectedBook.title}</p>}

            <Input label="Due Date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            <Button onClick={handleIssue} disabled={!selectedStudent || !selectedBook} className="w-full">Issue Book</Button>
          </div>
        </Card>

        <Card title="Return Book" className="h-full">
          <div className="flex gap-2 mb-4">
            <button onClick={() => setReturnMode('id')} className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${returnMode === 'id' ? 'bg-indigo-100 text-indigo-700 shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>By Issue ID</button>
            <button onClick={() => setReturnMode('isbn')} className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${returnMode === 'isbn' ? 'bg-indigo-100 text-indigo-700 shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>By ISBN + Student</button>
          </div>

          <div className="flex flex-col gap-4">
            {returnMode === 'id' ? (
              <Input label="Issue ID" value={issueId} onChange={(e) => setIssueId(e.target.value)} placeholder="UUID of the issue" />
            ) : (
              <>
                <div className="relative">
                  <Input label="Search Student" value={returnStudentSearch} onChange={(e) => setReturnStudentSearch(e.target.value)} placeholder="Type student name..." />
                  {returnStudents.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
                      {returnStudents.map((s) => (
                        <button key={s.id} onClick={() => { setReturnStudent(s); setReturnStudentSearch(s.name); setReturnStudents([]); }} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50">{s.name}</button>
                      ))}
                    </div>
                  )}
                </div>
                <Input label="ISBN" value={returnIsbn} onChange={(e) => setReturnIsbn(e.target.value)} placeholder="Book ISBN" />
              </>
            )}
            <Button variant="outline" onClick={searchIssue} className="w-full">Look Up</Button>

            {foundIssue && (
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-900">{foundIssue.library_items?.title}</p>
                <p className="mt-1 text-xs text-gray-500">Issue ID: {foundIssue.id.slice(0, 8)}...</p>
                <p className="text-xs text-gray-500">Due: {new Date(foundIssue.due_date).toLocaleDateString()}</p>
                {new Date(foundIssue.due_date) < new Date() && <p className="mt-1 text-xs font-bold text-red-600">OVERDUE</p>}
                <Button className="mt-3 w-full" onClick={handleReturn}>Confirm Return</Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card title="User Issuance History" className="overflow-hidden">
        <div className="mb-4 flex gap-2">
          <div className="flex-1">
            <Input label="" value={historyStudent} onChange={(e) => setHistoryStudent(e.target.value)} placeholder="Search student name..." />
          </div>
          <Button variant="outline" className="self-end shrink-0" onClick={loadHistory}>Search</Button>
        </div>
        {showHistory && (
          <DataTable
            columns={[
              { key: 'book', header: 'Book', render: (r) => (r.library_items as Record<string, unknown>)?.title as string ?? '-' },
              { key: 'issued', header: 'Issued', render: (r) => new Date(r.issued_at as string).toLocaleDateString() },
              { key: 'due', header: 'Due', render: (r) => new Date(r.due_date as string).toLocaleDateString() },
              { key: 'returned', header: 'Returned', render: (r) => r.returned_at ? new Date(r.returned_at as string).toLocaleDateString() : '-' },
              { key: 'status', header: 'Status', render: (r) => {
                const s = r.status as string;
                const isOverdue = s === 'issued' && new Date(r.due_date as string) < new Date();
                return <Badge variant={s === 'returned' ? 'success' : isOverdue ? 'error' : 'info'}>{isOverdue ? 'overdue' : s}</Badge>;
              }},
              { key: 'fine', header: 'Fine', render: (r) => {
                if (r.status === 'returned' && r.returned_at && new Date(r.returned_at as string) > new Date(r.due_date as string)) {
                  const days = Math.floor((new Date(r.returned_at as string).getTime() - new Date(r.due_date as string).getTime()) / (1000 * 60 * 60 * 24));
                  return <span className="text-red-600">PKR {days * 50}</span>;
                }
                if (r.status === 'issued' && new Date(r.due_date as string) < new Date()) {
                  const days = Math.floor((new Date().getTime() - new Date(r.due_date as string).getTime()) / (1000 * 60 * 60 * 24));
                  return <span className="text-red-600">PKR {days * 50}</span>;
                }
                return <span className="text-green-600">-</span>;
              }},
            ]}
            data={historyResults as unknown as Record<string, unknown>[]}
            keyExtractor={(r) => r.id as string}
            emptyMessage="No issues found."
          />
        )}
      </Card>
    </div>
  );
}
