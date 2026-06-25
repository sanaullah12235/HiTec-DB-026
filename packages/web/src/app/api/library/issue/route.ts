import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { ValidationError } from '@hisup/config/errors';
import { ok, created, fromError } from '@/lib/api-response';

type DbClient = {
  from: (table: string) => {
    insert: (data: Record<string, unknown>) => { select: () => { single: () => Promise<{ data: unknown; error: unknown }> } };
    update: (data: Record<string, unknown>) => { eq: (col: string, val: string) => Promise<{ error: unknown }> };
    select: (cols?: string) => {
      eq: (col: string, val: string) => Promise<{ data: unknown; error: unknown }>;
      single: () => Promise<{ data: unknown; error: unknown }>;
    };
  };
};

const issueSchema = z.object({
  student_id: z.string().uuid(),
  item_id: z.string().uuid(),
  due_date: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { student_id, item_id, due_date } = issueSchema.parse(body);

    const supabase = createAdminClient() as unknown as DbClient;

    const item = await supabase.from('library_items').select('available_copies').eq('id', item_id);
    const itemData = item.data as unknown as { available_copies: number } | null;
    if (!itemData || itemData.available_copies <= 0) {
      return fromError(new ValidationError('No copies available.'));
    }

    const { data, error } = await supabase
      .from('library_issues')
      .insert({ student_id, item_id, due_date, status: 'issued' })
      .select()
      .single();

    if (error) return fromError(new ValidationError((error as { message: string }).message));

    await supabase.from('library_items').update({ available_copies: itemData.available_copies - 1 }).eq('id', item_id);

    return created(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fromError(new ValidationError(error.issues.map((i) => i.message).join('; ')));
    }
    return fromError(error);
  }
}
