import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { ValidationError } from '@hisup/config/errors';
import { fromError } from '@/lib/api-response';

type DbClient = {
  from: (table: string) => {
    upsert: (data: Record<string, unknown>, opts?: { onConflict: string; ignoreDuplicates: boolean }) => Promise<{ error: unknown }>;
  };
};

const schema = z.object({
  enrollment_id: z.string().uuid(),
  status: z.enum(['Present', 'Absent', 'Late', 'Excused']),
  date: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.parse(body);

    const supabase = createAdminClient() as unknown as DbClient;
    const { error } = await supabase.from('attendance_records').upsert(parsed, { onConflict: 'enrollment_id, date', ignoreDuplicates: false });
    if (error) return fromError(new ValidationError((error as { message: string }).message));

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fromError(new ValidationError(error.issues.map((i) => i.message).join('; ')));
    }
    return fromError(error);
  }
}
