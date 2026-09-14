import crypto from 'node:crypto';

export interface CreateOrderParams {
  amount: number; // in INR
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrderResult {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
  isMock?: boolean;
}

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'growth_secret_key_mock';
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'webhook_secret_hash_verify';

/**
 * Checks if current credentials are real Razorpay API keys or test placeholders.
 */
export function isRazorpayConfigured(): boolean {
  return Boolean(
    RAZORPAY_KEY_ID &&
    RAZORPAY_KEY_SECRET &&
    !RAZORPAY_KEY_ID.includes('placeholder') &&
    !RAZORPAY_KEY_SECRET.includes('mock')
  );
}

/**
 * Server-authoritative Razorpay order creation.
 * If live/test Razorpay keys are configured, calls Razorpay API directly.
 * If placeholders are detected, creates a deterministic mock order for safe local testing.
 */
export async function createRazorpayOrder(params: CreateOrderParams): Promise<RazorpayOrderResult> {
  const amountInPaise = Math.round(params.amount * 100);

  if (isRazorpayConfigured()) {
    const authHeader = 'Basic ' + Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: params.currency || 'INR',
        receipt: params.receipt,
        notes: params.notes,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Razorpay API Error:', err);
      throw new Error(`Razorpay order creation failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      id: data.id,
      amount: data.amount,
      currency: data.currency,
      receipt: data.receipt,
      status: data.status,
      isMock: false,
    };
  }

  // Simulator / Local Mock order
  const simulatedId = `order_${crypto.randomBytes(8).toString('hex')}`;
  return {
    id: simulatedId,
    amount: amountInPaise,
    currency: params.currency || 'INR',
    receipt: params.receipt,
    status: 'created',
    isMock: true,
  };
}

/**
 * Server-side signature verification of Razorpay payment.
 * Computes HMAC SHA-256 over order_id|payment_id using RAZORPAY_KEY_SECRET.
 */
export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  if (!isRazorpayConfigured()) {
    // In simulator mode, verify against the simulator hash pattern or accept simulation
    const expectedMockSig = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    return signature === expectedMockSig || signature.startsWith('mock_sig_');
  }

  const generatedSignature = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return generatedSignature === signature;
}

/**
 * Validates the Razorpay Webhook signature against raw request body.
 */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  if (!signature || !RAZORPAY_WEBHOOK_SECRET) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  return expectedSignature === signature;
}
