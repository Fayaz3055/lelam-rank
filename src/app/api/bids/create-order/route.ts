import { NextResponse } from 'next/server';
import { dbService } from '@/services/db';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`order_${clientIp}`, 30, 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many order requests. Please wait a moment before trying again.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { amount, entryId, entryName, userId, userEmail } = body;

    const authHeader = req.headers.get('authorization');
    const bearerToken = authHeader?.replace(/^Bearer\s+/i, '').trim();

    const supabase = await createServerSupabaseClient();
    let authenticatedUser: any = null;

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
        if (bearerToken) {
          return NextResponse.json(
            { error: 'Invalid or expired session token. Please sign in again.' },
            { status: 401 }
          );
        }
        return NextResponse.json(
          { error: 'Authentication required. No active session token found. Please sign in before initiating a bid.' },
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
          { error: 'Registered account required. Guest users cannot place bids or claim spots.' },
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

    // If bidding on an existing entry, validate against holding bid
    if (entryId && entryId !== 'new_entry') {
      const entries = await dbService.getLeaderboardEntries();
      const targetEntry = entries.find((e) => e.id === entryId || e.slug === entryId);
      if (targetEntry && numericAmount <= targetEntry.current_bid) {
        return NextResponse.json(
          {
            error: `Bid must be strictly greater than current holding bid (₹${targetEntry.current_bid.toLocaleString('en-IN')})`,
          },
          { status: 400 }
        );
      }
    }

    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
    const publicKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || keyId || 'rzp_test_placeholder';

    if (keyId && keySecret && !keyId.includes('placeholder') && !keySecret.includes('placeholder')) {
      const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
      const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${authHeader}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(numericAmount * 100), // in paise (e.g. ₹500 = 50000 paise)
          currency: 'INR',
          receipt: `rcpt_${Date.now()}`,
          notes: {
            entryId: entryId || 'new_entry',
            entryName: entryName || 'New Entry',
            userId: userId || '',
            userEmail: userEmail || '',
          },
        }),
      });

      if (!rzpRes.ok) {
        const errData = await rzpRes.json().catch(() => ({}));
        const errMsg = errData.error?.description || errData.error?.reason || `Razorpay order creation failed (HTTP ${rzpRes.status})`;
        console.error('[Razorpay Order Creation Failed]:', errMsg);
        return NextResponse.json({ error: errMsg }, { status: 400 });
      }

      const orderData = await rzpRes.json();
      return NextResponse.json({
        success: true,
        orderId: orderData.id,
        amount: orderData.amount, // in paise
        currency: orderData.currency,
        keyId: publicKeyId,
        isTestMode: keyId.startsWith('rzp_test'),
      });
    }

    // In local development before Razorpay keys are configured in .env.local
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    return NextResponse.json({
      success: true,
      orderId,
      amount: Math.round(numericAmount * 100),
      currency: 'INR',
      keyId: publicKeyId,
      isTestMode: true,
    });
  } catch (error: unknown) {
    console.error('[API create-order error]:', error);
    const message = error instanceof Error ? error.message : 'Internal server error while creating payment order.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
