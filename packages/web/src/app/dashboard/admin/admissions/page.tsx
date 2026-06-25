'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';

interface Admission {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  cnic: string;
  program_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  programs?: { name: string; code: string };
}

export default function AdminAdmissionsPage() {
  const supabase = createClient();
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedCnic, setExpandedCnic] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<{ id: string; variant: 'success' | 'error' | 'info'; message: string }[]>([]);

  const addAlert = (variant: 'success' | 'error' | 'info', message: string) => {
    const id = `${Date.now()}`;
    setAlerts((p) => [...p, { id, variant, message }]);
    setTimeout(() => setAlerts((p) => p.filter((a) => a.id !== id)), 5000);
  };

  async function loadData() {
    setLoading(true);
    const { data } = await supabase
      .from('admissions')
      .select('*, programs(name, code)')
      .order('created_at', { ascending: false });
    if (data) setAdmissions(data as Admission[]);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  const handleAction = async (id: string, action: 'approved' | 'rejected') => {
    setActionLoading(id);
    const res = await fetch('/api/admin/admissions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }),
    });
    const result = await res.json();
    setActionLoading(null);

    if (result.success) {
      addAlert('success', action === 'approved'
        ? `Approved — credentials sent to ${result.data.email} (temp password: ${result.data.tempPassword})`
        : 'Application rejected');
      loadData();
    } else {
      addAlert('error', result.error ?? 'Action failed');
    }
  };

  const filtered = filter === 'all' ? admissions : admissions.filter((a) => a.status === filter);

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-fade-up">
        <h1 className="text-3xl font-bold text-gray-900">
          <span className="text-gradient from-blue-600 to-blue-400">Admissions</span>
        </h1>
        <p className="mt-1 text-sm text-gray-500">Review and manage admission applications</p>
      </div>

      <div className="flex flex-col gap-2">
        {alerts.map((a) => (
          <motion.div key={a.id} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Alert
              variant={a.variant === 'error' ? 'error' : a.variant === 'success' ? 'success' : 'info'}
              message={a.message}
              onClose={() => setAlerts((p) => p.filter((x) => x.id !== a.id))}
            />
          </motion.div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              filter === f
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span className="ml-1.5 text-xs opacity-70">
              ({f === 'all' ? admissions.length : admissions.filter((a) => a.status === f).length})
            </span>
          </button>
        ))}
        <button
          onClick={loadData}
          className="ml-auto rounded-lg border border-gray-200 bg-white p-2 text-gray-500 hover:bg-gray-50"
          title="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Phone</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">CNIC</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Program</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Applied</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-sm text-gray-400">
                    No admission applications found.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white">
                          {r.full_name.split(' ').map((s) => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">{r.full_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-gray-700">{r.email}</td>
                    <td className="px-4 py-2 text-gray-700">{r.phone}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-xs text-gray-700">
                          {expandedCnic === r.id ? r.cnic : `${r.cnic.slice(0, 5)}...`}
                        </span>
                        <button
                          onClick={() => setExpandedCnic(expandedCnic === r.id ? null : r.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {expandedCnic === r.id ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-gray-700">
                      {r.programs ? `${r.programs.name} (${r.programs.code})` : '-'}
                    </td>
                    <td className="px-4 py-2">
                      <Badge variant={r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'error' : 'info'}>
                        {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 text-gray-700">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-2 text-right">
                      {r.status === 'pending' && (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="primary"
                            loading={actionLoading === r.id}
                            onClick={() => handleAction(r.id, 'approved')}
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            loading={actionLoading === r.id}
                            onClick={() => handleAction(r.id, 'rejected')}
                            className="!border-red-300 !text-red-600 hover:!bg-red-50"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
