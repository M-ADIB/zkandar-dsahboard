import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') ?? Deno.env.get('stripe_secret_key');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Inline sprint pricing. Override by setting STRIPE_PRICE_ID_SPRINT.
const STRIPE_PRICE_ID_SPRINT = Deno.env.get('STRIPE_PRICE_ID_SPRINT') ?? null;
const SPRINT_INLINE_AMOUNT_CENTS = 81600; // $816.00 USD

// ── Webinar product catalog (inline pricing, no Stripe Price ID needed) ──
// ⚠️  These amounts MUST match the frontend display prices in WebinarComponents.tsx
//     BASE_PRICE = $19, template = $17, catalog = $13
const WEBINAR_PRODUCTS: Record<string, { name: string; amount: number }> = {
  'webinar':           { name: '3-Day AI Design Webinar',           amount:  1900 }, // $19
  'webinar-template':  { name: 'Professional Presentation Template', amount:  1700 }, // $17
  'webinar-catalog':   { name: 'Interior Design Style Catalog',      amount:  1300 }, // $13
  'vip':               { name: 'VIP Access Upgrade',                 amount:  9700 }, // $97
  'vip-elite':         { name: 'VIP Elite Upgrade',                  amount: 19700 }, // $197
};

const ALLOWED_ORIGINS = [
  'https://app.zkandar.com',
  'https://zkandar.com',
  'https://www.zkandar.com',
  'http://localhost:5173',
  'http://localhost:3000',
];

function getCorsHeaders(req: Request): Record<string, string> {
  const requestOrigin = req.headers.get('origin') ?? '';
  const envAllowed = Deno.env.get('ALLOWED_ORIGIN');
  const allowed = envAllowed ? [envAllowed, ...ALLOWED_ORIGINS] : ALLOWED_ORIGINS;
  const origin = allowed.includes(requestOrigin) ? requestOrigin : '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

    const primaryProduct = products[0];
    const isTestProduct = primaryProduct === 'test';
    const isSprintProduct = primaryProduct === 'sprint';
    const isWebinarProduct = primaryProduct in WEBINAR_PRODUCTS;

    // Sprint uses a saved price ID if available, otherwise falls back to inline pricing
    const sprintPriceId = isSprintProduct ? STRIPE_PRICE_ID_SPRINT : undefined;
    const useInlineSprint = isSprintProduct && !sprintPriceId;

    // Throw only for truly unknown products
    if (!isTestProduct && !isSprintProduct && !isWebinarProduct) {
      throw new Error(`Unknown product: "${primaryProduct}". Supported: webinar, webinar-template, webinar-catalog, vip, vip-elite, sprint, test`);
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
      // Ad-hoc $2 test product
      params.set('line_items[0][price_data][currency]', 'usd');
      params.set('line_items[0][price_data][product_data][name]', 'Zkandar AI — Pipeline Test ($2)');
      params.set('line_items[0][price_data][unit_amount]', '200');
      params.set('line_items[0][quantity]', '1');
    } else if (isWebinarProduct) {
      // Webinar products — inline pricing, supports multiple line items (upsells)
      products.forEach((slug, idx) => {
        const product = WEBINAR_PRODUCTS[slug];
        if (!product) return; // skip unknown slugs in bundle
        params.set(`line_items[${idx}][price_data][currency]`, 'usd');
        params.set(`line_items[${idx}][price_data][product_data][name]`, product.name);
        params.set(`line_items[${idx}][price_data][unit_amount]`, String(product.amount));
        params.set(`line_items[${idx}][quantity]`, '1');
      });
    } else if (useInlineSprint) {
      // Sprint inline pricing — no saved Stripe Price ID required
      params.set('line_items[0][price_data][currency]', 'usd');
      params.set('line_items[0][price_data][product_data][name]', 'Sprint Workshop — Zkandar AI');
      params.set('line_items[0][price_data][unit_amount]', String(SPRINT_INLINE_AMOUNT_CENTS));
      params.set('line_items[0][quantity]', '1');
    } else {
      // Saved Stripe Price ID (sprint with env var)
      params.set('line_items[0][price]', sprintPriceId!);
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
