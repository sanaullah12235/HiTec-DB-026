import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { ValidationError, NotFoundError } from '@hisup/config/errors';
import { ok, fromError } from '@/lib/api-response';

type DbClient = {
  from: (table: string) => {
    insert: (data: Record<string, unknown>) => { select: () => { single: () => Promise<{ data: unknown; error: unknown }> } };
    update: (data: Record<string, unknown>) => { eq: (col: string, val: string) => Promise<{ error: unknown }> };
    select: (cols?: string) => {
      eq: (col: string, val: string) => {
        single: () => Promise<{ data: unknown; error: unknown }>;
      };
    };
  };
};

const schema = z.object({
  issue_id: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { issue_id } = schema.parse(body);

    const supabase = createAdminClient() as unknown as DbClient;

    const res = await supabase.from('library_issues').select('*, library_items!inner(id, available_copies)').eq('id', issue_id).single();
    const issue = res.data as unknown as { id: string; due_date: string; item_id: string; library_items: { available_copies: number } } | null;
    if (!issue) return fromError(new NotFoundError('Issue not found.'));

    const now = new Date().toISOString();
    const { error } = await supabase.from('library_issues').update({ returned_at: now, status: 'returned' }).eq('id', issue_id);
    if (error) return fromError(new ValidationError((error as { message: string }).message));

    await supabase.from('library_items').update({ available_copies: issue.library_items.available_copies + 1 }).eq('id', issue.item_id);

    const dueDate = new Date(issue.due_date);
    const daysOverdue = Math.max(0, Math.floor((new Date().getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
    const fine = daysOverdue * 50;

    if (fine > 0) {
      await supabase.from('library_fines').insert({
        issue_id,
        amount: fine,
        days_overdue: daysOverdue,
      });
    }

    return ok({ message: 'Returned successfully.', fine, daysOverdue });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fromError(new ValidationError(error.issues.map((i) => i.message).join('; ')));
    }
    return fromError(error);
  }
}
