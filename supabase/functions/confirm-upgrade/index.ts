import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') ?? Deno.env.get('stripe_secret_key');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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
    const { email, tierId, price } = body;

    if (!email || !tierId || !price) {
      throw new Error('Missing email, tierId, or price');
    }

    console.log(`Processing one-click upgrade for ${email} to tier ${tierId} ($${price})...`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Find the customer's completed purchase to get the stripe_customer_id
    const { data: purchase, error: purchaseErr } = await supabase
      .from('webinar_purchases')
      .select('stripe_customer_id, stripe_session_id, products')
      .eq('customer_email', email.toLowerCase())
      .eq('status', 'completed')
      .not('stripe_customer_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (purchaseErr) {
      throw new Error(`Database error looking up purchase: ${purchaseErr.message}`);
    }

    if (!purchase?.stripe_customer_id) {
      throw new Error('No completed checkout session found with a saved card on file for this email.');
    }

    const stripeCustomerId = purchase.stripe_customer_id;
    console.log(`Found Stripe Customer ID: ${stripeCustomerId}`);

    // 2. Retrieve payment methods from Stripe to get the saved card
    const pmRes = await fetch(`https://api.stripe.com/v1/customers/${stripeCustomerId}/payment_methods?type=card`, {
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`
      }
    });

    if (!pmRes.ok) {
      const errorData = await pmRes.json();
      throw new Error(`Failed to retrieve payment methods from Stripe: ${errorData.error?.message || pmRes.statusText}`);
    }

    const pmData = await pmRes.json();
    const paymentMethods = pmData.data ?? [];

    if (paymentMethods.length === 0) {
      throw new Error('No saved card found on file for this customer. Cannot complete one-click upgrade.');
    }

    const paymentMethodId = paymentMethods[0].id;
    console.log(`Using saved PaymentMethod ID: ${paymentMethodId}`);

    // 3. Charge the customer's card off-session
    const amountCents = Math.round(price * 100);
    const chargeParams = new URLSearchParams({
      'amount': String(amountCents),
      'currency': 'usd',
      'customer': stripeCustomerId,
      'payment_method': paymentMethodId,
      'off_session': 'true',
      'confirm': 'true',
      'description': `Zkandar AI Webinar Upgrade: ${tierId.toUpperCase()} Tier`,
      'metadata[email]': email.toLowerCase(),
      'metadata[tierId]': tierId,
      'metadata[type]': 'webinar_upgrade',
    });

    const piRes = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: chargeParams.toString()
    });

    const piData = await piRes.json();

    if (!piRes.ok) {
      console.error('Stripe PaymentIntent error:', piData.error);
      throw new Error(piData.error?.message ?? 'Payment failed');
    }

    console.log(`Payment successful! PaymentIntent ID: ${piData.id}`);

    // 4. Update the user's products array in webinar_purchases and set the upgrade tier
    const updatedProducts = [...new Set([...(purchase.products ?? []), tierId === 'gold' ? 'vip-elite' : 'vip'])];
    
    const { error: updatePurchaseErr } = await supabase
      .from('webinar_purchases')
      .update({
        products: updatedProducts,
        amount_total: (piData.amount ?? 0) + (purchase.amount_total ?? 0), // Add the upgrade cost to total paid
        updated_at: new Date().toISOString()
      })
      .eq('stripe_session_id', purchase.stripe_session_id);

    if (updatePurchaseErr) {
      console.error('Failed to update webinar_purchases products:', updatePurchaseErr.message);
    }

    // 5. Update public.users profile_data to record the upgrade tier
    const { data: userRecord } = await supabase
      .from('users')
      .select('profile_data')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    const updatedProfileData = {
      ...(userRecord?.profile_data ?? {}),
      upgrade_tier: tierId
    };

    const { error: updateUserErr } = await supabase
      .from('users')
      .update({
        profile_data: updatedProfileData,
        updated_at: new Date().toISOString()
      })
      .eq('email', email.toLowerCase());

    if (updateUserErr) {
      console.error('Failed to update user profile_data:', updateUserErr.message);
    }

    return new Response(JSON.stringify({ success: true, paymentIntentId: piData.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('confirm-upgrade error:', message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }
});
