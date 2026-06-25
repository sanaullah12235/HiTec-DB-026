import { describe, it, expect, vi } from 'vitest';
import { withRetry } from '../src/repository.js';
import { DeadlockError, ConflictError, DatabaseError } from '../src/errors.js';

describe('withRetry', () => {
  it('returns the result of a successful function', async () => {
    const result = await withRetry(async () => 'success');
    expect(result).toBe('success');
  });

  it('retries on DeadlockError up to maxRetries then throws', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce({ code: '40001', message: 'deadlock' })
      .mockRejectedValueOnce({ code: '40001', message: 'deadlock' })
      .mockRejectedValueOnce({ code: '40001', message: 'deadlock' });

    await expect(withRetry(fn, { maxRetries: 3, baseDelayMs: 5 })).rejects.toThrow(
      DeadlockError,
    );
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('succeeds on retry after transient deadlock', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce({ code: '40001', message: 'deadlock' })
      .mockResolvedValueOnce('recovered');

    const result = await withRetry(fn, { maxRetries: 3, baseDelayMs: 5 });
    expect(result).toBe('recovered');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('throws ConflictError immediately without retry', async () => {
    const fn = vi.fn().mockRejectedValue({ code: '23505', message: 'duplicate' });

    await expect(withRetry(fn, { maxRetries: 3, baseDelayMs: 5 })).rejects.toThrow(
      ConflictError,
    );
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('throws generic DatabaseError for unknown PG codes', async () => {
    const fn = vi
      .fn()
      .mockRejectedValue({ code: '22001', message: 'value too long' });

    await expect(withRetry(fn)).rejects.toThrow(DatabaseError);
  });

  it('throws DatabaseError for non-Postgres errors', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('network error'));

    await expect(withRetry(fn)).rejects.toThrow(DatabaseError);
  });

  it('uses default maxRetries of 3', async () => {
    const fn = vi.fn().mockRejectedValue({ code: '40001', message: 'deadlock' });

    await expect(withRetry(fn, { baseDelayMs: 5 })).rejects.toThrow(DeadlockError);
    expect(fn).toHaveBeenCalledTimes(3);
  });
});
