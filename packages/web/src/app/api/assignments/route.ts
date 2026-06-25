import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { ValidationError } from '@hisup/config/errors';
import { ok, created, fromError } from '@/lib/api-response';

const createSchema = z.object({
  section_id: z.string().uuid(),
  faculty_id: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  due_date: z.string(),
  max_marks: z.number().positive().optional(),
  published: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createSchema.parse(body);

    const supabase = createAdminClient() as any;
    const { data, error } = await supabase
      .from('assignments')
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
    const sectionId = searchParams.get('section_id');
    const facultyId = searchParams.get('faculty_id');
    const published = searchParams.get('published');

    const supabase = createAdminClient();
    let query = supabase.from('assignments').select('*, sections(section_name, courses(name, code))');

    if (sectionId) query = query.eq('section_id', sectionId);
    if (facultyId) query = query.eq('faculty_id', facultyId);
    if (published !== null) query = query.eq('published', published === 'true');

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) return fromError(new ValidationError(error.message));
    return ok(data);
  } catch (error) {
    return fromError(error);
  }
}
