import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { ValidationError } from '@hisup/config/errors';
import { created, fromError } from '@/lib/api-response';

const schema = z.object({
  student_id: z.string().uuid(),
  fee_structure_id: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { student_id, fee_structure_id } = schema.parse(body);

    const supabase = createAdminClient() as unknown as {
      from: (table: string) => {
        insert: (data: Record<string, unknown>) => { select: () => { single: () => Promise<{ data: unknown; error: unknown }> } };
        update: (data: Record<string, unknown>) => { eq: (col: string, val: string) => Promise<{ error: unknown }> };
      };
    };

    const { data, error } = await supabase
      .from('fee_payments')
      .insert({ student_id, fee_structure_id, amount: 0, status: 'pending' })
      .select()
      .single();

    if (error) return fromError(new ValidationError((error as { message: string }).message));
    return created(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fromError(new ValidationError(error.issues.map((i) => i.message).join('; ')));
    }
    return fromError(error);
  }
}
