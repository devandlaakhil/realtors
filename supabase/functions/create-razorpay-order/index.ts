import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const planAmounts: Record<string, number> = {
  PROPERTY_PRO: 100,
  SERVICE_PRO: 200,
  BUSINESS_PRO: 500,
  ADVERTISEMENT_POST: 2,
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
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID') || '';
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET') || '';

    if (!supabaseUrl || !anonKey || !serviceRoleKey || !razorpayKeyId || !razorpayKeySecret) {
      throw new Error('Payment function environment variables are missing.');
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: userData, error: userError } = await userClient.auth.getUser();

    if (userError || !userData.user) {
      return json({ message: 'Unauthorized' }, 401);
    }

    const { plan } = await req.json();
    const amount = planAmounts[String(plan)] || 0;

    if (!amount) {
      return json({ message: 'Invalid payment plan.' }, 400);
    }

    const { data: payment, error: paymentError } = await adminClient
      .from('payments')
      .insert({
        userid: userData.user.id,
        plan,
        amount,
        currency: 'INR',
        status: 'PENDING',
      })
      .select('*')
      .single();

    if (paymentError) throw paymentError;

    const orderResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount * 100,
        currency: 'INR',
        receipt: payment.id,
        notes: {
          local_order_id: payment.id,
          plan,
          user_id: userData.user.id,
        },
      }),
    });

    const order = await orderResponse.json();
    if (!orderResponse.ok) {
      await adminClient.from('payments').update({
        status: 'FAILED',
        payment_payload: order,
      }).eq('id', payment.id);
      return json({ message: order?.error?.description || 'Unable to create Razorpay order.' }, 400);
    }

    const { data: updatedPayment, error: updateError } = await adminClient
      .from('payments')
      .update({
        razorpay_order_id: order.id,
        payment_payload: { razorpay_order: order },
      })
      .eq('id', payment.id)
      .select('*')
      .single();

    if (updateError) throw updateError;

    return json({
      data: updatedPayment,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        local_order_id: payment.id,
      },
      razorpayKeyId,
    });
  } catch (error) {
    return json({ message: error?.message || 'Unable to create payment order.' }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
