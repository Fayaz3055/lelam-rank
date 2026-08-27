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
          .single();

        if (profile?.role === 'admin') {
          return NextResponse.json({ authenticated: true, role: 'admin' });
        }
      }
    }

    return NextResponse.json({ authenticated: false }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
