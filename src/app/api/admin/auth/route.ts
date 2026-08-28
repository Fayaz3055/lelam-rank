import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
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

    const normalizedEmail = email.trim().toLowerCase();
    const configuredAdminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const supabase = await createServerSupabaseClient();

    // 1. Authoritative Supabase Auth Verification
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (!error && data.user) {
        // Query profile role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle();

        const isConfiguredAdmin = configuredAdminEmail && normalizedEmail === configuredAdminEmail;
        const isAdminRole = profile?.role === 'admin' || data.user.user_metadata?.role === 'admin';

        if (isAdminRole || isConfiguredAdmin) {
          // If configured via ADMIN_EMAIL but profile role was 'user', auto-promote in profiles table
          if (isConfiguredAdmin && profile?.role !== 'admin') {
            const adminSupabase = createAdminSupabaseClient();
            if (adminSupabase) {
              await adminSupabase
                .from('profiles')
                .update({ role: 'admin' })
                .eq('id', data.user.id);
            }
          }

          const cookieStore = await cookies();
          cookieStore.set('lelam_admin_session', 'authenticated_admin', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24, // 24 hours
            path: '/',
          });

          return NextResponse.json({
            success: true,
            role: 'admin',
            user: { id: data.user.id, email: data.user.email },
          });
        } else {
          return NextResponse.json(
            { error: 'Forbidden: This account does not possess administrator privileges.' },
            { status: 403 }
          );
        }
      }
    }

    // 2. Sandbox / Local test simulation when Supabase credentials are placeholder or not connected
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
    ) {
      const isTestAdminEmail =
        normalizedEmail === 'admin@lelamrank.in' ||
        normalizedEmail === 'admin@lelam-rank.vercel.app' ||
        normalizedEmail === 'admin@example.com' ||
        (configuredAdminEmail && normalizedEmail === configuredAdminEmail);

      if (isTestAdminEmail && (password === 'admin' || password === 'admin123' || password === 'Password123!')) {
        const cookieStore = await cookies();
        cookieStore.set('lelam_admin_session', 'authenticated_admin', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24,
          path: '/',
        });
        return NextResponse.json({
          success: true,
          role: 'admin',
          user: { id: 'admin-simulated-id', email: normalizedEmail },
        });
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
