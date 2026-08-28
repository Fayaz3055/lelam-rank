import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, email, password, fullName } = body || {};

    const cleanUsername = String(username || '').toLowerCase().trim().replace(/^@/, '');
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPassword = String(password || '');
    const cleanFullName = String(fullName || cleanUsername).trim();

    // 1. Format Validations
    if (!cleanUsername || cleanUsername.length < 3 || cleanUsername.length > 25) {
      return NextResponse.json(
        { success: false, error: 'Username must be between 3 and 25 characters.' },
        { status: 400 }
      );
    }
    if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
      return NextResponse.json(
        { success: false, error: 'Username can only contain letters, numbers, and underscores.' },
        { status: 400 }
      );
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }
    if (!cleanPassword || cleanPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters.' },
        { status: 400 }
      );
    }

    const admin = createAdminSupabaseClient();

    if (admin && isSupabaseConfigured) {
      // 2. Check username availability in profiles table
      const { data: existingProfile, error: profileErr } = await admin
        .from('profiles')
        .select('id, username')
        .eq('username', cleanUsername)
        .maybeSingle();

      if (existingProfile) {
        return NextResponse.json(
          { success: false, error: `Username @${cleanUsername} is already taken.` },
          { status: 400 }
        );
      }

      // 3. Create user in Supabase Auth with auto-confirm enabled
      const { data: userData, error: createErr } = await admin.auth.admin.createUser({
        email: cleanEmail,
        password: cleanPassword,
        email_confirm: true,
        user_metadata: {
          username: cleanUsername,
          full_name: cleanFullName || cleanUsername,
          role: 'user',
        },
      });

      if (createErr) {
        let msg = createErr.message;
        if (
          msg.toLowerCase().includes('already registered') ||
          msg.toLowerCase().includes('already exists') ||
          msg.toLowerCase().includes('user already exists')
        ) {
          msg = 'This email address is already registered. Please sign in instead.';
        }
        return NextResponse.json({ success: false, error: msg }, { status: 400 });
      }

      const user = userData.user;

      // 4. Ensure profile row exists in public.profiles table
      const { error: upsertErr } = await admin.from('profiles').upsert(
        {
          id: user.id,
          email: cleanEmail,
          username: cleanUsername,
          full_name: cleanFullName || cleanUsername,
          role: 'user',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

      if (upsertErr) {
        console.warn('Profile upsert notice:', upsertErr.message);
      }

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: cleanEmail,
          username: cleanUsername,
          full_name: cleanFullName || cleanUsername,
          role: 'user',
          is_anonymous: false,
          created_at: user.created_at,
        },
      });
    }

    // Fallback sandbox registration
    return NextResponse.json({
      success: true,
      user: {
        id: `user-${Date.now()}`,
        email: cleanEmail,
        username: cleanUsername,
        full_name: cleanFullName || cleanUsername,
        role: 'user',
        is_anonymous: false,
        created_at: new Date().toISOString(),
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Registration failed.';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
