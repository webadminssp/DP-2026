import type { APIRoute } from 'astro';
import { createHmac, timingSafeEqual } from 'node:crypto';

export const prerender = false;

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const POST: APIRoute = async ({ request }) => {
  let payload: {
    razorpay_payment_id?: unknown;
    razorpay_order_id?: unknown;
    razorpay_signature?: unknown;
  };

  try {
    payload = await request.json();
  } catch {
    return json({ error: 'Invalid JSON payload.' }, 400);
  }

  const paymentId = typeof payload.razorpay_payment_id === 'string' ? payload.razorpay_payment_id.trim() : '';
  const orderId = typeof payload.razorpay_order_id === 'string' ? payload.razorpay_order_id.trim() : '';
  const signature = typeof payload.razorpay_signature === 'string' ? payload.razorpay_signature.trim() : '';

  if (!paymentId || !orderId || !signature) {
    return json({ error: 'Missing payment verification fields.' }, 400);
  }

  const keySecret = import.meta.env.RAZORPAY_KEY_SECRET;

  if (!keySecret) {
    console.error('Razorpay key secret is not configured.');
    return json({ error: 'Payment service is not configured.' }, 500);
  }

  const generatedSignature = createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  const expected = Buffer.from(generatedSignature, 'utf8');
  const received = Buffer.from(signature, 'utf8');

  const isValid = expected.length === received.length && timingSafeEqual(expected, received);

  if (!isValid) {
    return json({ success: false, error: 'Payment signature verification failed.' }, 400);
  }

  return json({ success: true, payment_id: paymentId, order_id: orderId });
};
