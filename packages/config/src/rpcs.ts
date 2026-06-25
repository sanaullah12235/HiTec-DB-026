import { withRetry, type RetryOptions } from './repository';
import { DeadlockError, TimeoutError, NetworkError, QueryCanceledError } from './errors';

// ── Input Types ──────────────────────────────────────────────────────────

export interface RegisterStudentAndEnrollInput {
  student: {
    name: string;
    email: string;
    cnic: string;
    bank_account?: string;
    program_id: string;
    enrollment_semester: string;
  };
  section_id: string;
}

export interface BulkImportGradesInput {
  grades: Array<{
    enrollment_id: string;
    numeric_grade: number;
  }>;
}

// ── RPC Engine Interface ─────────────────────────────────────────────────

export interface RpcCaller {
  rpc: (
    fnName: string,
    params?: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: unknown }>;
}

// ── RPC Client Factory ───────────────────────────────────────────────────
// Wraps Supabase RPC calls with withRetry, targeting only transient errors
// (deadlocks, network blips, timeouts, query cancellations).
//
// Business errors (unique violations, FK violations, RAISE EXCEPTION) are
// NOT retried — they bubble up immediately as typed errors.

export function createRpcClient(supabase: RpcCaller) {
  const retryOptions: RetryOptions = {
    maxRetries: 3,
    baseDelayMs: 150,
    maxDelayMs: 3000,
    retryableErrors: [DeadlockError, TimeoutError, NetworkError, QueryCanceledError],
  };

  async function registerStudentAndEnroll(
    input: RegisterStudentAndEnrollInput,
    overrides?: RetryOptions,
  ) {
    const { student, section_id } = input;

    return withRetry(async () => {
      const { data, error } = await supabase.rpc('register_student_and_enroll', {
        p_student: student as Record<string, unknown>,
        p_section_id: section_id,
      });

      if (error) throw error;
      return data as string;
    }, { ...retryOptions, ...overrides });
  }

  async function bulkImportGrades(
    input: BulkImportGradesInput,
    overrides?: RetryOptions,
  ) {
    return withRetry(async () => {
      const { data, error } = await supabase.rpc('bulk_import_grades', {
        p_grades: input.grades as unknown as Record<string, unknown>,
      });

      if (error) throw error;
      return data as Array<{ enrollment_id: string; status: string }>;
    }, { ...retryOptions, ...overrides });
  }

  return {
    registerStudentAndEnroll,
    bulkImportGrades,
  };
}
