import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * OAuth redirect target for Google / Apple (Supabase Auth PKCE).
 * Add this URL in Supabase → Authentication → URL configuration → Redirect URLs.
 */
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/discover';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const login = new URL('/login', origin);
      login.searchParams.set('error', 'oauth');
      return NextResponse.redirect(login);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
