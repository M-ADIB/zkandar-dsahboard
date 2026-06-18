import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') ?? Deno.env.get('stripe_secret_key');
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? Deno.env.get('stripe_webhook_secret') ?? Deno.env.get('stripe_webhook_signing_secret');
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Sprint cohort helper and fallback ID
const SPRINT_FALLBACK_COHORT_ID = '813335a5-3d30-497c-a27d-f2702020f6b2';

async function getSprintCohortId(supabase: ReturnType<typeof createClient>): Promise<string> {
  try {
    const { data: cohortData, error } = await supabase
      .from('cohorts')
      .select('id')
      .eq('offering_type', 'sprint_workshop')
      .in('status', ['upcoming', 'active'])
      .order('start_date', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching upcoming sprint cohort:', error);
    }
    
    if (cohortData?.id) {
      console.log('Resolved upcoming sprint cohort:', cohortData.id);
      return cohortData.id;
    }

    // Fallback: Query the latest sprint_workshop cohort by start_date descending
    const { data: latestCohort, error: latestError } = await supabase
      .from('cohorts')
      .select('id')
      .eq('offering_type', 'sprint_workshop')
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestError) {
      console.error('Error fetching latest sprint cohort:', latestError);
    }

    if (latestCohort?.id) {
      console.log('Resolved latest sprint cohort as fallback:', latestCohort.id);
      return latestCohort.id;
    }
  } catch (err) {
    console.error('Failed to resolve sprint cohort dynamically, using fallback:', err);
  }

  console.log('Using hardcoded fallback sprint cohort:', SPRINT_FALLBACK_COHORT_ID);
  return SPRINT_FALLBACK_COHORT_ID;
}

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

// ── Generate a secure temp password ──
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  let pw = '';
  const arr = new Uint8Array(12);
  crypto.getRandomValues(arr);
  for (const b of arr) pw += chars[b % chars.length];
  return pw;
}

// ── Provision Sprint user: create auth user + profile + cohort membership ──
async function provisionSprintUser(
  supabase: ReturnType<typeof createClient>,
  email: string,
  fullName: string,
  tempPassword: string
): Promise<{ userId: string; isNew: boolean }> {
  // Resolve sprint cohort ID dynamically
  const sprintCohortId = await getSprintCohortId(supabase);

  // Check if user already exists
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existing?.id) {
    console.log('User already exists:', existing.id);
    // Still ensure cohort membership
    await supabase.from('cohort_memberships').upsert(
      { user_id: existing.id, cohort_id: sprintCohortId },
      { onConflict: 'user_id,cohort_id', ignoreDuplicates: true }
    );
    return { userId: existing.id, isNew: false };
  }

  // Create Supabase auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (authError) throw new Error(`Auth user creation failed: ${authError.message}`);
  const userId = authData.user.id;
  console.log('Auth user created:', userId);

  // Upsert profile in users table
  await supabase.from('users').upsert({
    id: userId,
    email,
    full_name: fullName,
    role: 'participant',
    user_type: 'sprint_member',
    onboarding_completed: false,
    created_at: new Date().toISOString(),
  }, { onConflict: 'id', ignoreDuplicates: false });

  // Add cohort membership
  await supabase.from('cohort_memberships').upsert(
    { user_id: userId, cohort_id: sprintCohortId },
    { onConflict: 'user_id,cohort_id', ignoreDuplicates: true }
  );

  console.log('Sprint user provisioned:', userId, '| Cohort:', sprintCohortId);
  return { userId, isNew: true };
}

// ── Provision Webinar user: create auth user + profile + cohort membership ──
const WEBINAR_COHORT_ID = '773335a5-3d30-497c-a27d-f2702020e9a9';

async function provisionWebinarUser(
  supabase: ReturnType<typeof createClient>,
  email: string,
  fullName: string,
  tempPassword: string
): Promise<{ userId: string; isNew: boolean }> {
  // Check if user already exists
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existing?.id) {
    console.log('User already exists:', existing.id);
    // Still ensure cohort membership
    await supabase.from('cohort_memberships').upsert(
      { user_id: existing.id, cohort_id: WEBINAR_COHORT_ID },
      { onConflict: 'user_id,cohort_id', ignoreDuplicates: true }
    );
    return { userId: existing.id, isNew: false };
  }

  // Create Supabase auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (authError) throw new Error(`Auth user creation failed: ${authError.message}`);
  const userId = authData.user.id;
  console.log('Auth user created:', userId);

  // Upsert profile in users table
  await supabase.from('users').upsert({
    id: userId,
    email,
    full_name: fullName,
    role: 'participant',
    user_type: 'webinar_member',
    onboarding_completed: false,
    created_at: new Date().toISOString(),
  }, { onConflict: 'id', ignoreDuplicates: false });

  // Add cohort membership
  await supabase.from('cohort_memberships').upsert(
    { user_id: userId, cohort_id: WEBINAR_COHORT_ID },
    { onConflict: 'user_id,cohort_id', ignoreDuplicates: true }
  );

  console.log('Webinar user provisioned:', userId, '| Cohort:', WEBINAR_COHORT_ID);
  return { userId, isNew: true };
}


// ── Sprint credentials email ──
async function sendSprintCredentialsEmail(email: string, fullName: string, tempPassword: string) {
  if (!RESEND_API_KEY) { console.warn('RESEND_API_KEY not set — skipping credentials email'); return; }

  const firstName = fullName.split(' ')[0] || 'there';
  const dashboardUrl = 'https://app.zkandar.com';

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Welcome to Zkandar AI — Sprint Workshop</title></head>
<body style="margin:0;padding:0;background:#0B0B0B;font-family:Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0B0B0B;">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
      <tr><td style="background:#111111;border:1px solid #1F2937;border-radius:16px;overflow:hidden;">
        <table width="100%" cellpadding="0" cellspacing="0">

          <!-- Header -->
          <tr><td style="background:linear-gradient(135deg,#D0FF71 0%,#5A9F2E 100%);padding:28px 24px;text-align:center;">
            <div style="font-size:28px;font-weight:900;color:#000;letter-spacing:0.02em;">YOU'RE IN! 🎉</div>
            <div style="font-size:13px;color:rgba(0,0,0,0.7);margin-top:4px;font-weight:600;">Sprint Workshop — Access Confirmed</div>
          </td></tr>

          <!-- Greeting -->
          <tr><td style="padding:24px 24px 0;">
            <div style="font-size:18px;font-weight:700;color:#FFFFFF;">Hi ${firstName},</div>
            <div style="font-size:14px;color:#D1D5DB;margin-top:10px;line-height:1.6;">
              Your payment is confirmed and your Sprint Workshop account is ready. Use the credentials below to sign in to your dashboard.
            </div>
          </td></tr>

          <!-- Credentials box -->
          <tr><td style="padding:20px 24px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0B0B0B;border:2px solid #D0FF71;border-radius:12px;">
              <tr><td style="padding:20px;">
                <div style="font-size:11px;font-weight:700;color:#D0FF71;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:14px;">🔑 Your Login Credentials</div>
                <div style="margin-bottom:10px;">
                  <span style="font-size:11px;color:#9CA3AF;display:block;margin-bottom:4px;">EMAIL</span>
                  <span style="font-size:14px;color:#FFFFFF;font-weight:600;">${email}</span>
                </div>
                <div style="margin-bottom:16px;">
                  <span style="font-size:11px;color:#9CA3AF;display:block;margin-bottom:4px;">TEMPORARY PASSWORD</span>
                  <span style="font-size:18px;color:#D0FF71;font-weight:900;letter-spacing:0.05em;font-family:monospace;">${tempPassword}</span>
                </div>
                <div style="font-size:12px;color:#9CA3AF;line-height:1.5;">
                  ⚠️ Please change your password after your first login from the Settings page.
                </div>
                <div style="margin-top:16px;">
                  <a href="${dashboardUrl}" style="display:inline-block;background:linear-gradient(135deg,#D0FF71,#5A9F2E);color:#000;font-weight:700;font-size:14px;padding:12px 24px;border-radius:8px;text-decoration:none;">
                    Sign In to Dashboard →
                  </a>
                </div>
              </td></tr>
            </table>
          </td></tr>

          <!-- What's Next -->
          <tr><td style="padding:16px 24px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0B0B0B;border:1px solid #1F2937;border-radius:12px;">
              <tr><td style="padding:16px;">
                <div style="font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:12px;">What Happens Next</div>
                <div style="font-size:13px;color:#D1D5DB;line-height:1.7;">
                  📋 Your session schedule and materials are in the dashboard<br/>
                  🎯 Complete assignments after each session to unlock the next<br/>
                  📅 A 1-on-1 strategy call is unlocked after all sessions are complete<br/>
                  💬 Reach the team anytime via the chat inside the platform
                </div>
              </td></tr>
            </table>
          </td></tr>

          <!-- Footer -->
          <tr><td style="padding:24px;">
            <div style="font-size:14px;color:#D1D5DB;line-height:1.6;">
              Questions? Reply to this email — we're here to help.
            </div>
            <div style="margin-top:16px;">
              <div style="font-size:14px;font-weight:700;color:#FFFFFF;">Zkandar AI</div>
            </div>
          </td></tr>

        </table>
      </td></tr>
      <tr><td style="padding:16px;text-align:center;">
        <div style="font-size:11px;color:#6B7280;">© ${new Date().getFullYear()} Zkandar AI. All rights reserved.</div>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: 'Zkandar AI <hello@app.zkandar.com>',
        reply_to: 'admin@zkandar.com',
        to: email,
        subject: `Welcome to the Sprint Workshop — Your Login Details, ${firstName}! 🚀`,
        html,
      }),
    });
    const txt = await res.text();
    if (!res.ok) console.error('Resend error (credentials):', res.status, txt);
    else console.log('Credentials email sent to:', email);
  } catch (err) {
    console.error('Credentials email send failed:', err);
  }
}

// ── Webinar credentials email ──
async function sendWebinarCredentialsEmail(email: string, fullName: string, tempPassword: string, products: string[], amountTotal: number) {
  if (!RESEND_API_KEY) { console.warn('RESEND_API_KEY not set — skipping webinar credentials email'); return; }

  const firstName = fullName.split(' ')[0] || 'there';
  const dashboardUrl = 'https://app.zkandar.com';
  const formattedAmount = `$${(amountTotal / 100).toFixed(2)}`;
  const names: Record<string, string> = {
    'webinar': '2-Day AI Design Webinar',
    'webinar-template': 'Professional Presentation Template',
    'webinar-catalog': 'Interior Design Style Catalog',
    'vip': 'VIP Access Upgrade',
    'vip-elite': 'VIP Elite Upgrade',
  };
  const productListHtml = products.map(p =>
    `<tr><td style="padding:8px 0;font-size:14px;color:#D1D5DB;border-bottom:1px solid #1F2937;">✓ ${names[p] || p}</td></tr>`
  ).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Welcome to Zkandar AI — Beyond the AI Prompt</title></head>
<body style="margin:0;padding:0;background:#0B0B0B;font-family:Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0B0B0B;">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
      <tr><td style="background:#111111;border:1px solid #1F2937;border-radius:16px;overflow:hidden;">
        <table width="100%" cellpadding="0" cellspacing="0">

          <!-- Header -->
          <tr><td style="background:linear-gradient(135deg,#D0FF71 0%,#5A9F2E 100%);padding:28px 24px;text-align:center;">
            <div style="font-size:28px;font-weight:900;color:#000;letter-spacing:0.02em;">YOU'RE IN! 🎉</div>
            <div style="font-size:13px;color:rgba(0,0,0,0.7);margin-top:4px;font-weight:600;">Beyond the AI Prompt — Access Confirmed</div>
          </td></tr>

          <!-- Greeting -->
          <tr><td style="padding:24px 24px 0;">
            <div style="font-size:18px;font-weight:700;color:#FFFFFF;">Hi ${firstName},</div>
            <div style="font-size:14px;color:#D1D5DB;margin-top:10px;line-height:1.6;">
              Your payment is confirmed and your Zkandar AI account is ready. Use the credentials below to sign in to your dashboard to access the live session link, materials, and chat.
            </div>
          </td></tr>

          <!-- Order Summary -->
          <tr><td style="padding:20px 24px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0B0B0B;border:1px solid #1F2937;border-radius:12px;">
              <tr><td style="padding:16px;">
                <div style="font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:12px;">Order Summary</div>
                <table width="100%" cellpadding="0" cellspacing="0">${productListHtml}</table>
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;border-top:1px solid #374151;">
                  <tr>
                    <td style="padding-top:12px;font-size:14px;font-weight:700;color:#FFF;">Total Paid</td>
                    <td style="padding-top:12px;font-size:14px;font-weight:700;color:#D0FF71;text-align:right;">${formattedAmount}</td>
                  </tr>
                </table>
              </td></tr>
            </table>
          </td></tr>

          <!-- Credentials box -->
          <tr><td style="padding:20px 24px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0B0B0B;border:2px solid #D0FF71;border-radius:12px;">
              <tr><td style="padding:20px;">
                <div style="font-size:11px;font-weight:700;color:#D0FF71;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:14px;">🔑 Your Login Credentials</div>
                <div style="margin-bottom:10px;">
                  <span style="font-size:11px;color:#9CA3AF;display:block;margin-bottom:4px;">EMAIL</span>
                  <span style="font-size:14px;color:#FFFFFF;font-weight:600;">${email}</span>
                </div>
                <div style="margin-bottom:16px;">
                  <span style="font-size:11px;color:#9CA3AF;display:block;margin-bottom:4px;">TEMPORARY PASSWORD</span>
                  <span style="font-size:18px;color:#D0FF71;font-weight:900;letter-spacing:0.05em;font-family:monospace;">${tempPassword}</span>
                </div>
                <div style="font-size:12px;color:#9CA3AF;line-height:1.5;">
                  ⚠️ Please change your password after your first login from the Settings page.
                </div>
                <div style="margin-top:16px;">
                  <a href="${dashboardUrl}" style="display:inline-block;background:linear-gradient(135deg,#D0FF71,#5A9F2E);color:#000;font-weight:700;font-size:14px;padding:12px 24px;border-radius:8px;text-decoration:none;">
                    Sign In to Dashboard →
                  </a>
                </div>
              </td></tr>
            </table>
          </td></tr>

          <!-- What's Next -->
          <tr><td style="padding:16px 24px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0B0B0B;border:1px solid #1F2937;border-radius:12px;">
              <tr><td style="padding:16px;">
                <div style="font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:12px;">What Happens Next</div>
                <div style="font-size:13px;color:#D1D5DB;line-height:1.7;">
                  📅 The webinar session link and materials are in the dashboard<br/>
                  💬 Access to the private cohort chat community is unlocked<br/>
                  🎯 Complete assignments and surveys to earn your AI certification
                </div>
              </td></tr>
            </table>
          </td></tr>

          <!-- Footer -->
          <tr><td style="padding:24px;">
            <div style="font-size:14px;color:#D1D5DB;line-height:1.6;">
              Questions? Reply to this email — we're here to help.
            </div>
            <div style="margin-top:16px;">
              <div style="font-size:14px;font-weight:700;color:#FFFFFF;">Zkandar AI</div>
            </div>
          </td></tr>

        </table>
      </td></tr>
      <tr><td style="padding:16px;text-align:center;">
        <div style="font-size:11px;color:#6B7280;">© ${new Date().getFullYear()} Zkandar AI. All rights reserved.</div>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: 'Zkandar AI <hello@app.zkandar.com>',
        reply_to: 'admin@zkandar.com',
        to: email,
        subject: `Welcome to Beyond the AI Prompt — Your Login Details, ${firstName}! 🚀`,
        html,
      }),
    });
    const txt = await res.text();
    if (!res.ok) console.error('Resend error (webinar credentials):', res.status, txt);
    else console.log('Webinar credentials email sent to:', email);
  } catch (err) {
    console.error('Webinar credentials email send failed:', err);
  }
}


// ── Webinar booking confirmation email ──
async function sendBookingConfirmationEmail(customerEmail: string, customerName: string, products: string[], amountTotal: number) {
  if (!RESEND_API_KEY) { console.warn('RESEND_API_KEY not set — skipping confirmation email'); return; }

  const firstName = customerName.split(' ')[0] || 'there';
  const formattedAmount = `$${(amountTotal / 100).toFixed(2)}`;
  const names: Record<string, string> = {
    'webinar': '3-Day AI Design Webinar',
    'webinar-template': 'Professional Presentation Template',
    'webinar-catalog': 'Interior Design Style Catalog',
    'vip': 'VIP Access Upgrade',
    'vip-elite': 'VIP Elite Upgrade',
    'test': 'Zkandar AI — Pipeline Test',
  };
  const productListHtml = products.map(p =>
    `<tr><td style="padding:8px 0;font-size:14px;color:#D1D5DB;border-bottom:1px solid #1F2937;">✓ ${names[p] || p}</td></tr>`
  ).join('');

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><title>Booking Confirmed — Zkandar AI</title></head>
<body style="margin:0;padding:0;background:#0B0B0B;font-family:Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0B0B0B;">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
      <tr><td style="background:#111111;border:1px solid #1F2937;border-radius:16px;overflow:hidden;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="background:linear-gradient(135deg,#D0FF71 0%,#5A9F2E 100%);padding:28px 24px;text-align:center;">
            <div style="font-size:28px;font-weight:900;color:#000;">YOU'RE IN! 🎉</div>
            <div style="font-size:13px;color:rgba(0,0,0,0.7);margin-top:4px;font-weight:600;">Booking Confirmed</div>
          </td></tr>
          <tr><td style="padding:24px 24px 0;">
            <div style="font-size:18px;font-weight:700;color:#FFF;">Hi ${firstName},</div>
            <div style="font-size:14px;color:#D1D5DB;margin-top:10px;line-height:1.6;">Your payment has been confirmed and your spot is secured.</div>
          </td></tr>
          <tr><td style="padding:20px 24px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0B0B0B;border:1px solid #1F2937;border-radius:12px;">
              <tr><td style="padding:16px;">
                <div style="font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:12px;">Order Summary</div>
                <table width="100%" cellpadding="0" cellspacing="0">${productListHtml}</table>
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;border-top:1px solid #374151;">
                  <tr>
                    <td style="padding-top:12px;font-size:14px;font-weight:700;color:#FFF;">Total Paid</td>
                    <td style="padding-top:12px;font-size:14px;font-weight:700;color:#D0FF71;text-align:right;">${formattedAmount}</td>
                  </tr>
                </table>
              </td></tr>
            </table>
          </td></tr>
          <tr><td style="padding:16px 24px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0B0B0B;border:1px solid #D0FF71;border-radius:12px;">
              <tr><td style="padding:16px;">
                <div style="font-size:11px;font-weight:700;color:#D0FF71;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;">📅 Session Link</div>
                <div style="font-size:13px;color:#D1D5DB;line-height:1.6;">Your Zoom link will be shared closer to the session date. Keep an eye on your inbox.</div>
              </td></tr>
            </table>
          </td></tr>
          <tr><td style="padding:16px 24px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0B0B0B;border:1px solid #1F2937;border-radius:12px;">
              <tr><td style="padding:16px;">
                <div style="font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:12px;">What Happens Next</div>
                <div style="font-size:13px;color:#D1D5DB;line-height:1.7;">📋 A pre-work brief will be shared before Day 1<br/>💬 Access to the private cohort community<br/>🎯 Come ready to transform your workflow with AI</div>
              </td></tr>
            </table>
          </td></tr>
          <tr><td style="padding:24px;">
            <div style="font-size:14px;color:#D1D5DB;line-height:1.6;">If you have questions before the session begins, just reply to this email.</div>
            <div style="margin-top:20px;font-size:14px;font-weight:700;color:#FFF;">Zkandar AI</div>
          </td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:16px;text-align:center;">
        <div style="font-size:11px;color:#6B7280;">© ${new Date().getFullYear()} Zkandar AI. All rights reserved.</div>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: 'Zkandar AI <hello@app.zkandar.com>',
        reply_to: 'admin@zkandar.com',
        to: customerEmail,
        subject: `Booking Confirmed — You're In, ${firstName}! 🎉`,
        html,
      }),
    });
    const txt = await res.text();
    if (!res.ok) console.error('Resend error (booking):', res.status, txt);
    else console.log('Confirmation email sent to:', customerEmail);
  } catch (err) {
    console.error('Booking email send failed:', err);
  }
}

// ── Main webhook handler ──
Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    console.log('Webhook secret loaded:', STRIPE_WEBHOOK_SECRET ? 'YES (length: ' + STRIPE_WEBHOOK_SECRET.length + ')' : 'NO');

    if (STRIPE_WEBHOOK_SECRET) {
      if (!signature) { console.error('Missing stripe-signature header'); return new Response('Missing signature', { status: 400 }); }
      const isValid = await verifyStripeSignature(body, signature, STRIPE_WEBHOOK_SECRET);
      if (!isValid) { console.error('Invalid webhook signature'); return new Response('Invalid signature', { status: 400 }); }
      console.log('Webhook signature verified successfully');
    } else {
      console.warn('No webhook secret found — skipping signature check');
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
        const products: string[] = session.metadata?.products ? JSON.parse(session.metadata.products) : [];

        console.log('Products:', products, '| Email:', customerEmail);

        const isPaid = session.payment_status === 'paid';
        const isSprintProduct = products.includes('sprint');
        const isTestProduct = products.includes('test');

        // ── Update/create purchase record ──
        const { error: updateError } = await supabase
          .from('webinar_purchases')
          .update({
            status: isPaid ? 'completed' : 'pending',
            stripe_payment_intent_id: session.payment_intent || null,
            stripe_customer_id: session.customer || null,
            amount_total: session.amount_total || 0,
            currency: session.currency || 'usd',
            completed_at: isPaid ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
            metadata: { payment_status: session.payment_status, stripe_event_id: event.id },
          })
          .eq('stripe_session_id', session.id);

        if (updateError?.code === 'PGRST116') {
          await supabase.from('webinar_purchases').insert({
            customer_email: customerEmail,
            customer_name: customerName,
            stripe_session_id: session.id,
            stripe_payment_intent_id: session.payment_intent || null,
            stripe_customer_id: session.customer || null,
            products,
            amount_total: session.amount_total || 0,
            currency: session.currency || 'usd',
            status: isPaid ? 'completed' : 'pending',
            completed_at: isPaid ? new Date().toISOString() : null,
            metadata: { payment_status: session.payment_status, stripe_event_id: event.id, created_via: 'webhook_fallback' },
          });
          console.log('Purchase created via webhook fallback');
        }

        if (!isPaid || !customerEmail) {
          console.log('Skipping post-purchase logic — not paid or no email');
          break;
        }

        // ── Sprint: provision user + send credentials ──
        if (isSprintProduct || isTestProduct) {
          console.log('Sprint/test purchase detected — provisioning user...');
          try {
            const tempPassword = generateTempPassword();
            const { isNew } = await provisionSprintUser(supabase, customerEmail, customerName, tempPassword);

            if (isNew) {
              await sendSprintCredentialsEmail(customerEmail, customerName, tempPassword);
              console.log('Sprint provisioning complete — credentials sent');
            } else {
              console.log('User already existed — skipping credentials email');
            }

            // ALSO add them to the leads table
            const { data: existingLead } = await supabase
              .from('leads')
              .select('id')
              .eq('email', customerEmail)
              .maybeSingle();

            const leadPayload = {
              full_name: customerName,
              email: customerEmail,
              priority: 'COMPLETED',
              offering_type: 'sprint_workshop',
              payment_amount: session.amount_total ? (session.amount_total / 100) : 12500,
              amount_paid: session.amount_total ? (session.amount_total / 100) : 12500,
              paid_full: true,
              date_of_payment: new Date().toISOString(),
              notes: `Automatically created via Stripe checkout completion. Product: ${products.join(', ')}`,
              updated_at: new Date().toISOString(),
            };

            if (!existingLead) {
              const { error: leadErr } = await supabase
                .from('leads')
                .insert({
                  ...leadPayload,
                  created_at: new Date().toISOString(),
                });
              if (leadErr) console.error('Error inserting lead from webhook:', leadErr);
              else console.log('Lead created in leads table for:', customerEmail);
            } else {
              const { error: leadErr } = await supabase
                .from('leads')
                .update(leadPayload)
                .eq('id', existingLead.id);
              if (leadErr) console.error('Error updating existing lead from webhook:', leadErr);
              else console.log('Existing lead updated to COMPLETED for:', customerEmail);
            }
          } catch (provisionErr) {
            console.error('Sprint provisioning error:', provisionErr);
            // Non-fatal — don't block the webhook response
          }
        } else {
          // ── Webinar: update lead + provision user + send credentials ──
          await supabase.from('webinar_leads').update({
            payment_status: 'paid',
            amount_paid: session.amount_total || 0,
            status: 'registered',
            updated_at: new Date().toISOString(),
          }).eq('email', customerEmail);
          console.log('Webinar lead updated for:', customerEmail);

          try {
            const tempPassword = generateTempPassword();
            const { isNew } = await provisionWebinarUser(supabase, customerEmail, customerName, tempPassword);

            if (isNew) {
              await sendWebinarCredentialsEmail(customerEmail, customerName, tempPassword, products, session.amount_total || 0);
              console.log('Webinar provisioning complete — credentials sent');
            } else {
              // Existing user — still send them standard confirmation email so they know order went through
              await sendBookingConfirmationEmail(customerEmail, customerName, products, session.amount_total || 0);
              console.log('Webinar user already existed — standard confirmation sent');
            }
          } catch (provisionErr) {
            console.error('Webinar provisioning error:', provisionErr);
            // Fallback: send standard confirmation email
            await sendBookingConfirmationEmail(customerEmail, customerName, products, session.amount_total || 0);
          }
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
