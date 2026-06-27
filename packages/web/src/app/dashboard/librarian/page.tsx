import { createServerSupabaseClient } from '@/lib/supabase/server-client';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { BookOpen, AlertTriangle, BookMarked, Search, Library } from 'lucide-react';

export default async function LibrarianDashboard() {
  const supabase = await createServerSupabaseClient();

  const [totalBooks, overdueItems, activeIssues, recentCirculation] = await Promise.all([
    supabase.from('library_items').select('id', { count: 'exact', head: true }),
    supabase.from('library_issues').select('id', { count: 'exact', head: true }).eq('status', 'issued').lt('due_date', new Date().toISOString().slice(0, 10)),
    supabase.from('library_issues').select('id', { count: 'exact', head: true }).eq('status', 'issued'),
    supabase.from('library_issues').select('*, library_items(title, author), students(name, email)').order('issued_at', { ascending: false }).limit(10),
  ]);

  const overdueCount = overdueItems.count ?? 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="animate-fade-up">
        <h1 className="text-3xl font-bold text-gray-900">
          <span className="text-gradient from-amber-600 to-amber-400">Library Dashboard</span>
        </h1>
        <p className="mt-1 text-sm text-gray-500">Library management & circulation overview</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="animate-fade-up animate-delay-100 rounded-2xl border border-gray-100 bg-white p-4 sm:p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500">Total Books</p>
              <p className="mt-1 text-3xl font-bold text-amber-600">{totalBooks.count ?? 0}</p>
              <p className="mt-0.5 text-xs text-gray-400">In library inventory</p>
            </div>
            <div className="rounded-xl bg-amber-500/10 p-3">
              <BookOpen className="h-5 w-5 text-amber-500" />
            </div>
          </div>
        </div>

        <div className="animate-fade-up animate-delay-200 rounded-2xl border border-gray-100 bg-white p-4 sm:p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500">Active Issues</p>
              <p className="mt-1 text-3xl font-bold text-amber-600">{activeIssues.count ?? 0}</p>
              <p className="mt-0.5 text-xs text-gray-400">Currently borrowed</p>
            </div>
            <div className="rounded-xl bg-amber-500/10 p-3">
              <BookMarked className="h-5 w-5 text-amber-500" />
            </div>
          </div>
        </div>

        <div className="animate-fade-up animate-delay-300 rounded-2xl border border-gray-100 bg-white p-4 sm:p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500">Overdue Items</p>
              <p className={`mt-1 text-3xl font-bold ${overdueCount > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {overdueCount}
              </p>
              <p className="mt-0.5 text-xs text-gray-400">
                {overdueCount > 0 ? 'Needs attention' : 'All clear'}
              </p>
            </div>
            <div className={`rounded-xl p-3 ${overdueCount > 0 ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
              <AlertTriangle className={`h-5 w-5 ${overdueCount > 0 ? 'text-red-500' : 'text-green-500'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Search + Quick actions */}
      <div className="animate-fade-up animate-delay-300 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-6 shadow-sm hover:shadow-md transition-all">
          <div className="mb-4 flex items-center gap-2">
            <Search className="h-5 w-5 text-amber-500" />
            <h3 className="text-sm font-semibold text-gray-900">Quick Search</h3>
          </div>
          <form action="/dashboard/librarian/inventory" method="GET" className="flex gap-2">
            <div className="relative flex-1 min-w-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                name="q"
                placeholder="Search by title, author or ISBN..."
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 pl-10 pr-4 text-sm shadow-sm transition-all focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 placeholder:text-gray-400"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 sm:px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition-all hover:from-amber-400 hover:to-amber-500 hover:shadow-xl"
            >
              Search
            </button>
          </form>
        </div>

        <a href="/dashboard/librarian/inventory" className="animate-fade-up animate-delay-400 group">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-6 shadow-sm hover:shadow-md transition-all flex h-full items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">Browse Full Inventory</p>
              <p className="mt-0.5 text-xs text-gray-500">Manage catalog, add new books</p>
            </div>
            <Library className="h-8 w-8 text-amber-400 transition-transform group-hover:translate-x-1" />
          </div>
        </a>
      </div>

      {/* Recent Circulation */}
      <div className="animate-fade-up animate-delay-400">
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 border-b border-gray-100 px-4 sm:px-6 py-4">
            <BookMarked className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-gray-900">Recent Circulation</h2>
          </div>
          <div className="p-1">
            <DataTable
              columns={[
                { key: 'student', header: 'Student', render: (r) => (r.students as Record<string, unknown>)?.name as string ?? '-' },
                { key: 'book', header: 'Book', render: (r) => (r.library_items as Record<string, unknown>)?.title as string ?? '-' },
                { key: 'status', header: 'Status', render: (r) => {
                  const s = r.status as string;
                  const isOverdue = s === 'issued' && new Date(r.due_date as string) < new Date();
                  return <Badge variant={s === 'returned' ? 'success' : isOverdue ? 'error' : 'info'}>{isOverdue ? 'overdue' : s}</Badge>;
                }},
                { key: 'due_date', header: 'Due Date', render: (r) => new Date(r.due_date as string).toLocaleDateString() },
              ]}
              data={recentCirculation.data as unknown as Record<string, unknown>[] ?? []}
              keyExtractor={(r) => r.id as string}
              emptyMessage="No circulation records yet."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
