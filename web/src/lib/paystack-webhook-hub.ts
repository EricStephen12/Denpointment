/**
 * Shared Paystack webhook hub for Glow Dental + Smart Best Brand.
 *
 * Point Paystack's single webhook URL at Denpointment:
 *   https://denpointment-theta.vercel.app/api/webhooks/paystack
 *
 * Routing by payment reference:
 *   - treatment-*  → handled here (clinic)
 *   - ORD-*        → forwarded to STORE_PAYSTACK_WEBHOOK_URL (ecommerce)
 *
 * Both apps still verify payments on their own callback paths if this hub
 * or the forward fails.
 */

export function paystackReferenceTarget(
  reference: string | undefined,
): "clinic" | "store" | "unknown" {
  if (!reference) return "unknown";
  if (reference.startsWith("treatment-")) return "clinic";
  if (reference.startsWith("ORD-")) return "store";
  return "unknown";
}

export function getStorePaystackWebhookUrl(): string | null {
  const url = process.env.STORE_PAYSTACK_WEBHOOK_URL?.trim();
  return url || null;
}

/** Forward the exact Paystack payload so the store can re-check the signature. */
export async function forwardPaystackWebhookToStore(
  rawBody: string,
  signature: string,
): Promise<Response> {
  const url = getStorePaystackWebhookUrl();
  if (!url) {
    throw new Error(
      "STORE_PAYSTACK_WEBHOOK_URL is not set — cannot route ORD-* payments to the store.",
    );
  }

  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-paystack-signature": signature,
    },
    body: rawBody,
  });
}
