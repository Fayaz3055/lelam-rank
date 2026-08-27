import crypto from 'crypto';

export interface CreateOrderParams {
  amount: number; // in INR
  entryId: string;
  entryName: string;
  userEmail?: string;
  bidderName?: string;
  visibility?: 'public' | 'anonymous';
}

export interface RazorpayOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  isTestMode: boolean;
}

export interface RazorpaySuccessHandlerArgs {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

/**
 * Loads Razorpay Standard Checkout SDK into document
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }
    if ((window as unknown as { Razorpay: unknown }).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Launches Razorpay Checkout Modal
 */
export function launchRazorpayCheckout(options: {
  orderId: string;
  amount: number; // in paise
  keyId: string;
  name: string;
  description: string;
  prefill?: {
    name?: string;
    email?: string;
  };
  onSuccess: (response: RazorpaySuccessHandlerArgs) => void;
  onDismiss?: () => void;
}): void {
  if (typeof window === 'undefined') return;

  const RazorpayConstructor = (window as unknown as { Razorpay: new (opts: unknown) => { open: () => void } }).Razorpay;
  if (!RazorpayConstructor) {
    console.error('Razorpay SDK not loaded');
    return;
  }

  const rzp = new RazorpayConstructor({
    key: options.keyId,
    amount: options.amount,
    currency: 'INR',
    name: 'LELAM RANK',
    description: options.description,
    order_id: options.orderId,
    theme: {
      color: '#D4AF37',
    },
    prefill: {
      name: options.prefill?.name || '',
      email: options.prefill?.email || '',
    },
    handler: function (response: RazorpaySuccessHandlerArgs) {
      options.onSuccess(response);
    },
    modal: {
      ondismiss: function () {
        options.onDismiss?.();
      },
    },
  });

  rzp.open();
}

/**
 * Verifies Razorpay payment signature using HMAC SHA256
 */
export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
): boolean {
  if (!orderId || !paymentId || !signature || !secret) return false;

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(`${orderId}|${paymentId}`);
  const generatedSignature = hmac.digest('hex');
  return generatedSignature === signature;
}

/**
 * Verifies Razorpay Webhook signature
 */
export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  if (!rawBody || !signature || !secret) return false;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(rawBody);
  const generatedSignature = hmac.digest('hex');
  return generatedSignature === signature;
}
