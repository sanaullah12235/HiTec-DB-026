import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { ValidationError } from '@hisup/config/errors';
import { ok, fromError } from '@/lib/api-response';

const gradeRowSchema = z.object({
  enrollment_id: z.string().uuid('Enrollment ID must be a valid UUID.'),
  numeric_grade: z.number().min(0).max(100, 'Grade must be between 0 and 100.'),
});

const bulkSchema = z.object({
  grades: z.array(gradeRowSchema).min(1, 'At least one grade row is required.').max(500, 'Maximum 500 rows per batch.'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = bulkSchema.parse(body);

    const supabase = createAdminClient() as unknown as {
      rpc: (fn: string, params?: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
    };

    const { data, error: rpcError } = await supabase.rpc('bulk_import_grades', {
      p_grades: parsed.grades.map((g) => ({
        enrollment_id: g.enrollment_id,
        numeric_grade: g.numeric_grade,
      })),
    });

    if (rpcError) {
      const message =
        typeof rpcError === 'object' && rpcError !== null && 'message' in rpcError
          ? (rpcError as { message: string }).message
          : 'Grade import failed.';

      return fromError(new ValidationError(message));
    }

    return ok({ imported: (data as Array<Record<string, unknown>> | null)?.length ?? 0, results: data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fromError(new ValidationError(error.issues.map((i) => i.message).join('; ')));
    }

    return fromError(error);
  }
}
