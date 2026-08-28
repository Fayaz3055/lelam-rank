import { NextResponse } from 'next/server';
import { verifyRazorpaySignature } from '@/lib/razorpay';
import { dbService } from '@/services/db';
import { emailService } from '@/lib/email';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      entryId,
      entryData,
      amount,
      bidderId,
      bidderName,
      bidderEmail,
      visibility,
    } = body;

    const authHeader = req.headers.get('authorization');
    const bearerToken = authHeader?.replace(/^Bearer\s+/i, '').trim();

    // 1. Authenticate user from session token
    const supabase = await createServerSupabaseClient();
    let authenticatedUser: any = null;
    let verifiedBidderId = bidderId;

    if (supabase) {
      if (bearerToken) {
        const { data: tokenAuth } = await supabase.auth.getUser(bearerToken);
        if (tokenAuth?.user) {
          authenticatedUser = tokenAuth.user;
        }
      }

      if (!authenticatedUser) {
        const { data: cookieAuth } = await supabase.auth.getUser();
        if (cookieAuth?.user) {
          authenticatedUser = cookieAuth.user;
        }
      }

      if (!authenticatedUser) {
        return NextResponse.json(
          { error: 'Authentication required. No active session token found. Please sign in to complete bid verification.' },
          { status: 401 }
        );
      }

      const isAnon = Boolean(
        authenticatedUser.is_anonymous ||
        authenticatedUser.app_metadata?.provider === 'anonymous' ||
        !authenticatedUser.email
      );
      if (isAnon) {
        return NextResponse.json(
          { error: 'Registered account required. Guest users cannot verify bids or create entries.' },
          { status: 403 }
        );
      }
      verifiedBidderId = authenticatedUser.id;
    }

    // 2. Validate amount (minimum ₹50)
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount < 50) {
      return NextResponse.json(
        { error: 'Valid bid amount (>= ₹50) is required.' },
        { status: 400 }
      );
    }

    // 3. Validate Razorpay payment proof identifiers
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing Razorpay payment identifiers (order_id, payment_id, signature).' },
        { status: 400 }
      );
    }

    // 4. Server-side HMAC SHA256 signature verification
    const secret = process.env.RAZORPAY_KEY_SECRET || '';
    const isValid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      secret
    );

    if (!isValid) {
      return NextResponse.json(
        { error: 'Payment signature could not be verified. No bid was recorded.' },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminSupabaseClient();

    // 5. Check duplicate payment / Idempotency
    if (adminSupabase) {
      const { data: existingPayment } = await adminSupabase
        .from('payments')
        .select('id, entry_id, amount, status')
        .eq('provider_payment_id', razorpay_payment_id)
        .maybeSingle();

      if (existingPayment) {
        const { data: existingEntry } = await adminSupabase
          .from('leaderboard_view')
          .select('*')
          .eq('entry_id', existingPayment.entry_id)
          .maybeSingle();

        return NextResponse.json({
          success: true,
          verified: true,
          already_processed: true,
          entry: existingEntry
            ? {
                id: existingEntry.entry_id,
                owner_id: existingEntry.owner_id,
                slug: existingEntry.slug,
                name: existingEntry.name,
                description: existingEntry.description,
                logo_url: existingEntry.logo_url || undefined,
                website_url: existingEntry.website_url || undefined,
                social_url: existingEntry.social_url || undefined,
                status: existingEntry.status,
                featured: existingEntry.featured,
                current_bid: Number(existingEntry.current_bid),
                current_rank: Number(existingEntry.rank),
                created_at: existingEntry.entry_created_at,
                updated_at: existingEntry.first_highest_bid_at || existingEntry.entry_created_at,
              }
            : null,
          rank: existingEntry?.rank ? Number(existingEntry.rank) : 1,
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          message: 'Payment already verified and processed.',
        });
      }
    }

    // 6. SCENARIO A: Claiming a new spot (Entry Creation)
    if (entryData && (entryId === 'new_entry' || !entryId)) {
      if (!entryData.name || !entryData.slug || !entryData.description) {
        return NextResponse.json(
          { error: 'Name, slug, and description are required to create a new entry.' },
          { status: 400 }
        );
      }

      let createdEntryResult: any = null;
      let calculatedRank = 1;

      if (adminSupabase) {
        // A. Insert into entries
        const { data: insertedEntry, error: insertError } = await adminSupabase
          .from('entries')
          .insert({
            name: entryData.name.trim(),
            slug: entryData.slug.toLowerCase().trim(),
            description: entryData.description.trim(),
            logo_url: entryData.logo_url?.trim() || null,
            website_url: entryData.website_url?.trim() || null,
            social_url: entryData.social_url?.trim() || null,
            current_bid: numericAmount,
            status: 'active',
            owner_id: verifiedBidderId,
          })
          .select()
          .single();

        if (insertError) {
          throw new Error(`Failed to publish entry: ${insertError.message}`);
        }

        // B. Insert into payments
        const { data: insertedPayment, error: payError } = await adminSupabase
          .from('payments')
          .insert({
            user_id: verifiedBidderId,
            entry_id: insertedEntry.id,
            amount: numericAmount,
            provider: 'razorpay',
            provider_order_id: razorpay_order_id,
            provider_payment_id: razorpay_payment_id,
            status: 'verified',
          })
          .select()
          .single();

        if (payError) {
          throw new Error(`Failed to record verified payment: ${payError.message}`);
        }

        // C. Insert into bids
        const { data: insertedBid, error: bidError } = await adminSupabase
          .from('bids')
          .insert({
            entry_id: insertedEntry.id,
            bidder_id: verifiedBidderId,
            bidder_name: bidderName?.trim() || entryData.name.trim(),
            amount: numericAmount,
            payment_id: insertedPayment.id,
            visibility: visibility || 'public',
            verified_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (bidError) {
          console.warn('Bid record insert note:', bidError.message);
        }

        // D. Fetch updated rank from leaderboard_view
        const { data: rankView } = await adminSupabase
          .from('leaderboard_view')
          .select('rank')
          .eq('entry_id', insertedEntry.id)
          .maybeSingle();

        calculatedRank = rankView?.rank ? Number(rankView.rank) : 1;

        // E. Log activity event
        await adminSupabase.from('activity').insert({
          entry_id: insertedEntry.id,
          event_type: 'new_entry',
          bid_id: insertedBid?.id || null,
          amount: numericAmount,
          metadata: {
            entry_name: insertedEntry.name,
            entry_slug: insertedEntry.slug,
            new_rank: calculatedRank,
          },
        });

        createdEntryResult = {
          id: insertedEntry.id,
          owner_id: insertedEntry.owner_id,
          slug: insertedEntry.slug,
          name: insertedEntry.name,
          description: insertedEntry.description,
          logo_url: insertedEntry.logo_url || undefined,
          website_url: insertedEntry.website_url || undefined,
          social_url: insertedEntry.social_url || undefined,
          status: insertedEntry.status,
          featured: insertedEntry.featured,
          current_bid: Number(insertedEntry.current_bid),
          current_rank: calculatedRank,
          created_at: insertedEntry.created_at,
          updated_at: insertedEntry.updated_at,
        };
      } else {
        // Fallback for offline sandbox testing
        const fallbackResult = await dbService.createEntry({
          name: entryData.name,
          slug: entryData.slug,
          description: entryData.description,
          logo_url: entryData.logo_url,
          website_url: entryData.website_url,
          social_url: entryData.social_url,
          initial_bid: numericAmount,
          owner_id: verifiedBidderId,
          bidder_name: bidderName || entryData.name,
          visibility: visibility || 'public',
        });
        createdEntryResult = fallbackResult.entry;
        calculatedRank = fallbackResult.rank;
      }

      if (bidderEmail) {
        emailService.sendBidConfirmedEmail({
          toEmail: bidderEmail,
          entryName: createdEntryResult.name,
          entrySlug: createdEntryResult.slug,
          bidAmount: numericAmount,
          newRank: calculatedRank,
        }).catch(console.error);
      }

      return NextResponse.json({
        success: true,
        verified: true,
        entry: createdEntryResult,
        rank: calculatedRank,
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        message: 'Spot claimed and payment verified successfully.',
      });
    }

    // 7. SCENARIO B: Outbidding / Placing a verified bid on an existing entry
    if (!entryId) {
      return NextResponse.json(
        { error: 'Entry ID or entry registration data is required.' },
        { status: 400 }
      );
    }

    let newRank = 1;
    let oldRank = 99;

    if (adminSupabase) {
      // A. Insert into payments
      const { data: insertedPayment, error: payError } = await adminSupabase
        .from('payments')
        .insert({
          user_id: verifiedBidderId,
          entry_id: entryId,
          amount: numericAmount,
          provider: 'razorpay',
          provider_order_id: razorpay_order_id,
          provider_payment_id: razorpay_payment_id,
          status: 'verified',
        })
        .select()
        .single();

      if (payError) {
        throw new Error(`Failed to record verified payment: ${payError.message}`);
      }

      // B. Call atomic place_verified_bid RPC
      const { data: rpcResult, error: rpcError } = await adminSupabase.rpc('place_verified_bid', {
        p_entry_id: entryId,
        p_bidder_id: verifiedBidderId,
        p_amount: numericAmount,
        p_payment_id: insertedPayment.id,
        p_bidder_name: bidderName,
        p_visibility: visibility || 'public',
      });

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      newRank = rpcResult?.new_rank ? Number(rpcResult.new_rank) : 1;
      oldRank = rpcResult?.old_rank ? Number(rpcResult.old_rank) : 99;
    } else {
      // Fallback for offline sandbox testing
      const fallbackResult = await dbService.placeVerifiedBid({
        entryId,
        amount: numericAmount,
        bidder_id: verifiedBidderId,
        bidder_name: bidderName,
        visibility: visibility || 'public',
        paymentId: razorpay_payment_id,
      });
      newRank = fallbackResult.newRank;
      oldRank = fallbackResult.oldRank;
    }

    const entry = await dbService.getEntryBySlug(entryId) || (await dbService.getLeaderboardEntries()).find(e => e.id === entryId);

    if (bidderEmail && entry) {
      emailService.sendBidConfirmedEmail({
        toEmail: bidderEmail,
        entryName: entry.name,
        entrySlug: entry.slug,
        bidAmount: numericAmount,
        newRank: newRank,
      }).catch(console.error);
    }

    return NextResponse.json({
      success: true,
      verified: true,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      newRank: newRank,
      oldRank: oldRank,
      message: 'Payment verified and bid recorded successfully.',
    });
  } catch (error: unknown) {
    console.error('[API verify error]:', error);
    const message = error instanceof Error ? error.message : 'Payment verification failed.';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
