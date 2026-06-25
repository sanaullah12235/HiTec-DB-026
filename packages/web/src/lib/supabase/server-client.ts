import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { parseEnv } from '@hisup/config/env';

export async function createServerSupabaseClient() {
  const env = parseEnv();
  const cookieStore = await cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[],
        ) {
          try {
            for (const { name, value } of cookiesToSet) {
              cookieStore.set(name, value);
            }
          } catch {
            // Called from Server Component — ignore.
          }
        },
      },
    },
  );
}
