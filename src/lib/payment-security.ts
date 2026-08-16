import { createHmac, timingSafeEqual } from 'node:crypto';

export type OrderProofPayload = {
  v: 1;
  order_id: string;
  amount: number;
  currency: string;
  exp: number;
};

const ORDER_PROOF_TTL_SECONDS = 60 * 60;

const safeEqual = (expected: string, received: string) => {
  const expectedBuffer = Buffer.from(expected, 'utf8');
  const receivedBuffer = Buffer.from(received, 'utf8');

  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
};

const orderProofSignature = (encodedPayload: string, keySecret: string) => {
  // Domain-separate this internal proof from Razorpay's own HMAC messages.
  const derivedKey = createHmac('sha256', keySecret)
    .update('ssdpc-order-proof-v1')
    .digest();

  return createHmac('sha256', derivedKey)
    .update(encodedPayload)
    .digest('hex');
};

export const createOrderProof = (
  order: { order_id: string; amount: number; currency: string },
  keySecret: string,
) => {
  const payload: OrderProofPayload = {
    v: 1,
    order_id: order.order_id,
    amount: order.amount,
    currency: order.currency,
    exp: Math.floor(Date.now() / 1000) + ORDER_PROOF_TTL_SECONDS,
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = orderProofSignature(encodedPayload, keySecret);

  return `${encodedPayload}.${signature}`;
};

export const verifyOrderProof = (
  proof: string,
  keySecret: string,
): OrderProofPayload | null => {
  const [encodedPayload, signature, extra] = proof.split('.');
  if (!encodedPayload || !signature || extra) return null;

  const expectedSignature = orderProofSignature(encodedPayload, keySecret);
  if (!safeEqual(expectedSignature, signature)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8'),
    ) as Partial<OrderProofPayload>;

    const now = Math.floor(Date.now() / 1000);

    if (
      payload.v !== 1 ||
      typeof payload.order_id !== 'string' ||
      !payload.order_id ||
      !Number.isInteger(payload.amount) ||
      Number(payload.amount) < 100 ||
      typeof payload.currency !== 'string' ||
      !payload.currency ||
      !Number.isInteger(payload.exp) ||
      Number(payload.exp) <= now
    ) {
      return null;
    }

    return payload as OrderProofPayload;
  } catch {
    return null;
  }
};

export const verifyHmacSha256 = (
  message: string,
  receivedSignature: string,
  secret: string,
) => {
  const expectedSignature = createHmac('sha256', secret)
    .update(message)
    .digest('hex');

  return safeEqual(expectedSignature, receivedSignature);
};
