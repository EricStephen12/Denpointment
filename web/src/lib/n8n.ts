/**
 * Fire-and-forget notifications to n8n (hosted on Railway).
 * If a webhook URL env var is unset, the call is skipped — the site still works.
 * Failures are logged and never thrown, so automations can't break bookings/payments.
 */

type N8nEvent = "booking" | "payment" | "contact";

const ENV_KEYS: Record<N8nEvent, string> = {
  booking: "N8N_WEBHOOK_BOOKING",
  payment: "N8N_WEBHOOK_PAYMENT",
  contact: "N8N_WEBHOOK_CONTACT",
};

export async function notifyN8n(
  event: N8nEvent,
  payload: Record<string, unknown>,
): Promise<void> {
  const url = process.env[ENV_KEYS[event]]?.trim();
  if (!url) return;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event,
        sentAt: new Date().toISOString(),
        ...payload,
      }),
      // Don't hang the request if n8n is slow
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) {
      console.error(`[n8n] ${event} webhook returned ${res.status}`);
    }
  } catch (error) {
    console.error(`[n8n] ${event} webhook failed:`, error);
  }
}
