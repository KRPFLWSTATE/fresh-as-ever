import { updateSession } from '@/lib/supabase/middleware';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  const { supabaseResponse, user, supabase } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Public paths that don't need auth checking
  const isPublicPath = pathname === '/' || pathname.startsWith('/auth') || pathname === '/login' || pathname === '/merchant/onboarding';

  // If no user and trying to access a protected route
  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // If we have a user, check their role for RBAC
  if (user) {
    // We should ideally cache this or use JWT claims, but for MVP we fetch from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role || 'customer';

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
