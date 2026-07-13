import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization') || '';
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET') || '';

    if (!supabaseUrl || !anonKey || !serviceRoleKey || !razorpayKeySecret) {
      throw new Error('Payment verification environment variables are missing.');
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: userData, error: userError } = await userClient.auth.getUser();

    if (userError || !userData.user) {
      return json({ message: 'Unauthorized' }, 401);
    }

    const payload = await req.json();
    const razorpayOrderId = String(payload?.razorpay_order_id || '');
    const razorpayPaymentId = String(payload?.razorpay_payment_id || '');
    const razorpaySignature = String(payload?.razorpay_signature || '');

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return json({ message: 'Missing Razorpay verification fields.' }, 400);
    }

    const expectedSignature = await hmacSha256(`${razorpayOrderId}|${razorpayPaymentId}`, razorpayKeySecret);
    if (!timingSafeEqual(expectedSignature, razorpaySignature)) {
      await adminClient.from('payments').update({
        status: 'FAILED',
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: '',
        payment_payload: { verification_error: 'Invalid Razorpay signature' },
      }).eq('razorpay_order_id', razorpayOrderId).eq('userid', userData.user.id);

      return json({ message: 'Invalid Razorpay payment signature.' }, 400);
    }

    const { data: payment, error: paymentError } = await adminClient
      .from('payments')
      .update({
        status: 'SUCCESS',
        razorpay_payment_id: razorpayPaymentId,
        razorpay_order_id: razorpayOrderId,
        razorpay_signature: razorpaySignature,
        payment_payload: {
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: razorpayPaymentId,
        },
      })
      .eq('razorpay_order_id', razorpayOrderId)
      .eq('userid', userData.user.id)
      .select('*')
      .single();

    if (paymentError) throw paymentError;

    if (payment?.plan && payment.plan !== 'ADVERTISEMENT_POST') {
      const start = new Date();
      const end = new Date(start);
      end.setFullYear(end.getFullYear() + 1);
      const subscriptionPatch = {
        subscription_start_date: start.toISOString(),
        subscription_end_date: end.toISOString(),
        expires_at: end.toISOString(),
      };

      await adminClient
        .from('payments')
        .update(subscriptionPatch)
        .eq('id', payment.id);

      await adminClient
        .from('profiles')
        .update({
          subscription_plan: payment.plan,
          subscription_start_date: subscriptionPatch.subscription_start_date,
          subscription_end_date: subscriptionPatch.subscription_end_date,
        })
        .eq('id', userData.user.id);
    }

    return json({ verified: true, data: payment });
  } catch (error) {
    return json({ message: error?.message || 'Payment verification failed.' }, 500);
  }
});

async function hmacSha256(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
