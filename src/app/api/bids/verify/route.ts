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
      amount,
      bidderId,
      bidderName,
      bidderEmail,
      visibility,
    } = body;

    const supabase = await createServerSupabaseClient();
    let verifiedBidderId = bidderId;

    if (supabase) {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
        return NextResponse.json(
          { error: 'Authentication required. You must sign in to complete bid verification.' },
          { status: 401 }
        );
      }
      if (!authData.user.email_confirmed_at) {
        return NextResponse.json(
          { error: 'Email verification required before recording a verified bid.' },
          { status: 403 }
        );
      }
      verifiedBidderId = authData.user.id;
    }

    if (!entryId) {
      return NextResponse.json(
        { error: 'Entry ID is required for bid verification.' },
        { status: 400 }
      );
    }

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount < 50) {
      return NextResponse.json(
        { error: 'Valid bid amount (>= ₹50) is required.' },
        { status: 400 }
      );
    }

    const secret = process.env.RAZORPAY_KEY_SECRET || 'test_secret_sandbox';
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

    // Atomically place verified bid in database
    const result = await dbService.placeVerifiedBid({
      entryId,
      amount: numericAmount,
      bidder_id: verifiedBidderId,
      bidder_name: bidderName,
      visibility: visibility || 'public',
    });

    const entry = await dbService.getEntryBySlug(entryId) || (await dbService.getLeaderboardEntries()).find(e => e.id === entryId);

    // Send confirmation email asynchronously
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
