import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { ValidationError, NotFoundError } from '@hisup/config/errors';
import { ok, noContent, fromError } from '@/lib/api-response';

const updateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  due_date: z.string().optional(),
  max_marks: z.number().positive().optional(),
  published: z.boolean().optional(),
});

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateSchema.parse(body);

    const supabase = createAdminClient() as any;
    const { data, error } = await supabase
      .from('assignments')
      .update(parsed)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return fromError(new NotFoundError('Assignment not found'));
      return fromError(new ValidationError(error.message));
    }
    return ok(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fromError(new ValidationError(error.issues.map((i) => i.message).join('; ')));
    }
    return fromError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const supabase = createAdminClient();
    const { error } = await supabase
      .from('assignments')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === 'PGRST116') return fromError(new NotFoundError('Assignment not found'));
      return fromError(new ValidationError(error.message));
    }
    return noContent();
  } catch (error) {
    return fromError(error);
  }
}
