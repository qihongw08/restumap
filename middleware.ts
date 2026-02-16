import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const PUBLIC_PATHS = [
  '/login',
  '/auth/callback',
  '/auth/auth-code-error',
  '/groups/join',
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  // Allow API routes through; they return 401 themselves
  if (request.nextUrl.pathname.startsWith('/api')) {
    return response;
  }

  // Allow static assets and _next
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.includes('.')
  ) {
    return response;
  }

  if (isPublicPath(request.nextUrl.pathname)) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    const loginUrl = new URL('/login', request.url);
    const next =
      request.nextUrl.pathname +
      (request.nextUrl.search || '');
    loginUrl.searchParams.set('next', encodeURIComponent(next));
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, images, etc.
     */
    '/((?!_next/static|_next/image|favicon.ico|icon-192|icon-512|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
