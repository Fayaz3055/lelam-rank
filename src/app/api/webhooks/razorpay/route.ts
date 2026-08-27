import { NextResponse } from 'next/server';
import { verifyRazorpayWebhookSignature } from '@/lib/razorpay';
import { dbService } from '@/services/db';
import { emailService } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'test_webhook_secret';

    // Verify webhook signature
    if (signature && webhookSecret && !webhookSecret.includes('placeholder')) {
      const isValid = verifyRazorpayWebhookSignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
      }
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;

    // Handle payment.captured or order.paid
    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id;
      const paymentId = paymentEntity?.id;
      const amount = paymentEntity?.amount ? paymentEntity.amount / 100 : 0;
      const entryId = paymentEntity?.notes?.entryId;
      const userEmail = paymentEntity?.email;

      if (entryId && amount >= 50) {
        try {
          const result = await dbService.placeVerifiedBid({
            entryId,
            amount,
            bidder_name: paymentEntity?.notes?.bidderName || undefined,
            visibility: paymentEntity?.notes?.visibility || 'public',
          });

          const entry = (await dbService.getLeaderboardEntries()).find((e) => e.id === entryId);
          if (userEmail && entry) {
            emailService.sendBidConfirmedEmail({
              toEmail: userEmail,
              entryName: entry.name,
              entrySlug: entry.slug,
              bidAmount: amount,
              newRank: result.newRank,
            }).catch(console.error);
          }
        } catch (dbErr) {
          console.error('[Webhook processing error]:', dbErr);
        }
      }
    }

    return NextResponse.json({ received: true, status: 'processed' });
  } catch (error) {
    console.error('[Webhook error]:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
