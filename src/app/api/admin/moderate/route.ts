import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { lelamStore } from '@/lib/store';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get('lelam_admin_session')?.value;

    let isAuthorizedAdmin = false;

    // 1. Check HTTP-only admin cookie
    if (adminSession === 'authenticated_admin') {
      isAuthorizedAdmin = true;
    }

    // 2. Check Supabase server session if configured
    const serverSupabase = await createServerSupabaseClient();
    if (serverSupabase) {
      const { data } = await serverSupabase.auth.getUser();
      if (data.user) {
        const { data: profile } = await serverSupabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profile?.role === 'admin' || data.user.user_metadata?.role === 'admin') {
          isAuthorizedAdmin = true;
        }
      }
    }

    if (!isAuthorizedAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have administrator permissions to moderate entries.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { entryId, action } = body;

    if (!entryId || !action) {
      return NextResponse.json(
        { error: 'Entry ID and action (activate, suspend, feature, unfeature, remove) are required.' },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminSupabaseClient();

    if (adminSupabase && UUID_REGEX.test(entryId)) {
      if (action === 'activate') {
        const { error } = await adminSupabase
          .from('entries')
          .update({ status: 'active', updated_at: new Date().toISOString() })
          .eq('id', entryId);
        if (error) throw new Error(error.message);
      } else if (action === 'suspend') {
        const { error } = await adminSupabase
          .from('entries')
          .update({ status: 'suspended', updated_at: new Date().toISOString() })
          .eq('id', entryId);
        if (error) throw new Error(error.message);
      } else if (action === 'remove') {
        const { error } = await adminSupabase
          .from('entries')
          .update({ status: 'removed', updated_at: new Date().toISOString() })
          .eq('id', entryId);
        if (error) throw new Error(error.message);
      } else if (action === 'feature') {
        const { error } = await adminSupabase
          .from('entries')
          .update({ featured: true, updated_at: new Date().toISOString() })
          .eq('id', entryId);
        if (error) throw new Error(error.message);
      } else if (action === 'unfeature') {
        const { error } = await adminSupabase
          .from('entries')
          .update({ featured: false, updated_at: new Date().toISOString() })
          .eq('id', entryId);
        if (error) throw new Error(error.message);
      } else {
        return NextResponse.json({ error: `Unknown moderation action: ${action}` }, { status: 400 });
      }
    }

    // Always update fallback store state synchronously
    if (action === 'activate' || action === 'suspend' || action === 'remove') {
      lelamStore.updateEntryStatus(entryId, action === 'remove' ? 'removed' : action === 'suspend' ? 'suspended' : 'active');
    } else if (action === 'feature' || action === 'unfeature') {
      const entry = lelamStore.getEntries().find((e) => e.id === entryId);
      if (entry && ((action === 'feature' && !entry.featured) || (action === 'unfeature' && entry.featured))) {
        lelamStore.toggleFeatured(entryId);
      }
    }

    return NextResponse.json({
      success: true,
      entryId,
      action,
      message: `Entry successfully updated via action: ${action}`,
    });
  } catch (error: unknown) {
    console.error('[Admin moderate error]:', error);
    const message = error instanceof Error ? error.message : 'Moderation failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
