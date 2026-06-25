import {
  DatabaseError,
  DeadlockError,
  ConflictError,
  ForeignKeyError,
  CheckViolationError,
  NotNullViolationError,
  RaiseExceptionError,
  QueryCanceledError,
  NetworkError,
  TimeoutError,
} from './errors';

// ── Error Shape Detection ────────────────────────────────────────────────
// Supabase PostgREST errors have the shape:
//   { code: string, message: string, details: string, hint: string }
//
// Raw PostgreSQL driver errors have:
//   { code: string, message: string, detail: string, hint: string }
//
// Network errors are detected by checking for AbortError, TimeoutError, etc.

export interface PostgresErrorLike {
  code?: string;
  message?: string;
  detail?: string;
  details?: string;
  hint?: string;
}

function isPostgresError(err: unknown): err is PostgresErrorLike {
  if (typeof err !== 'object' || err === null) return false;
  const candidate = err as Record<string, unknown>;
  if (typeof candidate.code !== 'string' || candidate.code.length === 0) return false;
  if (typeof candidate.message !== 'string') return false;
  return true;
}

function isAbortError(err: unknown): boolean {
  if (err instanceof DOMException && err.name === 'AbortError') return true;
  if (err instanceof Error && (err.name === 'AbortError' || err.name === 'TimeoutError')) return true;
  return false;
}

function isNetworkError(err: unknown): boolean {
  if (err instanceof TypeError && err.message === 'fetch failed') return true;
  if (err instanceof Error && 'code' in err) {
    const code = (err as { code: string }).code;
    if (['ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'EAI_AGAIN'].includes(code)) return true;
  }
  return false;
}

// ── Error Translation Map ────────────────────────────────────────────────
// Maps PostgreSQL SQLSTATE codes (and Supabase PostgREST codes) to typed
// error classes for deterministic client responses.

type ErrorConstructor = new (message: string, detail?: string, hint?: string) => DatabaseError;

const PG_CODE_MAP: Record<string, ErrorConstructor> = {
  '40001': DeadlockError,      // serialization_failure
  '40P01': DeadlockError,      // deadlock_detected
  '23505': ConflictError,       // unique_violation
  '23503': ForeignKeyError,     // foreign_key_violation
  '23514': CheckViolationError, // check_violation
  '23502': NotNullViolationError, // not_null_violation
  'P0001': RaiseExceptionError, // raise_exception
  '57014': QueryCanceledError,  // query_canceled
};

function translateError(err: unknown): Error {
  // Supabase RPC layer errors
  if (isPostgresError(err)) {
    const ErrorClass = PG_CODE_MAP[err.code ?? ''];
    if (ErrorClass) {
      return new ErrorClass(
        err.message ?? err.details ?? err.detail ?? 'Database error occurred.',
        err.detail ?? err.details,
        err.hint,
      );
    }

    // Known PG code but unmapped — pass through as generic DatabaseError
    if (err.code && /^[0-9A-Z]{5}$/.test(err.code)) {
      return new DatabaseError(
        err.message ?? err.details ?? 'Database error.',
        err.code,
        err.message,
        err.detail ?? err.details,
        err.hint,
      );
    }
  }

  // Network / timeout errors
  if (isAbortError(err)) {
    return new TimeoutError();
  }
  if (isNetworkError(err)) {
    return new NetworkError(
      err instanceof Error ? err.message : 'Network error.',
      err,
    );
  }

  // Standard JS Error
  if (err instanceof Error) {
    return new DatabaseError(err.message);
  }

  return new DatabaseError('An unknown database error occurred.');
}

// ── Retry Configuration ──────────────────────────────────────────────────

export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  retryableErrors?: Array<new (...args: never[]) => Error>;
}

const DEFAULT_RETRYABLE = [DeadlockError, TimeoutError, NetworkError, QueryCanceledError];

function isRetryable(err: Error, retryableTypes: Array<new (...args: never[]) => Error>): boolean {
  return retryableTypes.some((Type) => err instanceof Type);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function calculateDelay(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
  const exponential = baseDelayMs * 2 ** (attempt - 1);
  const jitter = Math.random() * exponential * 0.3;
  return Math.min(exponential + jitter, maxDelayMs);
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions,
): Promise<T> {
  const maxRetries = options?.maxRetries ?? 3;
  const baseDelayMs = options?.baseDelayMs ?? 100;
  const maxDelayMs = options?.maxDelayMs ?? 5000;
  const retryableTypes = options?.retryableErrors ?? DEFAULT_RETRYABLE;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = translateError(err);

      if (isRetryable(lastError, retryableTypes)) {
        if (attempt < maxRetries) {
          const delay = calculateDelay(attempt, baseDelayMs, maxDelayMs);
          console.warn(
            `[withRetry] Attempt ${attempt}/${maxRetries} failed with ${lastError.constructor.name}. ` +
            `Retrying in ${Math.round(delay)}ms...`,
          );
          await sleep(delay);
          continue;
        }
        console.error(
          `[withRetry] All ${maxRetries} attempts exhausted. Last error: ${lastError.constructor.name}: ${lastError.message}`,
        );
      }

      throw lastError;
    }
  }

  throw lastError ?? new DatabaseError('Unexpected retry exhaustion.');
}

// ── Repository Factory ───────────────────────────────────────────────────

export interface RepositoryOptions {
  retry?: RetryOptions;
}

export function createRepository<T>(
  operation: () => Promise<T>,
  options?: RepositoryOptions,
): () => Promise<T> {
  return () => withRetry(operation, options?.retry);
}
