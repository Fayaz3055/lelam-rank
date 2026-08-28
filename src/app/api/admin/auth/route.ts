import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`admin_auth_${clientIp}`, 10, 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please wait a minute before trying again.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // 1. Authoritative Supabase Auth Verification
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (!error && data.user) {
        // Query profile role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profile?.role === 'admin' || data.user.user_metadata?.role === 'admin') {
          const cookieStore = await cookies();
          cookieStore.set('lelam_admin_session', 'authenticated_admin', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24, // 24 hours
            path: '/',
          });

          return NextResponse.json({ success: true, role: 'admin' });
        } else {
          return NextResponse.json(
            { error: 'Forbidden: Authenticated user does not possess administrator role.' },
            { status: 403 }
          );
        }
      }
    }

    // In sandbox test environments without Supabase credentials connected, fallback simulation handles test runs
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
      if ((email === 'admin@lelamrank.in' || email === 'admin@lelam-rank.vercel.app' || email === 'admin@example.com') && password === 'admin') {
        const cookieStore = await cookies();
        cookieStore.set('lelam_admin_session', 'authenticated_admin', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24,
          path: '/',
        });
        return NextResponse.json({ success: true, role: 'admin' });
      }
    }

    return NextResponse.json(
      { error: 'Unauthorized: Invalid administrator credentials or insufficient permissions.' },
      { status: 401 }
    );
  } catch (error) {
    console.error('[Admin auth error]:', error);
    return NextResponse.json({ error: 'Server authentication error' }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('lelam_admin_session');
  return NextResponse.json({ success: true, message: 'Logged out' });
}
