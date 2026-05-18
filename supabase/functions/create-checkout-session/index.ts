import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') ?? Deno.env.get('stripe_secret_key');
const STRIPE_PRICE_ID_SPRINT = Deno.env.get('STRIPE_PRICE_ID_SPRINT');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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

    const body = await req.json();
    // Support both singular `product` (legacy) and `products` (array) from frontend
    const products: string[] = body.products ?? (body.product ? [body.product] : []);
    const { success_url, cancel_url, customer_email, customer_name } = body;

    if (!products.length) {
      throw new Error('No products specified');
    }

    if (!success_url || !cancel_url) {
      throw new Error('success_url and cancel_url are required');
    }

    // Map product slugs → Stripe Price IDs
    // For now we only have the sprint price, but this is extensible
    const priceMap: Record<string, string | undefined> = {
      'sprint': STRIPE_PRICE_ID_SPRINT,
      'webinar': STRIPE_PRICE_ID_SPRINT,  // alias
    };

    const primaryProduct = products[0];
    const isTestProduct = primaryProduct === 'test';

    // Resolve the primary product price (first product in array)
    const priceId = isTestProduct ? undefined : priceMap[primaryProduct];
    if (!isTestProduct && !priceId) {
      throw new Error(`No Stripe Price ID configured for product: "${primaryProduct}". Set STRIPE_PRICE_ID_SPRINT via supabase secrets.`);
    }

    console.log('Creating checkout session for:', products, '| Email:', customer_email, '| Name:', customer_name, '| Test:', isTestProduct);

    // Build Stripe Checkout Session payload with metadata for webhook
    const params = new URLSearchParams({
      'mode': 'payment',
      'success_url': success_url,
      'cancel_url': cancel_url,
      'payment_method_types[0]': 'card',
      'billing_address_collection': 'auto',
      // Metadata — critical for webhook to identify customer and send emails
      'metadata[customer_name]': customer_name || '',
      'metadata[customer_email]': (customer_email || '').toLowerCase(),
      'metadata[products]': JSON.stringify(products),
    });

    if (isTestProduct) {
      // Ad-hoc $2 test product — no saved Stripe Price ID needed
      params.set('line_items[0][price_data][currency]', 'usd');
      params.set('line_items[0][price_data][product_data][name]', 'Zkandar AI — Pipeline Test ($2)');
      params.set('line_items[0][price_data][unit_amount]', '200');  // $2.00 in cents
      params.set('line_items[0][quantity]', '1');
    } else {
      params.set('line_items[0][price]', priceId!);
      params.set('line_items[0][quantity]', '1');
    }

    if (customer_email) {
      params.set('customer_email', customer_email.toLowerCase());
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
      console.error('Stripe API error:', session?.error);
      throw new Error(session?.error?.message ?? 'Stripe API error');
    }

    console.log('Stripe session created:', session.id, '| URL:', session.url?.substring(0, 50) + '...');

    // Track the pending purchase in DB
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      await supabase.from('webinar_purchases').insert({
        customer_email: (customer_email || '').toLowerCase(),
        customer_name: customer_name || '',
        stripe_session_id: session.id,
        products,
        amount_total: 0,  // Will be updated by webhook
        currency: 'usd',
        status: 'pending',
        metadata: { created_from: 'checkout', products },
      });
      console.log('Pending purchase record created');

      // Also update the lead's payment status to pending
      if (customer_email) {
        await supabase.from('webinar_leads').update({
          payment_status: 'pending',
          stripe_session_id: session.id,
          updated_at: new Date().toISOString(),
        }).eq('email', customer_email.toLowerCase());
      }
    } catch (dbErr) {
      // Non-fatal — the webhook will handle this as fallback
      console.warn('DB tracking warning (non-fatal):', dbErr);
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
