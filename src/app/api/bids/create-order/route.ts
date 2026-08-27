import { NextResponse } from 'next/server';
import { dbService } from '@/services/db';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, entryId, userId, userEmail } = body;

    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
        return NextResponse.json(
          { error: 'Authentication required. You must sign in before initiating a bid.' },
          { status: 401 }
        );
      }
      if (!authData.user.email_confirmed_at) {
        return NextResponse.json(
          { error: 'Email verification required. Please confirm your email address before placing a bid.' },
          { status: 403 }
        );
      }
    }

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount < 50) {
      return NextResponse.json(
        { error: 'Minimum bid amount is ₹50.' },
        { status: 400 }
      );
    }

    if (!entryId) {
      return NextResponse.json(
        { error: 'Entry ID is required.' },
        { status: 400 }
      );
    }

    // Validate against current entry holding bid
    const entries = await dbService.getLeaderboardEntries();
    const targetEntry = entries.find((e) => e.id === entryId);
    if (targetEntry && numericAmount <= targetEntry.current_bid) {
      return NextResponse.json(
        {
          error: `Bid must be strictly greater than current bid (₹${targetEntry.current_bid.toLocaleString('en-IN')})`,
        },
        { status: 400 }
      );
    }

    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_sandbox';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'test_secret_sandbox';

    // If live Razorpay API credentials exist, create order via Razorpay API
    if (
      keyId &&
      keySecret &&
      !keyId.includes('placeholder') &&
      !keyId.includes('sandbox')
    ) {
      const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
      const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${authHeader}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(numericAmount * 100), // in paise
          currency: 'INR',
          receipt: `rcpt_${Date.now()}`,
          notes: {
            entryId,
            entryName: targetEntry?.name || 'New Entry',
            userId: userId || 'anonymous',
            userEmail: userEmail || '',
          },
        }),
      });

      if (rzpRes.ok) {
        const orderData = await rzpRes.json();
        return NextResponse.json({
          success: true,
          orderId: orderData.id,
          amount: orderData.amount,
          currency: orderData.currency,
          keyId,
          isTestMode: keyId.startsWith('rzp_test'),
        });
      }
    }

    // Test mode / sandbox order generation
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return NextResponse.json({
      success: true,
      orderId,
      amount: Math.round(numericAmount * 100),
      currency: 'INR',
      keyId,
      isTestMode: true,
    });
  } catch (error) {
    console.error('[API create-order error]:', error);
    return NextResponse.json(
      { error: 'Internal server error while creating payment order.' },
      { status: 500 }
    );
  }
}
