'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/form-field';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';

interface AuditEntry {
  id: string;
  table_name: string;
  operation: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  changed_by: string;
  changed_at: string;
}

export default function AuditLogsPage() {
  const supabase = createClient();
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableFilter, setTableFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);
  const pageSize = 20;

  async function loadLogs() {
    setLoading(true);
    let query = supabase
      .from('audit_log')
      .select('*', { count: 'exact' })
      .order('changed_at', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (tableFilter) query = query.eq('table_name', tableFilter);
    if (dateFrom) query = query.gte('changed_at', dateFrom);
    if (dateTo) query = query.lte('changed_at', `${dateTo}T23:59:59Z`);

    const { data } = await query;
    setLogs(data as AuditEntry[] ?? []);
    setLoading(false);
  }

  useEffect(() => { loadLogs(); }, [page, tableFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const tables = ['students', 'enrollments', 'grades', 'fee_payments', 'library_issues'];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          <span className="text-gradient from-blue-600 to-blue-400">System Audit Logs</span>
        </h1>
        <p className="mt-1 text-sm text-gray-500">Track all data changes across the system</p>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <Select label="Table" value={tableFilter} onChange={(e) => { setTableFilter(e.target.value); setPage(0); }} options={[{ value: '', label: 'All' }, ...tables.map((t) => ({ value: t, label: t }))]} />
        <Input label="From" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <Input label="To" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        <Button variant="outline" onClick={() => loadLogs()}>Apply</Button>
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-gray-400">Loading...</p>
      ) : (
        <Card>
          <DataTable
            columns={[
              { key: 'time', header: 'Timestamp', render: (r) => <span className="text-xs">{new Date(r.changed_at as string).toLocaleString()}</span> },
              { key: 'table_name', header: 'Table', render: (r) => <Badge>{r.table_name as string}</Badge> },
              { key: 'operation', header: 'Op', render: (r) => <Badge variant={r.operation === 'INSERT' ? 'success' : r.operation === 'DELETE' ? 'error' : 'info'}>{r.operation as string}</Badge> },
              { key: 'changed_by', header: 'User', render: (r) => <span className="text-xs">{r.changed_by as string}</span> },
              { key: 'data', header: 'Data', render: (r) => <Button variant="ghost" onClick={() => setExpanded(expanded === r.id ? null : r.id as string)}>{expanded === r.id ? 'Hide' : 'View'}</Button> },
            ]}
            data={logs as unknown as Record<string, unknown>[]}
            keyExtractor={(r) => r.id as string}
          />
          {logs.map((log) => expanded === log.id && (
            <div key={`exp-${log.id}`} className="border-t border-gray-100 bg-gray-50 p-4">
              {log.old_data && <div className="mb-3 last:mb-0"><p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">OLD:</p><pre className="overflow-x-auto rounded-lg border border-gray-200 bg-white p-3 text-xs shadow-sm">{JSON.stringify(log.old_data, null, 2)}</pre></div>}
              {log.new_data && <div className="mb-3 last:mb-0"><p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">NEW:</p><pre className="overflow-x-auto rounded-lg border border-gray-200 bg-white p-3 text-xs shadow-sm">{JSON.stringify(log.new_data, null, 2)}</pre></div>}
            </div>
          ))}
        </Card>
      )}

      <div className="flex items-center justify-center gap-3">
        <Button variant="outline" onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}>Previous</Button>
        <span className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600">Page {page + 1}</span>
        <Button variant="outline" onClick={() => setPage(page + 1)}>Next</Button>
      </div>
    </div>
  );
}
