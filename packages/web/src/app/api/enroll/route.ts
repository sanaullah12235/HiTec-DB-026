import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { createRpcClient } from '@hisup/config/rpcs';
import { ValidationError } from '@hisup/config/errors';
import { ok, created, fromError } from '@/lib/api-response';

const enrollSchema = z.object({
  student: z.object({
    name: z.string().min(1, 'Name is required.'),
    email: z.string().email('A valid email address is required.'),
    cnic: z.string().min(13).max(15, 'CNIC must be 13–15 characters.'),
    bank_account: z.string().optional(),
    program_id: z.string().uuid('Program ID must be a valid UUID.'),
    enrollment_semester: z.string().min(1, 'Enrollment semester is required.'),
  }),
  section_id: z.string().uuid('Section ID must be a valid UUID.'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = enrollSchema.parse(body);

    const supabase = createAdminClient() as unknown as { rpc: (fn: string, params?: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }> };
    const rpc = createRpcClient(supabase);

    const studentId = await rpc.registerStudentAndEnroll({
      student: parsed.student,
      section_id: parsed.section_id,
    });

    return created({ student_id: studentId });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fields: Record<string, string[]> = {};
      for (const issue of error.issues) {
        const path = issue.path.join('.');
        if (!fields[path]) fields[path] = [];
        fields[path]!.push(issue.message);
      }
      return fromError(
        new ValidationError('Request validation failed.'),
      );
    }

    return fromError(error);
  }
}
