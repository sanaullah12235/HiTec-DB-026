import { describe, it, expect } from 'vitest';
import { parseEnv, resetEnvCache } from '../src/env.js';

describe('parseEnv', () => {
  it('parses valid environment variables', () => {
    resetEnvCache();
    const env = parseEnv({
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key-123',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-key-456',
      ENCRYPTION_PASSPHRASE: 'a-very-strong-passphrase-here',
      NODE_ENV: 'development',
    });

    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe('https://example.supabase.co');
    expect(env.NODE_ENV).toBe('development');
  });

  it('defaults NODE_ENV to development', () => {
    resetEnvCache();
    const env = parseEnv({
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key-123',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-key-456',
      ENCRYPTION_PASSPHRASE: 'a-very-strong-passphrase-here',
    });

    expect(env.NODE_ENV).toBe('development');
  });

  it('validates SUPABASE_URL is a valid URL', () => {
    resetEnvCache();
    expect(() =>
      parseEnv({
        NEXT_PUBLIC_SUPABASE_URL: 'not-a-url',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key-123',
        SUPABASE_SERVICE_ROLE_KEY: 'service-role-key-456',
        ENCRYPTION_PASSPHRASE: 'a-very-strong-passphrase-here',
      }),
    ).toThrow('Environment variable validation failed');
  });

  it('validates ENCRYPTION_PASSPHRASE minimum length', () => {
    resetEnvCache();
    expect(() =>
      parseEnv({
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key-123',
        SUPABASE_SERVICE_ROLE_KEY: 'service-role-key-456',
        ENCRYPTION_PASSPHRASE: 'short',
      }),
    ).toThrow('Environment variable validation failed');
  });

  it('caches parsed env and returns same reference', () => {
    resetEnvCache();
    const env1 = parseEnv({
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key-123',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-key-456',
      ENCRYPTION_PASSPHRASE: 'a-very-strong-passphrase-here',
    });
    const env2 = parseEnv();
    expect(env1).toBe(env2);
  });
});
