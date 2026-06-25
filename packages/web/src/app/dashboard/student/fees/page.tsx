import { createServerSupabaseClient } from '@/lib/supabase/server-client';
import { redirect } from 'next/navigation';
import { Card, StatCard, StatGrid } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import FeeSlipButton from './fee-slip-button';

export default async function FeesPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: student } = await supabase.from('students').select('id, program_id').eq('email', user.email!).maybeSingle();
  if (!student) return <div className="flex flex-col items-center justify-center py-16"><p className="text-sm font-medium text-gray-400">Student record not found.</p></div>;

  const [feeStructures, feePayments] = await Promise.all([
    supabase.from('fee_structure').select('*').eq('program_id', student.program_id).order('semester', { ascending: false }),
    supabase.from('fee_payments').select('*').eq('student_id', student.id).order('created_at', { ascending: false }),
  ]);

  const structures = feeStructures.data ?? [];
  const payments = feePayments.data ?? [];
  const totalAmount = structures.reduce((s, f) => s + Number(f.amount), 0);
  const totalPaid = payments.filter((p) => p.status === 'completed').reduce((s, p) => s + Number(p.amount), 0);
  const totalPending = payments.filter((p) => p.status === 'pending').reduce((s, p) => s + Number(p.amount), 0);
  const due = Math.max(0, totalAmount - totalPaid);

  // Current semester fee structure for the "Generate Slip" button
  const currentSemester = '2026F';
  const currentFeeStructure = structures.find((f) => f.semester === currentSemester);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent">Fee Management</h1>
        <p className="text-sm font-medium text-gray-500">Manage your fee payments and view payment history</p>
      </div>

      <StatGrid>
        <StatCard label="Total Fee" value={`PKR ${totalAmount.toLocaleString()}`} icon={<span>💰</span>} />
        <StatCard label="Total Paid" value={`PKR ${totalPaid.toLocaleString()}`} icon={<span>✅</span>} trend={totalPaid > 0 ? { direction: 'up', label: 'Completed' } : undefined} />
        <StatCard label="Pending" value={`PKR ${totalPending.toLocaleString()}`} icon={<span>⏳</span>} />
        <StatCard label="Due" value={`PKR ${due.toLocaleString()}`} icon={<span>📋</span>} trend={due > 0 ? { direction: 'up', label: 'Outstanding' } : { direction: 'down', label: 'Clear' }} />
      </StatGrid>

      <Card title="Payment History" action={currentFeeStructure ? <FeeSlipButton studentId={student.id} feeStructureId={currentFeeStructure.id} /> : undefined}>
        <DataTable
          columns={[
            { key: 'semester', header: 'Semester', render: () => currentFeeStructure?.semester ?? '-' },
            { key: 'amount', header: 'Amount', render: (r) => `PKR ${(r.amount as number).toLocaleString()}` },
            { key: 'status', header: 'Status', render: (r) => <Badge variant={r.status === 'completed' ? 'success' : r.status === 'pending' ? 'warning' : 'error'}>{r.status as string}</Badge> },
            { key: 'transaction_ref', header: 'Ref', render: (r) => r.transaction_ref ? <span className="text-xs font-mono">{r.transaction_ref as string}</span> : '-' },
            { key: 'paid_at', header: 'Date', render: (r) => r.paid_at ? new Date(r.paid_at as string).toLocaleDateString() : '-' },
          ]}
          data={payments as unknown as Record<string, unknown>[]}
          keyExtractor={(r) => r.id as string}
          emptyMessage="No payment records found."
        />
      </Card>
    </div>
  );
}
