import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

type Role = 'student' | 'faculty' | 'finance' | 'admin' | 'librarian';

const ROLE_ROUTES: Record<Role, string> = {
  student: '/dashboard/student',
  faculty: '/dashboard/faculty',
  finance: '/dashboard/finance',
  admin: '/dashboard/admin',
  librarian: '/dashboard/librarian',
};

const VALID_ROLES = new Set(Object.keys(ROLE_ROUTES));

const PUBLIC_ROUTES = new Set([
  '/',
  '/login',
  '/signup',
  '/admission',
  '/api/auth/callback',
]);

// Routes where the session cookie must also be refreshed (e.g. after sign-in).
// The Supabase SSR library refreshes the session on every verified request,
// but we avoid unnecessary overhead on static assets.
const AUTH_REQUIRED_REGEX = /^\/(?!_next\/|favicon\.ico).*/;

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.has(pathname)) return true;
  if (pathname.startsWith('/_next/')) return true;
  if (pathname === '/favicon.ico') return true;
  return false;
}

function isApiRoute(pathname: string): boolean {
  return pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/');
}

function addSecurityHeaders(response: NextResponse): void {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload',
  );
}

function getClientEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[middleware] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY not set. ' +
        'Auth checks will be skipped in dev mode. Create a .env file from .env.example.',
      );
      return null;
    }
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.',
    );
  }

  return { url, anonKey };
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 1. Static / public routes — pass through immediately ───────────────
  if (isPublicRoute(pathname)) {
    const response = NextResponse.next();
    addSecurityHeaders(response);
    return response;
  }

  // ── 2. Load Supabase client credentials ────────────────────────────────
  const env = getClientEnv();
  if (!env) {
    // Dev mode without env: allow all traffic with a warning.
    return NextResponse.next();
  }

  // ── 3. Build Supabase SSR client from request cookies ──────────────────
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[],
      ) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        supabaseResponse = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          supabaseResponse.cookies.set(name, value, options);
        }
      },
    },
  });

  // ── 4. Authenticate session ────────────────────────────────────────────
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
        },
        { status: 401 },
      );
    }

    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // ── 5. Extract role from app_metadata ──────────────────────────────────
  const role = user.app_metadata?.role as string | undefined;

  if (!role || !VALID_ROLES.has(role)) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'User account has no assigned role.',
          },
        },
        { status: 403 },
      );
    }

    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('error', 'invalid_role');
    return NextResponse.redirect(redirectUrl);
  }

  const typedRole = role as Role;

  // ── 6. Shared dashboard routes accessible by any authenticated role ──
  const SHARED_ROUTES = new Set(['library', 'fines']);
  const isSharedRoute = (seg: string | undefined): seg is string =>
    seg !== undefined && SHARED_ROUTES.has(seg);

  // ── 7. Role-based routing for /dashboard/* ─────────────────────────────
  if (pathname.startsWith('/dashboard')) {
    const targetRole = pathname.split('/')[2] as string | undefined;

    if (!targetRole) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = ROLE_ROUTES[typedRole];
      return NextResponse.redirect(redirectUrl);
    }

    if (isSharedRoute(targetRole)) {
      addSecurityHeaders(supabaseResponse);
      return supabaseResponse;
    }

    if (targetRole !== typedRole) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = ROLE_ROUTES[typedRole];
      return NextResponse.redirect(redirectUrl);
    }

    addSecurityHeaders(supabaseResponse);
    return supabaseResponse;
  }

  // ── 8. Role-based access for /api/* routes ─────────────────────────────
  if (isApiRoute(pathname)) {
    const allowedRole = pathname.split('/')[2] as string | undefined;
    if (allowedRole && VALID_ROLES.has(allowedRole) && allowedRole !== typedRole) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: `Insufficient permissions. Required role: ${allowedRole}.`,
          },
        },
        { status: 403 },
      );
    }
  }

  // ── 9. All other authenticated routes ─────────────────────────────────
  addSecurityHeaders(supabaseResponse);
  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
