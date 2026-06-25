import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { ValidationError } from '@hisup/config/errors';
import { ok, created, fromError } from '@/lib/api-response';

const createSchema = z.object({
  user_id: z.string().uuid(),
  title: z.string().min(1).max(255),
  message: z.string().min(1),
  type: z.enum(['info', 'warning', 'success', 'error']).optional().default('info'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createSchema.parse(body);

    const supabase = createAdminClient() as any;
    const { data, error } = await supabase
      .from('notifications')
      .insert(parsed)
      .select()
      .single();

    if (error) return fromError(new ValidationError(error.message));
    return created(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fromError(new ValidationError(error.issues.map((i) => i.message).join('; ')));
    }
    return fromError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const unreadOnly = searchParams.get('unread_only') === 'true';

    const supabase = createAdminClient();
    let query = supabase.from('notifications').select('*');

    if (userId) query = query.eq('user_id', userId);
    if (unreadOnly) query = query.eq('read', false);

    query = query.order('created_at', { ascending: false }).limit(50);

    const { data, error } = await query;
    if (error) return fromError(new ValidationError(error.message));
    return ok(data);
  } catch (error) {
    return fromError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, read } = body;

    if (!id || typeof read !== 'boolean') {
      return fromError(new ValidationError('id (string) and read (boolean) are required'));
    }

    const supabase = createAdminClient() as any;
    const { data, error } = await supabase
      .from('notifications')
      .update({ read })
      .eq('id', id)
      .select()
      .single();

    if (error) return fromError(new ValidationError(error.message));
    return ok(data);
  } catch (error) {
    return fromError(error);
  }
}
