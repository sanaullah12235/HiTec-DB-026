import { z } from 'zod';

// ── Schema ───────────────────────────────────────────────────────────────

const envSchema = z
  .object({
    // ─── Public (exposed to browser bundle) ─────────────────────────────
    NEXT_PUBLIC_SUPABASE_URL: z
      .string()
      .url({ message: 'NEXT_PUBLIC_SUPABASE_URL must be a valid URL (e.g. https://xyz.supabase.co)' }),

    NEXT_PUBLIC_SUPABASE_ANON_KEY: z
      .string()
      .min(1, { message: 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required.' }),

    // ─── Private (server-only) ──────────────────────────────────────────
    SUPABASE_SERVICE_ROLE_KEY: z
      .string()
      .min(1, { message: 'SUPABASE_SERVICE_ROLE_KEY is required.' }),

    SUPABASE_DB_URL: z
      .string()
      .url()
      .optional(),

    ENCRYPTION_PASSPHRASE: z
      .string()
      .min(16, {
        message: 'ENCRYPTION_PASSPHRASE must be at least 16 characters for pgp_sym_encrypt.',
      }),

    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),

    LOG_LEVEL: z
      .enum(['debug', 'info', 'warn', 'error'])
      .default('info'),

    SUPABASE_AUTH_EXTERNAL_URL: z
      .string()
      .url()
      .optional(),
  })
  .superRefine((data, ctx) => {
    // ── Cross-field validation ──────────────────────────────────────────
    if (data.NEXT_PUBLIC_SUPABASE_ANON_KEY === data.SUPABASE_SERVICE_ROLE_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'SUPABASE_SERVICE_ROLE_KEY must differ from NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
          'Never expose the service role key to the client.',
        path: ['SUPABASE_SERVICE_ROLE_KEY'],
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

// ── Cached Singleton ─────────────────────────────────────────────────────

let cachedEnv: Env | null = null;

// ── Parsing Function ─────────────────────────────────────────────────────

export function parseEnv(
  overrides?: Record<string, string | undefined>,
): Env {
  if (cachedEnv && !overrides) {
    return cachedEnv;
  }

  // Build the source object by reading process.env directly.
  const source: Record<string, string | undefined> = {};
  if (overrides) {
    Object.assign(source, overrides);
  } else {
    for (const key of Object.keys(process.env)) {
      source[key] = process.env[key];
    }
  }

  const result = envSchema.safeParse(source);

  if (!result.success) {
    const lines = result.error.issues
      .map((i) => {
        const path = i.path.join('.');
        const msg = i.message;
        return `  [${path}] ${msg}`;
      })
      .join('\n');
    throw new Error(
      `Environment variable validation failed:\n${lines}\n\n` +
        'Copy .env.example to .env and fill in the required values.',
    );
  }

  cachedEnv = result.data;

  return result.data;
}

export function resetEnvCache(): void {
  cachedEnv = null;
}
