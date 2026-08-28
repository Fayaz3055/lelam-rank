import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isSupabaseConfigured } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { emailOrUsername, password } = body || {};

    const input = String(emailOrUsername || '').trim().toLowerCase();
    const cleanPassword = String(password || '');

    if (!input) {
      return NextResponse.json(
        { success: false, error: 'Please enter your email or username.' },
        { status: 400 }
      );
    }

    if (!cleanPassword) {
      return NextResponse.json(
        { success: false, error: 'Please enter your password.' },
        { status: 400 }
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (url && anonKey && isSupabaseConfigured) {
      const supabase = createClient(url, anonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });

      let targetEmail = input;

      // If user typed a username without @, look up the email
      if (!input.includes('@')) {
        const cleanUser = input.replace(/^@/, '');
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', cleanUser)
          .maybeSingle();

        if (profile?.email) {
          targetEmail = profile.email;
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: cleanPassword,
      });

      if (error) {
        let friendly = error.message;
        if (
          error.message.toLowerCase().includes('invalid login credentials') ||
          error.message.toLowerCase().includes('invalid credentials')
        ) {
          friendly = 'Invalid email/username or password. Please check your credentials.';
        } else if (error.message.toLowerCase().includes('email not confirmed')) {
          friendly = 'Please register a new account or contact support.';
        }
        return NextResponse.json({ success: false, error: friendly }, { status: 400 });
      }

      const user = data.user;

      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, full_name, role')
        .eq('id', user.id)
        .maybeSingle();

      const username = profile?.username || user.user_metadata?.username || user.email?.split('@')[0];
      const role = profile?.role || user.user_metadata?.role || (user.email?.includes('admin') ? 'admin' : 'user');

      return NextResponse.json({
        success: true,
        session: data.session,
        user: {
          id: user.id,
          email: user.email || targetEmail,
          username,
          full_name: profile?.full_name || user.user_metadata?.full_name || username,
          role: role as 'user' | 'admin',
          is_anonymous: false,
          created_at: user.created_at,
        },
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: `user-${Date.now()}`,
        email: input.includes('@') ? input : `${input}@example.com`,
        username: input.replace(/@.*$/, ''),
        full_name: input.split('@')[0],
        role: 'user',
        is_anonymous: false,
        created_at: new Date().toISOString(),
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Sign in failed.';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
