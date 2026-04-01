/**
 * send-auth-email — Supabase "Send Email" Auth Hook
 *
 * Configured in: Supabase Dashboard → Auth → Hooks → Send Email
 * Replaces Supabase's default mailer for all auth email events.
 *
 * Required secrets (set via `supabase secrets set`):
 *   RESEND_API_KEY  — Resend API key
 *   HOOK_SECRET     — Secret set when configuring the hook in the Dashboard
 */

const FROM = 'Zkandar AI <hello@app.zkandar.com>'
const BRAND_BG = '#0B0B0B'
const CARD_BG = '#111111'
const BORDER = '#1F2937'
const LIME = '#D0FF71'
const LIME_TEXT = '#0B0B0B'
const GRAY_300 = '#D1D5DB'
const GRAY_400 = '#9CA3AF'

// ─── Signature verification ───────────────────────────────────────────────────
async function verifyHookSignature(req: Request, rawBody: string): Promise<boolean> {
    const secret = Deno.env.get('HOOK_SECRET')
    if (!secret) return true // no secret configured — allow (development)

    const sigHeader = req.headers.get('x-supabase-signature')
    if (!sigHeader) return false

    // Supabase sends "v1=<hex_hmac_sha256>" — strip the prefix if present
    const hexSig = sigHeader.startsWith('v1=') ? sigHeader.slice(3) : sigHeader
    const sigBytes = new Uint8Array(hexSig.match(/.{2}/g)!.map((b) => parseInt(b, 16)))

    const enc = new TextEncoder()
    const key = await crypto.subtle.importKey(
        'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
    )
    return await crypto.subtle.verify('HMAC', key, sigBytes, enc.encode(rawBody))
}

// ─── Email templates ──────────────────────────────────────────────────────────
function wrapHtml(subject: string, bodyRows: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${subject}</title>
  <style>body,table,td{font-family:Arial,sans-serif!important;}</style>
</head>
<body style="margin:0;padding:0;background:${BRAND_BG};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND_BG};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td style="background:${CARD_BG};border:1px solid ${BORDER};border-radius:16px;">
              <table width="100%" cellpadding="0" cellspacing="0">

                <!-- Logo / brand -->
                <tr>
                  <td style="padding:24px 24px 0 24px;">
                    <div style="font-family:Arial,sans-serif;font-size:20px;font-weight:900;color:#FFFFFF;letter-spacing:-0.5px;">
                      Zkandar <span style="color:${LIME};">AI</span>
                    </div>
                  </td>
                </tr>

                ${bodyRows}

                <!-- Footer -->
                <tr>
                  <td style="padding:0 24px 24px 24px;border-top:1px solid ${BORDER};margin-top:24px;">
                    <div style="font-family:Arial,sans-serif;font-size:11px;color:${GRAY_400};margin-top:20px;line-height:1.6;">
                      You received this email because an action was requested on your Zkandar AI account.
                      If you did not request this, you can safely ignore this email.
                    </div>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function ctaButton(url: string, label: string): string {
    return `<table cellpadding="0" cellspacing="0" style="margin-top:20px;">
  <tr>
    <td bgcolor="${LIME}" style="border-radius:10px;">
      <a href="${url}" style="display:inline-block;padding:14px 24px;font-family:Arial,sans-serif;font-size:14px;font-weight:700;color:${LIME_TEXT};text-decoration:none;border-radius:10px;">
        ${label}
      </a>
    </td>
  </tr>
</table>`
}

function infoBox(content: string): string {
    return `<table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND_BG};border:1px solid ${BORDER};border-radius:12px;margin-top:16px;">
  <tr>
    <td style="padding:14px;font-family:Arial,sans-serif;font-size:13px;color:${GRAY_300};line-height:1.6;">
      ${content}
    </td>
  </tr>
</table>`
}

function headingRow(greeting: string, body: string): string {
    return `<tr>
  <td style="padding:20px 24px 16px 24px;border-bottom:1px solid ${BORDER};">
    <div style="font-family:Arial,sans-serif;font-size:18px;font-weight:700;color:#FFFFFF;">${greeting}</div>
    <div style="font-family:Arial,sans-serif;font-size:14px;color:${GRAY_300};margin-top:8px;line-height:1.6;">${body}</div>
  </td>
</tr>`
}

function ctaRow(ctaHtml: string): string {
    return `<tr>
  <td style="padding:20px 24px 20px 24px;">
    ${ctaHtml}
  </td>
</tr>`
}

// ─── Template builders ────────────────────────────────────────────────────────
function buildSignupEmail(actionUrl: string, name: string): { subject: string; html: string } {
    const subject = 'Confirm your Zkandar AI account'
    const rows = [
        headingRow(
            `Welcome${name ? `, ${name}` : ''}! 👋`,
            "Thanks for creating your account. Please confirm your email address to get started with the Zkandar AI Masterclass Hub."
        ),
        ctaRow(`
            ${ctaButton(actionUrl, 'Confirm Email')}
            ${infoBox("This link expires in <strong>24 hours</strong>. After confirming, you'll be guided through your onboarding.")}
        `),
    ].join('')
    return { subject, html: wrapHtml(subject, rows) }
}

function buildMagicLinkEmail(actionUrl: string, name: string): { subject: string; html: string } {
    const subject = 'Your sign-in link for Zkandar AI'
    const rows = [
        headingRow(
            `Sign in${name ? `, ${name}` : ''}`,
            "Use the button below to securely sign in to your Zkandar AI account. This is a one-time link."
        ),
        ctaRow(`
            ${ctaButton(actionUrl, 'Sign In to Zkandar AI')}
            ${infoBox("This link expires in <strong>60 minutes</strong> and can only be used once. If you didn't request this, you can safely ignore this email.")}
        `),
    ].join('')
    return { subject, html: wrapHtml(subject, rows) }
}

function buildRecoveryEmail(actionUrl: string, name: string): { subject: string; html: string } {
    const subject = 'Reset your Zkandar AI password'
    const rows = [
        headingRow(
            `Password reset${name ? ` for ${name}` : ''}`,
            "We received a request to reset your password. Click the button below to choose a new one."
        ),
        ctaRow(`
            ${ctaButton(actionUrl, 'Reset Password')}
            ${infoBox("This link expires in <strong>60 minutes</strong>. If you didn't request a password reset, you can safely ignore this email — your password won't change.")}
        `),
    ].join('')
    return { subject, html: wrapHtml(subject, rows) }
}

function buildInviteEmail(actionUrl: string, name: string, role: string): { subject: string; html: string } {
    const subject = "You've been invited to Zkandar AI Masterclass"
    const roleLabel = role
        ? role.charAt(0).toUpperCase() + role.slice(1)
        : 'Participant'
    const rows = [
        headingRow(
            `You're invited${name ? `, ${name}` : ''}! 🎉`,
            `You've been added to the Zkandar AI Masterclass Hub as <strong style="color:#FFFFFF;">${roleLabel}</strong>. Click the button below to accept your invitation and set up your account.`
        ),
        ctaRow(`
            ${ctaButton(actionUrl, 'Accept Invitation')}
            ${infoBox("This invitation expires in <strong>7 days</strong>. After accepting, you'll be guided through a quick onboarding to personalise your experience.")}
        `),
    ].join('')
    return { subject, html: wrapHtml(subject, rows) }
}

function buildEmailChangeEmail(actionUrl: string, newEmail: string): { subject: string; html: string } {
    const subject = 'Confirm your new email address'
    const rows = [
        headingRow(
            'Confirm your new email',
            `You requested to change your Zkandar AI account email to <strong style="color:#FFFFFF;">${newEmail}</strong>. Click the button below to confirm this change.`
        ),
        ctaRow(`
            ${ctaButton(actionUrl, 'Confirm New Email')}
            ${infoBox("This link expires in <strong>24 hours</strong>. If you didn't request this change, please contact support immediately.")}
        `),
    ].join('')
    return { subject, html: wrapHtml(subject, rows) }
}

// ─── Main handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'content-type, x-supabase-signature' },
        })
    }

    const rawBody = await req.text()

    // Verify hook signature
    const valid = await verifyHookSignature(req, rawBody)
    if (!valid) {
        return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401 })
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
        console.error('RESEND_API_KEY is not set')
        return new Response(JSON.stringify({ error: 'Email service not configured' }), { status: 500 })
    }

    let payload: {
        user: { email: string; user_metadata?: Record<string, string> }
        email_data: {
            token_hash: string
            redirect_to: string
            email_action_type: string
            site_url: string
            new_email?: string
        }
    }

    try {
        payload = JSON.parse(rawBody)
    } catch {
        return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), { status: 400 })
    }

    const { user, email_data } = payload
    const { token_hash, redirect_to, email_action_type, site_url, new_email } = email_data

    // Build the Supabase verification URL
    // We can infer the Supabase API URL from the request origin since edge functions run on the same domain
    const reqUrl = new URL(req.url)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? reqUrl.origin
    const actionUrl =
        `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(redirect_to)}`

    const name: string = user.user_metadata?.full_name ?? ''
    const role: string = user.user_metadata?.role ?? ''

    let emailContent: { subject: string; html: string }

    switch (email_action_type) {
        case 'signup':
        case 'email':
            emailContent = buildSignupEmail(actionUrl, name)
            break
        case 'magiclink':
            emailContent = buildMagicLinkEmail(actionUrl, name)
            break
        case 'recovery':
            emailContent = buildRecoveryEmail(actionUrl, name)
            break
        case 'invite':
            emailContent = buildInviteEmail(actionUrl, name, role)
            break
        case 'email_change':
        case 'email_change_new':
            emailContent = buildEmailChangeEmail(actionUrl, new_email ?? user.email)
            break
        default:
            console.warn('Unknown email_action_type:', email_action_type)
            return new Response(JSON.stringify({ error: `Unsupported action type: ${email_action_type}` }), { status: 400 })
    }

    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
            from: FROM,
            to: user.email,
            subject: emailContent.subject,
            html: emailContent.html,
        }),
    })

    if (!res.ok) {
        const errText = await res.text()
        console.error('Resend error:', res.status, errText)
        return new Response(JSON.stringify({ error: `Resend error: ${errText}` }), { status: 500 })
    }

    console.log(`Auth email sent: type=${email_action_type}, to=${user.email}`)
    return new Response(JSON.stringify({ success: true }), { status: 200 })
})
