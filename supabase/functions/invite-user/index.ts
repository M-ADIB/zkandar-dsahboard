import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const FROM = 'Zkandar AI <admin@zkandar.com>'
const BRAND_BG = '#0B0B0B'
const CARD_BG = '#111111'
const BORDER = '#1F2937'
const LIME = '#D0FF71'
const LIME_TEXT = '#0B0B0B'
const GRAY_300 = '#D1D5DB'
const GRAY_400 = '#9CA3AF'

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
                <tr>
                  <td style="padding:24px 24px 0 24px;">
                    <div style="font-family:Arial,sans-serif;font-size:20px;font-weight:900;color:#FFFFFF;letter-spacing:-0.5px;">
                      Zkandar <span style="color:${LIME};">AI</span>
                    </div>
                  </td>
                </tr>
                ${bodyRows}
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

function buildWelcomeEmailSprintWorkshop(actionUrl: string, email: string, password: string): { subject: string; html: string } {
    const subject = "Welcome aboard Sprint Workshop"
    const rows = [
        headingRow(
            `You're invited! 🎉`,
            `You've been added to the Zkandar AI Sprint Workshop. Use the credentials below to log in.`
        ),
        ctaRow(`
            ${infoBox(`<strong>Email:</strong> ${email}<br/><strong>Temporary Password:</strong> ${password}<br/><br/><em>On your first sign in, you'll be able to update your password.</em>`)}
            ${ctaButton(actionUrl, 'Sign In Now')}
        `),
    ].join('')
    return { subject, html: wrapHtml(subject, rows) }
}

function buildWelcomeEmailMasterclassTeam(actionUrl: string, email: string, password: string): { subject: string; html: string } {
    const subject = "Welcome to the Zkandar AI Masterclass"
    const rows = [
        headingRow(
            `Welcome aboard! 🚀`,
            `You've been invited to the Zkandar AI Masterclass. Prepare to upskill, discover new tools, and accelerate your daily workflows with cutting-edge AI.`
        ),
        ctaRow(`
            ${infoBox(`<strong>Email:</strong> ${email}<br/><strong>Temporary Password:</strong> ${password}<br/><br/><em>Log in to access your sessions, assignments, and onboarding tools.</em>`)}
            ${ctaButton(actionUrl, 'Sign In Now')}
        `),
    ].join('')
    return { subject, html: wrapHtml(subject, rows) }
}

function buildWelcomeEmailMasterclassMgmt(actionUrl: string, email: string, password: string): { subject: string; html: string } {
    const subject = "Welcome to Zkandar AI Management"
    const rows = [
        headingRow(
            `Welcome to the Hub! 📊`,
            `You've been granted Executive access to the Zkandar AI Masterclass Hub. Prepare to lead your team into the era of AI, track their progress, and measure productivity gains across your company.`
        ),
        ctaRow(`
            ${infoBox(`<strong>Email:</strong> ${email}<br/><strong>Temporary Password:</strong> ${password}<br/><br/><em>Log in to access the executive dashboard and invite your team.</em>`)}
            ${ctaButton(actionUrl, 'Access Dashboard')}
        `),
    ].join('')
    return { subject, html: wrapHtml(subject, rows) }
}

function getCorsHeaders(req: Request): Record<string, string> {
    const allowedOrigin = Deno.env.get('ALLOWED_ORIGIN')
    const requestOrigin = req.headers.get('origin') ?? ''
    
    const isLocalhost = requestOrigin.startsWith('http://localhost:') || requestOrigin.startsWith('http://127.0.0.1:')
    const origin = isLocalhost ? requestOrigin : (allowedOrigin || '*')
    
    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
    }
}

Deno.serve(async (req) => {
    const corsHeaders = getCorsHeaders(req)

    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders })
    }

    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'DEBUG 401: Missing Auth Header entirely in the request.' }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const adminClient = createClient(supabaseUrl, serviceRoleKey)
        
        // Pass the auth token dynamically to verify the user
        const token = authHeader.replace(/^Bearer\s+/i, '')
        const { data: { user: callerAuth }, error: authError } = await adminClient.auth.getUser(token)
        if (authError || !callerAuth) {
            return new Response(JSON.stringify({ error: `DEBUG 401: Unauthorized user fetch. Token snippet: ${token.substring(0, 10)}... Error: ${authError?.message || 'No user found'}` }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // Use service role for admin operations
        const { data: callerProfile } = await adminClient
            .from('users')
            .select('role')
            .eq('id', callerAuth.id)
            .single()

        if (!callerProfile || !['owner', 'admin'].includes(callerProfile.role)) {
            return new Response(JSON.stringify({ error: `DEBUG 403: Forbidden admins only. Caller role: ${callerProfile?.role}` }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // Parse body
        const { email, role, company_id, cohort_id, first_name, last_name } = await req.json() as {
            email: string
            role: string
            company_id?: string
            cohort_id?: string
            first_name?: string
            last_name?: string
        }

        if (!email || !role) {
            return new Response(JSON.stringify({ error: 'DEBUG 400: email and role are required' }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const tempPassword = crypto.randomUUID().slice(0, 12) + "A1!"
        const fullName = [first_name, last_name].filter(Boolean).join(' ').trim()

        // Create the user with email auto-confirmed
        const { data: invitedUser, error: inviteError } = await adminClient.auth.admin.createUser({
            email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
                role,
                company_id: company_id ?? null,
                cohort_id: cohort_id ?? null,
                first_name: first_name ?? null,
                last_name: last_name ?? null,
                full_name: fullName || null,
            }
        })

        if (inviteError) {
            const msg = inviteError.message.toLowerCase().includes('already registered')
                ? 'This email is already registered'
                : inviteError.message
            return new Response(JSON.stringify({ error: `DEBUG 400 Invite Error: ${msg}` }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        if (invitedUser?.user?.id && fullName) {
            // Guarantee the users table is updated explicitly in case the auth trigger missed it
            await adminClient.from('users').update({ full_name: fullName }).eq('id', invitedUser.user.id);
        }

        const resendApiKey = Deno.env.get('RESEND_API_KEY')
        if (!resendApiKey) {
            return new Response(JSON.stringify({ error: 'DEBUG 500: Email service not configured' }), { 
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        const actionUrl = `${Deno.env.get('ALLOWED_ORIGIN') ?? 'https://app.zkandar.com'}/auth`
        
        let emailContent = { subject: "Welcome to Zkandar AI", html: "" };
        if (cohort_id) {
            const { data: cohortData } = await adminClient.from('cohorts').select('offering_type').eq('id', cohort_id).single();
            if (cohortData?.offering_type === 'sprint_workshop') {
                emailContent = buildWelcomeEmailSprintWorkshop(actionUrl, email, tempPassword);
            } else if (cohortData?.offering_type === 'master_class') {
                if (role === 'executive') {
                    emailContent = buildWelcomeEmailMasterclassMgmt(actionUrl, email, tempPassword);
                } else {
                    emailContent = buildWelcomeEmailMasterclassTeam(actionUrl, email, tempPassword);
                }
            } else {
                emailContent = buildWelcomeEmailSprintWorkshop(actionUrl, email, tempPassword);
            }
        } else {
            emailContent = buildWelcomeEmailSprintWorkshop(actionUrl, email, tempPassword);
        }
        
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
                from: FROM,
                reply_to: 'admin@zkandar.com',
                to: email,
                subject: emailContent.subject,
                html: emailContent.html,
            }),
        })

        if (!res.ok) {
            const errText = await res.text()
            return new Response(JSON.stringify({ error: `DEBUG 500: Invite created but failed to send email: ${errText}` }), { 
                status: 200, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // Insert tracking record in the invitations table for admin UI display
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        await adminClient.from('invitations').insert({
            email,
            company_id: company_id ?? null,
            invited_by: callerAuth.id,
            token: invitedUser?.user?.id ?? crypto.randomUUID(),
            status: 'pending',
            expires_at: expiresAt,
        })

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal error'
        return new Response(JSON.stringify({ error: `DEBUG 500 Catch: ${message}` }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
