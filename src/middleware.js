import { updateSession } from '@/lib/supabase/middleware';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  const { supabaseResponse, user, supabase } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Canonical Stitch route aliases -> current app routes.
  // This keeps flow URLs stable while pages are progressively rebuilt.
  const url = request.nextUrl.clone();
  const directAliases = {
    '/auth/login': '/login',
    '/merchant': '/merchant/dashboard',
    '/admin': '/admin/dashboard',
    '/onboarding/step-1': '/onboarding?step=1',
    '/onboarding/step-2': '/onboarding?step=2',
    '/onboarding/step-3': '/onboarding?step=3',
    '/merchant/onboarding/step-1': '/merchant/onboarding?step=1',
    '/merchant/onboarding/step-2': '/merchant/onboarding?step=2',
    '/merchant/onboarding/step-3': '/merchant/onboarding?step=3',
    '/merchant/onboarding/step-4': '/merchant/onboarding?step=3',
    '/merchant/bags/new': '/merchant/bags/create',
    '/support': '/profile/support',
    '/profile/edit': '/profile/details',
    '/discover/empty-search': '/discover?state=empty-search',
    '/discover/no-results': '/discover?state=no-results',
    '/discover/no-bags-nearby': '/discover?state=no-bags-nearby',
    '/discover/sold-out': '/discover?state=sold-out',
  };

  if (directAliases[pathname]) {
    const [targetPath, targetQuery] = directAliases[pathname].split('?');
    url.pathname = targetPath;
    url.search = targetQuery ? `?${targetQuery}` : '';
    return NextResponse.redirect(url);
  }

  const bagMatch = pathname.match(/^\/bag\/([^/]+)$/);
  if (bagMatch) {
    url.pathname = `/bags/${bagMatch[1]}`;
    url.search = '';
    return NextResponse.redirect(url);
  }

  const merchantPayoutMatch = pathname.match(/^\/merchant\/finance\/payout\/([^/]+)$/);
  if (merchantPayoutMatch) {
    url.pathname = `/merchant/payouts/${merchantPayoutMatch[1]}`;
    url.search = '';
    return NextResponse.redirect(url);
  }

  const checkoutMatch = pathname.match(/^\/checkout\/([^/]+)$/);
  if (checkoutMatch) {
    url.pathname = '/checkout';
    url.search = `?draft=${checkoutMatch[1]}`;
    return NextResponse.redirect(url);
  }

  const reservationSuccessMatch = pathname.match(/^\/reservation\/success\/([^/]+)$/);
  if (reservationSuccessMatch) {
    url.pathname = `/orders/${reservationSuccessMatch[1]}`;
    url.search = '';
    return NextResponse.redirect(url);
  }

  const rescueConfirmedMatch = pathname.match(/^\/rescue\/confirmed\/([^/]+)$/);
  if (rescueConfirmedMatch) {
    url.pathname = `/orders/${rescueConfirmedMatch[1]}`;
    url.search = '';
    return NextResponse.redirect(url);
  }

  // Public paths that don't need auth checking
  const isPublicPath =
    pathname === '/' ||
    pathname.startsWith('/api/location') ||
    pathname.startsWith('/auth') ||
    pathname === '/login' ||
    pathname.startsWith('/bag/') ||
    pathname.startsWith('/discover') ||
    pathname.startsWith('/bags') ||
    pathname.startsWith('/waitlist') ||
    pathname.startsWith('/onboarding') ||
    pathname === '/merchant/onboarding' ||
    pathname.startsWith('/loading') ||
    pathname.startsWith('/state') ||
    pathname.startsWith('/error') ||
    pathname.startsWith('/prototype');

  // If no user and trying to access a protected route
  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // If we have a user, check their role for RBAC
  if (user) {
    // We should ideally cache this or use JWT claims, but for MVP we fetch from profile
    let profileRole = null;
    let isSuspended = false;
    if (user?.id) {
      const { data } = await supabase
        .from('profiles')
        .select('role, is_suspended')
        .eq('id', user.id)
        .maybeSingle();
      profileRole = data?.role || null;
      if (data?.is_suspended === true) isSuspended = true;
    }

    // Some seeded QA accounts may have profile rows keyed by email instead of auth UUID.
    if (!profileRole && user?.email) {
      const { data } = await supabase
        .from('profiles')
        .select('role, is_suspended')
        .eq('email', user.email)
        .maybeSingle();
      profileRole = data?.role || profileRole;
      if (data?.is_suspended === true) isSuspended = true;
    }

    const metadataRole = user.app_metadata?.role || user.user_metadata?.role;
    const qaEmailRole =
      user?.email === 'qa.admin@freshasever.test'
        ? 'admin'
        : user?.email === 'qa.merchant@freshasever.test'
          ? 'merchant_staff'
          : null;
    const normalizedRole = (profileRole || metadataRole || qaEmailRole || 'customer').toLowerCase();
    const role = normalizedRole === 'merchant' ? 'merchant_staff' : normalizedRole;

    if (
      role === 'customer' &&
      isSuspended === true &&
      pathname.startsWith('/checkout')
    ) {
      const suspUrl = request.nextUrl.clone();
      suspUrl.pathname = '/profile';
      suspUrl.search = '?suspended=1';
      return NextResponse.redirect(suspUrl);
    }

    // If user is at login page but already logged in, redirect to their home
    if (pathname === '/login') {
      const url = request.nextUrl.clone();
      if (role === 'admin') url.pathname = '/admin/dashboard';
      else if (role === 'merchant_staff') url.pathname = '/merchant/dashboard';
      else url.pathname = '/discover';
      return NextResponse.redirect(url);
    }

    // Protect Admin routes
    if (pathname.startsWith('/admin') && role !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/discover'; // Fallback
      return NextResponse.redirect(url);
    }

    // Protect Merchant routes
    const merchantWhitelist = new Set(['/merchant/onboarding']);
    if (pathname.startsWith('/merchant') && !merchantWhitelist.has(pathname) && role !== 'merchant_staff' && role !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/discover';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Public files (images, manifest, sw, icons)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$|manifest\\.json|sw\\.js|icons/).*)',
  ],
};
