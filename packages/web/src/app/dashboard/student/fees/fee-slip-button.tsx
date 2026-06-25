'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { useState } from 'react';

export default function FeeSlipButton({ studentId, feeStructureId }: { studentId: string; feeStructureId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setSuccess(false);

    const supabase = createClient();
    const { data: fs } = await supabase
      .from('fee_structure')
      .select('amount')
      .eq('id', feeStructureId)
      .maybeSingle();
    if (!fs) {
      setError('Fee structure not found.');
      setLoading(false);
      return;
    }
    const { error: rpcError } = await supabase.from('fee_payments').insert({
      student_id: studentId,
      fee_structure_id: feeStructureId,
      amount: fs.amount,
      status: 'pending',
    });

    if (rpcError) {
      setError(rpcError.message);
    } else {
      setSuccess(true);
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}
      {success && <Alert variant="success" message="Fee slip generated!" onClose={() => setSuccess(false)} />}
      <Button onClick={handleGenerate} loading={loading}>Generate Fee Slip</Button>
    </div>
  );
}
