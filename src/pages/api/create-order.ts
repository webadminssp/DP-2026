import type { APIRoute } from 'astro';
import Razorpay from 'razorpay';

export const prerender = false;

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const POST: APIRoute = async ({ request }) => {
  let payload: { amount?: unknown; currency?: unknown; receipt?: unknown };

  try {
    payload = await request.json();
  } catch {
    return json({ error: 'Invalid JSON payload.' }, 400);
  }

  const amount = Number(payload.amount);
  const currency = typeof payload.currency === 'string' ? payload.currency.trim().toUpperCase() : 'INR';
  const receipt = typeof payload.receipt === 'string' ? payload.receipt.trim() : '';

  if (!Number.isInteger(amount) || amount < 100) {
    return json({ error: 'Amount must be an integer of at least 100 paise.' }, 400);
  }

  if (currency !== 'INR') {
    return json({ error: 'Only INR payments are supported.' }, 400);
  }

  const keyId = import.meta.env.RAZORPAY_KEY_ID;
  const keySecret = import.meta.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    console.error('Razorpay credentials are not configured.');
    return json({ error: 'Payment service is not configured.' }, 500);
  }

  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

  try {
    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt: receipt || `pujo_${Date.now()}`,
    });

    return json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: keyId,
    });
  } catch (error: any) {
    const statusCode = Number(error?.statusCode ?? error?.response?.status);
    const description = error?.error?.description ?? error?.response?.data?.error?.description;

    console.error('Razorpay order creation failed:', description ?? error);

    if (statusCode === 401) {
      return json({ error: 'Payment service authentication failed.' }, 401);
    }

    return json({ error: 'Unable to create a payment order. Please try again.' }, 500);
  }
};
