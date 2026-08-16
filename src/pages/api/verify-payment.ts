import type { APIRoute } from 'astro';
import Razorpay from 'razorpay';
import { verifyHmacSha256, verifyOrderProof } from '../../lib/payment-security';

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
    order_proof?: unknown;
  };

  try {
    payload = await request.json();
  } catch {
    return json({ error: 'Invalid JSON payload.' }, 400);
  }

  const paymentId = typeof payload.razorpay_payment_id === 'string' ? payload.razorpay_payment_id.trim() : '';
  const orderId = typeof payload.razorpay_order_id === 'string' ? payload.razorpay_order_id.trim() : '';
  const signature = typeof payload.razorpay_signature === 'string' ? payload.razorpay_signature.trim() : '';
  const orderProof = typeof payload.order_proof === 'string' ? payload.order_proof.trim() : '';

  if (!paymentId || !orderId || !signature || !orderProof) {
    return json({ error: 'Missing payment verification fields.' }, 400);
  }

  const keyId = import.meta.env.RAZORPAY_KEY_ID;
  const keySecret = import.meta.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    console.error('Razorpay credentials are not configured.');
    return json({ error: 'Payment service is not configured.' }, 500);
  }

  const trustedOrder = verifyOrderProof(orderProof, keySecret);
  if (!trustedOrder || trustedOrder.order_id !== orderId) {
    return json({ success: false, error: 'Invalid or expired order proof.' }, 400);
  }

  const paymentMessage = `${trustedOrder.order_id}|${paymentId}`;
  if (!verifyHmacSha256(paymentMessage, signature, keySecret)) {
    return json({ success: false, error: 'Payment signature verification failed.' }, 400);
  }

  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

  try {
    const payment = (await razorpay.payments.fetch(paymentId)) as any;

    if (
      payment?.order_id !== trustedOrder.order_id ||
      Number(payment?.amount) !== trustedOrder.amount ||
      String(payment?.currency ?? '').toUpperCase() !== trustedOrder.currency
    ) {
      console.error('Razorpay payment does not match the trusted order.', {
        paymentId,
        orderId: trustedOrder.order_id,
      });
      return json({ success: false, error: 'Payment details do not match the trusted order.' }, 400);
    }

    const paymentCaptured = payment?.captured === true || payment?.status === 'captured';
    if (!paymentCaptured) {
      return json(
        {
          success: false,
          pending: true,
          error: 'Payment is authenticated but is still awaiting capture.',
        },
        202,
      );
    }

    const order = (await razorpay.orders.fetch(trustedOrder.order_id)) as any;
    const orderPaid =
      order?.status === 'paid' &&
      Number(order?.amount) === trustedOrder.amount &&
      Number(order?.amount_paid) >= trustedOrder.amount &&
      String(order?.currency ?? '').toUpperCase() === trustedOrder.currency;

    if (!orderPaid) {
      return json(
        {
          success: false,
          pending: true,
          error: 'Payment is captured but the order is still being finalised.',
        },
        202,
      );
    }

    return json({
      success: true,
      captured: true,
      payment_id: paymentId,
      order_id: trustedOrder.order_id,
      amount: trustedOrder.amount,
      currency: trustedOrder.currency,
    });
  } catch (error: any) {
    const statusCode = Number(error?.statusCode ?? error?.response?.status);
    const description = error?.error?.description ?? error?.response?.data?.error?.description;

    console.error('Razorpay payment status verification failed:', description ?? error);

    if (statusCode === 401) {
      return json({ success: false, error: 'Payment service authentication failed.' }, 401);
    }

    return json({ success: false, error: 'Unable to confirm payment status with Razorpay.' }, 502);
  }
};
