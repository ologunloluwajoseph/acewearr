/**
 * Paystack Configuration
 * 
 * In production, set these in your .env file:
 * PAYSTACK_SECRET_KEY=sk_live_xxxxxxxxxxxxx
 * PAYSTACK_PUBLIC_KEY=pk_live_xxxxxxxxxxxxx
 * PAYSTACK_CALLBACK_URL=https://yourdomain.com/api/checkout/verify
 * 
 * For testing, use the test keys:
 * PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxx
 * PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx
 */

export const PAYSTACK_CONFIG = {
  // Demo keys — replace with real keys in production
  secretKey: process.env.PAYSTACK_SECRET_KEY || "sk_test_demo",
  publicKey: process.env.PAYSTACK_PUBLIC_KEY || "pk_test_demo",
  baseUrl: "https://api.paystack.co",
  callbackUrl: process.env.PAYSTACK_CALLBACK_URL || "http://localhost:3000/api/checkout/verify",
};

/**
 * Initialize a Paystack transaction
 * POST to https://api.paystack.co/transaction/initialize
 */
export async function initializeTransaction(params: {
  email: string;
  amount: number; // in kobo (1 NGN = 100 kobo, 1 USD = 100 cents)
  reference: string;
  currency?: string; // NGN, USD, GHS, ZAR
  callback_url?: string;
  metadata?: Record<string, any>;
}) {
  const response = await fetch(`${PAYSTACK_CONFIG.baseUrl}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_CONFIG.secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: params.email,
      amount: params.amount,
      reference: params.reference,
      currency: params.currency || "NGN",
      callback_url: params.callback_url || PAYSTACK_CONFIG.callbackUrl,
      metadata: params.metadata,
    }),
  });

  const data = await response.json();
  
  if (!data.status) {
    throw new Error(data.message || "Paystack initialization failed");
  }

  return {
    authorizationUrl: data.data.authorization_url,
    accessCode: data.data.access_code,
    reference: data.data.reference,
  };
}

/**
 * Verify a Paystack transaction
 * GET https://api.paystack.co/transaction/verify/:reference
 */
export async function verifyTransaction(reference: string) {
  const response = await fetch(
    `${PAYSTACK_CONFIG.baseUrl}/transaction/verify/${reference}`,
    {
      headers: {
        Authorization: `Bearer ${PAYSTACK_CONFIG.secretKey}`,
      },
    }
  );

  const data = await response.json();

  if (!data.status) {
    return { verified: false, error: data.message || "Verification failed" };
  }

  const tx = data.data;
  return {
    verified: tx.status === "success",
    reference: tx.reference,
    amount: tx.amount,
    currency: tx.currency,
    customerEmail: tx.customer?.email,
    paidAt: tx.paid_at,
    channel: tx.channel,
    metadata: tx.metadata,
  };
}

/**
 * Format amount for Paystack (convert to kobo/cents)
 * Paystack requires amounts in the smallest currency unit:
 *   NGN: 1 Naira = 100 kobo
 *   USD: 1 Dollar = 100 cents
 */
export function toPaystackAmount(amountInMajorUnit: number, currency: string = "NGN"): number {
  return Math.round(amountInMajorUnit * 100);
}

/**
 * Generate a unique reference for Paystack transactions
 */
export function generateReference(prefix: string = "AW"): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}
