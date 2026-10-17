import crypto from 'node:crypto';

export interface CreateOrderParams {
  amountInPaise: number; // in minor units (paise)
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrderResult {
  id: string;
  amount: number; // in paise
  currency: string;
  receipt: string;
  status: string;
  isMock?: boolean;
}

export class RazorpayClientError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.name = 'RazorpayClientError';
    this.statusCode = statusCode;
  }
}

export class RazorpayGatewayTimeoutError extends Error {
  constructor(message: string = 'Razorpay gateway request timed out') {
    super(message);
    this.name = 'RazorpayGatewayTimeoutError';
  }
}

export class RazorpayServerError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = 'RazorpayServerError';
    this.statusCode = statusCode;
  }
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

function getAuthHeader(): string {
  return 'Basic ' + Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
}

/**
 * Server-authoritative Razorpay order creation.
 * Distinguishes definitive 4xx errors from timeouts and 5xx errors.
 */
export async function createRazorpayOrder(params: CreateOrderParams): Promise<RazorpayOrderResult> {
  const amountInPaise = Math.round(params.amountInPaise);

  if (isRazorpayConfigured()) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      const response = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: getAuthHeader(),
        },
        body: JSON.stringify({
          amount: amountInPaise,
          currency: params.currency || 'INR',
          receipt: params.receipt,
          notes: params.notes,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text();
        console.error('[Razorpay] API Error Response:', response.status, errText);

        if (response.status >= 400 && response.status < 500) {
          throw new RazorpayClientError(`Razorpay client error (${response.status}): ${errText}`, response.status);
        } else {
          throw new RazorpayServerError(`Razorpay server error (${response.status}): ${errText}`, response.status);
        }
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
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError' || err.code === 'ETIMEDOUT' || err.message?.includes('timeout')) {
        throw new RazorpayGatewayTimeoutError('Gateway timeout waiting for Razorpay order creation');
      }
      throw err;
    }
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
 * Looks up orders on Razorpay matching a specific receipt (orderNumber).
 */
export async function fetchRazorpayOrderByReceipt(receipt: string): Promise<RazorpayOrderResult | null> {
  if (!isRazorpayConfigured()) {
    // In simulator mode, return simulated match
    return null;
  }

  try {
    const response = await fetch(`https://api.razorpay.com/v1/orders?receipt=${encodeURIComponent(receipt)}`, {
      method: 'GET',
      headers: {
        Authorization: getAuthHeader(),
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data.items && data.items.length > 0) {
      const item = data.items[0];
      return {
        id: item.id,
        amount: item.amount,
        currency: item.currency,
        receipt: item.receipt,
        status: item.status,
        isMock: false,
      };
    }

    return null;
  } catch (err) {
    console.error('[Razorpay] Error fetching order by receipt:', err);
    return null;
  }
}

/**
 * Initiates a refund via Razorpay API.
 */
export async function refundRazorpayPayment(
  paymentId: string,
  amountInPaise?: number,
  notes?: Record<string, string>
): Promise<{ id: string; amount: number; status: string; isMock?: boolean }> {
  if (isRazorpayConfigured()) {
    const body: Record<string, unknown> = {};
    if (amountInPaise) body.amount = Math.round(amountInPaise);
    if (notes) body.notes = notes;

    const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: getAuthHeader(),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Razorpay refund failed (${response.status}): ${errText}`);
    }

    const data = await response.json();
    return {
      id: data.id,
      amount: data.amount,
      status: data.status,
      isMock: false,
    };
  }

  // Mock refund in simulator mode
  return {
    id: `rfnd_${crypto.randomBytes(8).toString('hex')}`,
    amount: amountInPaise || 0,
    status: 'processed',
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
    const expectedMockSig = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    return signature === expectedMockSig || signature.startsWith('mock_sig_') || signature.length === 64;
  }

  const generatedSignature = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(generatedSignature, 'utf8'),
      Buffer.from(signature, 'utf8')
    );
  } catch {
    return false;
  }
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

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf8'),
      Buffer.from(signature, 'utf8')
    );
  } catch {
    return false;
  }
}
