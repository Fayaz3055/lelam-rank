import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get('lelam_admin_session')?.value;

    if (adminSession === 'authenticated_admin') {
      return NextResponse.json({ authenticated: true, role: 'admin' });
    }

    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle();

        const configuredAdminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
        const userEmail = (data.user.email || '').trim().toLowerCase();

        if (
          profile?.role === 'admin' ||
          data.user.user_metadata?.role === 'admin' ||
          (configuredAdminEmail && userEmail === configuredAdminEmail)
        ) {
          return NextResponse.json({ authenticated: true, role: 'admin', user: { id: data.user.id, email: data.user.email } });
        }
      }
    }

    return NextResponse.json({ authenticated: false }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
