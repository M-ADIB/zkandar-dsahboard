import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
// Set these via: supabase secrets set STRIPE_PRICE_ID_SPRINT=price_xxx
const STRIPE_PRICE_ID_SPRINT = Deno.env.get('STRIPE_PRICE_ID_SPRINT');

function getCorsHeaders(req: Request): Record<string, string> {
  const allowedOrigin = Deno.env.get('ALLOWED_ORIGIN');
  const requestOrigin = req.headers.get('origin') ?? '';
  const origin = allowedOrigin
    ? (requestOrigin === allowedOrigin ? requestOrigin : allowedOrigin)
    : requestOrigin || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is not set');

    const { product, success_url, cancel_url, customer_email } = await req.json();

    // Map product slug → Stripe Price ID
    let priceId: string | undefined;
    if (product === 'sprint') {
      priceId = STRIPE_PRICE_ID_SPRINT;
    }

    if (!priceId) {
      throw new Error(`No Stripe Price ID configured for product: "${product}". Set STRIPE_PRICE_ID_SPRINT via supabase secrets.`);
    }

    if (!success_url || !cancel_url) {
      throw new Error('success_url and cancel_url are required');
    }

    // Build Stripe Checkout Session payload
    const params = new URLSearchParams({
      'mode': 'payment',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      'success_url': success_url,
      'cancel_url': cancel_url,
      'payment_method_types[0]': 'card',
      'billing_address_collection': 'auto',
    });

    if (customer_email) {
      params.set('customer_email', customer_email);
    }

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const session = await stripeRes.json();

    if (!stripeRes.ok) {
      throw new Error(session?.error?.message ?? 'Stripe API error');
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('create-checkout-session error:', message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
