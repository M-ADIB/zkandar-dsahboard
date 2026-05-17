import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') ?? Deno.env.get('stripe_secret_key');
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? Deno.env.get('stripe_webhook_secret');
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// ── Stripe signature verification ──
async function verifyStripeSignature(payload: string, signature: string, secret: string): Promise<boolean> {
  const parts = signature.split(',').reduce((acc: Record<string, string>, part) => {
    const [key, value] = part.split('=');
    acc[key] = value;
    return acc;
  }, {});
  const timestamp = parts['t'];
  const sig = parts['v1'];
  if (!timestamp || !sig) return false;
  const age = Math.floor(Date.now() / 1000) - parseInt(timestamp);
  if (age > 300) { console.error('Webhook timestamp too old:', age, 's'); return false; }
  const signedPayload = `${timestamp}.${payload}`;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signatureBytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload));
  const expectedSig = Array.from(new Uint8Array(signatureBytes)).map(b => b.toString(16).padStart(2, '0')).join('');
  return expectedSig === sig;
}

// ── Booking confirmation email ──
async function sendBookingConfirmationEmail(customerEmail: string, customerName: string, products: string[], amountTotal: number) {
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set — skipping confirmation email');
    return;
  }

  const firstName = customerName.split(' ')[0] || 'there';
  const formattedAmount = `$${(amountTotal / 100).toFixed(2)}`;
  const productNames = products.map(p => {
    const names: Record<string, string> = {
      'webinar': '3-Day AI Design Webinar',
      'webinar-template': 'Professional Presentation Template',
      'webinar-catalog': 'Interior Design Style Catalog',
      'vip': 'VIP Access Upgrade',
      'vip-elite': 'VIP Elite Upgrade',
    };
    return names[p] || p;
  });

  const productListHtml = productNames.map(name =>
    `<tr><td style="padding:8px 0; font-size:14px; color:#D1D5DB; border-bottom:1px solid #1F2937;">✓ ${name}</td></tr>`
  ).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Booking Confirmed — Zkandar AI</title>
  <style type="text/css">body,table,td{font-family:Arial,sans-serif!important;}</style>
</head>
<body style="margin:0;padding:0;background:#0B0B0B;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0B0B0B;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td style="background:#111111;border:1px solid #1F2937;border-radius:16px;overflow:hidden;">
              <table width="100%" cellpadding="0" cellspacing="0">

                <!-- Header Banner -->
                <tr>
                  <td style="background:linear-gradient(135deg,#D0FF71 0%,#5A9F2E 100%);padding:28px 24px;text-align:center;">
                    <div style="font-size:28px;font-weight:900;color:#000;letter-spacing:0.02em;">YOU'RE IN! 🎉</div>
                    <div style="font-size:13px;color:rgba(0,0,0,0.7);margin-top:4px;font-weight:600;">Booking Confirmed</div>
                  </td>
                </tr>

                <!-- Greeting -->
                <tr>
                  <td style="padding:24px 24px 0;">
                    <div style="font-size:18px;font-weight:700;color:#FFFFFF;">Hey ${firstName},</div>
                    <div style="font-size:14px;color:#D1D5DB;margin-top:10px;line-height:1.6;">
                      Your payment has been confirmed and your spot is secured. We're thrilled to have you join us.
                    </div>
                  </td>
                </tr>

                <!-- Order Summary -->
                <tr>
                  <td style="padding:20px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0B0B0B;border:1px solid #1F2937;border-radius:12px;">
                      <tr>
                        <td style="padding:16px;">
                          <div style="font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:12px;">Order Summary</div>
                          <table width="100%" cellpadding="0" cellspacing="0">
                            ${productListHtml}
                          </table>
                          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;border-top:1px solid #374151;">
                            <tr>
                              <td style="padding-top:12px;font-size:14px;font-weight:700;color:#FFFFFF;">Total Paid</td>
                              <td style="padding-top:12px;font-size:14px;font-weight:700;color:#D0FF71;text-align:right;">${formattedAmount}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- What's Next -->
                <tr>
                  <td style="padding:0 24px 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0B0B0B;border:1px solid #1F2937;border-radius:12px;">
                      <tr>
                        <td style="padding:16px;">
                          <div style="font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:12px;">What Happens Next</div>
                          <div style="font-size:13px;color:#D1D5DB;line-height:1.7;">
                            📅 You'll receive the session schedule and Zoom links via email<br/>
                            📋 Pre-work brief will be shared before Day 1<br/>
                            💬 Access to the private cohort community<br/>
                            🎯 Come ready to transform your workflow with AI
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding:0 24px 24px;">
                    <div style="font-size:14px;color:#D1D5DB;line-height:1.6;">
                      If you have any questions before the sessions begin, just reply to this email — we're here to help.
                    </div>
                    <div style="margin-top:20px;">
                      <div style="font-size:14px;font-weight:700;color:#FFFFFF;">Khaled & The Zkandar AI Team</div>
                      <div style="font-size:12px;color:#9CA3AF;">Zkandar AI — Design Smarter with AI</div>
                    </div>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Unsubscribe -->
          <tr>
            <td style="padding:16px;text-align:center;">
              <div style="font-size:11px;color:#6B7280;">© ${new Date().getFullYear()} Zkandar AI. All rights reserved.</div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Zkandar AI <hello@app.zkandar.com>',
        to: customerEmail,
        subject: `Booking Confirmed — You're In, ${firstName}! 🎉`,
        html,
      }),
    });
    const responseText = await res.text();
    if (!res.ok) {
      console.error('Resend error:', res.status, responseText);
    } else {
      console.log('Confirmation email sent to:', customerEmail);
    }
  } catch (err) {
    console.error('Email send failed:', err);
  }
}

// ── Main webhook handler ──
Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (STRIPE_WEBHOOK_SECRET) {
      if (!signature) { console.error('Missing stripe-signature header'); return new Response('Missing signature', { status: 400 }); }
      const isValid = await verifyStripeSignature(body, signature, STRIPE_WEBHOOK_SECRET);
      if (!isValid) { console.error('Invalid webhook signature'); return new Response('Invalid signature', { status: 400 }); }
    } else {
      console.warn('STRIPE_WEBHOOK_SECRET not set — skipping signature verification');
    }

    const event = JSON.parse(body);
    console.log('Webhook event received:', event.type, event.id);
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('Checkout completed:', session.id, '| Payment:', session.payment_status);

        const customerEmail = (session.customer_email || session.metadata?.customer_email || '').toLowerCase();
        const customerName = session.metadata?.customer_name || '';
        const products = session.metadata?.products ? JSON.parse(session.metadata.products) : [];

        // Update purchase record
        const { data: purchase, error: updateError } = await supabase
          .from('webinar_purchases')
          .update({
            status: session.payment_status === 'paid' ? 'completed' : 'pending',
            stripe_payment_intent_id: session.payment_intent || null,
            stripe_customer_id: session.customer || null,
            amount_total: session.amount_total || 0,
            currency: session.currency || 'usd',
            completed_at: session.payment_status === 'paid' ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
            metadata: { payment_status: session.payment_status, payment_method_types: session.payment_method_types, stripe_event_id: event.id },
          })
          .eq('stripe_session_id', session.id)
          .select()
          .single();

        if (updateError) {
          console.error('Failed to update purchase:', updateError.message);
          if (updateError.code === 'PGRST116') {
            await supabase.from('webinar_purchases').insert({
              customer_email: customerEmail,
              customer_name: customerName,
              stripe_session_id: session.id,
              stripe_payment_intent_id: session.payment_intent || null,
              stripe_customer_id: session.customer || null,
              products,
              amount_total: session.amount_total || 0,
              currency: session.currency || 'usd',
              status: session.payment_status === 'paid' ? 'completed' : 'pending',
              completed_at: session.payment_status === 'paid' ? new Date().toISOString() : null,
              metadata: { payment_status: session.payment_status, stripe_event_id: event.id, created_via: 'webhook_fallback' },
            });
            console.log('Purchase created via webhook fallback');
          }
        } else {
          console.log('Purchase updated:', purchase?.id);
        }

        // Update lead payment status
        if (customerEmail && session.payment_status === 'paid') {
          await supabase.from('webinar_leads').update({
            payment_status: 'paid',
            amount_paid: session.amount_total || 0,
            status: 'registered',
            updated_at: new Date().toISOString(),
          }).eq('email', customerEmail);
          console.log('Lead payment status updated for:', customerEmail);

          // Send booking confirmation email
          await sendBookingConfirmationEmail(customerEmail, customerName, products, session.amount_total || 0);
        }
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object;
        console.log('Checkout expired:', session.id);
        await supabase.from('webinar_purchases').update({ status: 'expired', updated_at: new Date().toISOString() }).eq('stripe_session_id', session.id);
        const email = (session.customer_email || session.metadata?.customer_email || '').toLowerCase();
        if (email) { await supabase.from('webinar_leads').update({ payment_status: 'unpaid' }).eq('email', email).eq('payment_status', 'pending'); }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object;
        console.log('Charge refunded:', charge.id);
        const { data: purchase } = await supabase.from('webinar_purchases').select('id, customer_email').eq('stripe_payment_intent_id', charge.payment_intent).single();
        if (purchase) {
          await supabase.from('webinar_purchases').update({ status: 'refunded', updated_at: new Date().toISOString(), metadata: { refund_event_id: event.id } }).eq('id', purchase.id);
          await supabase.from('webinar_leads').update({ payment_status: 'refunded', amount_paid: 0 }).eq('email', purchase.customer_email);
          console.log('Purchase and lead marked as refunded');
        }
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' }, status: 200 });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Webhook error:', message);
    return new Response(JSON.stringify({ error: message }), { headers: { 'Content-Type': 'application/json' }, status: 200 });
  }
});
