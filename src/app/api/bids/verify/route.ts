import { NextResponse } from 'next/server';
import { verifyRazorpaySignature } from '@/lib/razorpay';
import { dbService } from '@/services/db';
import { emailService } from '@/lib/email';
import { createServerSupabaseClient } from '@/lib/supabase/server';

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
          { error: 'Authentication required. You must sign in to complete bid verification.' },
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

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount < 50) {
      return NextResponse.json(
        { error: 'Valid bid amount (>= ₹50) is required.' },
        { status: 400 }
      );
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing Razorpay payment identifiers (order_id, payment_id, signature).' },
        { status: 400 }
      );
    }

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

    // 1. Scenario A: Claiming a new spot (Entry Creation)
    if (entryData && (entryId === 'new_entry' || !entryId)) {
      const result = await dbService.createEntry({
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

      if (bidderEmail) {
        emailService.sendBidConfirmedEmail({
          toEmail: bidderEmail,
          entryName: result.entry.name,
          entrySlug: result.entry.slug,
          bidAmount: numericAmount,
          newRank: result.rank,
        }).catch(console.error);
      }

      return NextResponse.json({
        success: true,
        verified: true,
        entry: result.entry,
        rank: result.rank,
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        message: 'Spot claimed and payment verified successfully.',
      });
    }

    // 2. Scenario B: Outbidding / Placing a verified bid on an existing entry
    if (!entryId) {
      return NextResponse.json(
        { error: 'Entry ID or entry registration data is required.' },
        { status: 400 }
      );
    }

    const result = await dbService.placeVerifiedBid({
      entryId,
      amount: numericAmount,
      bidder_id: verifiedBidderId,
      bidder_name: bidderName,
      visibility: visibility || 'public',
      paymentId: razorpay_payment_id,
    });

    const entry = await dbService.getEntryBySlug(entryId) || (await dbService.getLeaderboardEntries()).find(e => e.id === entryId);

    if (bidderEmail && entry) {
      emailService.sendBidConfirmedEmail({
        toEmail: bidderEmail,
        entryName: entry.name,
        entrySlug: entry.slug,
        bidAmount: numericAmount,
        newRank: result.newRank,
      }).catch(console.error);
    }

    return NextResponse.json({
      success: true,
      verified: true,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      newRank: result.newRank,
      oldRank: result.oldRank,
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
