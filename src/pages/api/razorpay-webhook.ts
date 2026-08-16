import type { APIRoute } from 'astro';
import { verifyHmacSha256 } from '../../lib/payment-security';

export const prerender = false;

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const trackedEvents = new Set([
  'payment.captured',
  'payment.failed',
  'order.paid',
]);

export const POST: APIRoute = async ({ request }) => {
  const webhookSecret = import.meta.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('Razorpay webhook secret is not configured.');
    return json({ error: 'Webhook service is not configured.' }, 500);
  }

  const signature = request.headers.get('x-razorpay-signature')?.trim() ?? '';
  if (!signature) {
    return json({ error: 'Missing Razorpay webhook signature.' }, 400);
  }

  const rawBody = await request.text();
  if (!verifyHmacSha256(rawBody, signature, webhookSecret)) {
    console.warn('Rejected Razorpay webhook with invalid signature.');
    return json({ error: 'Invalid webhook signature.' }, 400);
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return json({ error: 'Invalid webhook JSON payload.' }, 400);
  }

  const eventName = typeof event?.event === 'string' ? event.event : '';
  if (!trackedEvents.has(eventName)) {
    return json({ received: true, ignored: true });
  }

  const payment = event?.payload?.payment?.entity;
  const order = event?.payload?.order?.entity;

  // No payment database exists in this project yet, so verified webhook events
  // are acknowledged and logged for reconciliation rather than persisted.
  console.info('Verified Razorpay webhook.', {
    event: eventName,
    paymentId: payment?.id ?? null,
    orderId: order?.id ?? payment?.order_id ?? null,
    paymentStatus: payment?.status ?? null,
  });

  return json({ received: true });
};
