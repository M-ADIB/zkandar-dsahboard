import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const resendApiKey = Deno.env.get('RESEND_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

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

function row(label: string, value: string) {
  return `
    <tr>
      <td style="padding:8px 0; font-family:Arial,sans-serif; font-size:13px; color:#9CA3AF; width:170px; vertical-align:top;">${label}</td>
      <td style="padding:8px 0; font-family:Arial,sans-serif; font-size:13px; color:#FFFFFF; vertical-align:top;">${value}</td>
    </tr>`;
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { applicationId } = await req.json();

    if (!applicationId) throw new Error("Missing required parameter: applicationId");
    if (!resendApiKey) throw new Error("Missing RESEND_API_KEY");

    const supabase = createClient(supabaseUrl!, supabaseKey!);
    const { data: app, error: fetchError } = await supabase
      .from('job_applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (fetchError || !app) {
      throw new Error(`Failed to fetch application: ${fetchError?.message}`);
    }

    const submittedAt = new Date(app.created_at).toLocaleString('en-GB', {
      timeZone: 'Asia/Dubai',
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }) + ' GST';

    const instagramLink = app.instagram_url
      ? `<a href="${app.instagram_url}" style="color:#D0FF71;">${app.instagram_url}</a>`
      : '—';

    const videoLink = app.video_intro_url
      ? `<a href="${app.video_intro_url}" style="color:#D0FF71;">${app.video_intro_url}</a>`
      : '—';

    const subject = `New Application — ${app.full_name}`;

    const htmlContent = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0B0B0B;">
        <tr>
          <td align="center" style="padding:32px 16px;">
            <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%;">
              <tr>
                <td style="background:#111111; border:1px solid #1F2937; border-radius:16px;">
                  <table width="100%" cellpadding="0" cellspacing="0">

                    <!-- Header -->
                    <tr>
                      <td style="padding:22px 24px; border-bottom:1px solid #1F2937;">
                        <div style="font-family:Arial,sans-serif; font-size:11px; font-weight:700; color:#D0FF71; text-transform:uppercase; letter-spacing:2px; margin-bottom:8px;">New Sales Application</div>
                        <div style="font-family:Arial,sans-serif; font-size:20px; font-weight:700; color:#FFFFFF;">${app.full_name}</div>
                        <div style="font-family:Arial,sans-serif; font-size:13px; color:#9CA3AF; margin-top:4px;">Submitted ${submittedAt}</div>
                      </td>
                    </tr>

                    <!-- Contact Info -->
                    <tr>
                      <td style="padding:20px 24px; border-bottom:1px solid #1F2937;">
                        <div style="font-family:Arial,sans-serif; font-size:11px; font-weight:700; color:#D0FF71; text-transform:uppercase; letter-spacing:2px; margin-bottom:12px;">Contact</div>
                        <table width="100%" cellpadding="0" cellspacing="0">
                          ${row('Email', app.email)}
                          ${row('Phone', app.phone || '—')}
                          ${row('Gender', app.gender || '—')}
                          ${row('Country', app.country || '—')}
                          ${row('Timezone', app.timezone || '—')}
                          ${row('Instagram', instagramLink)}
                        </table>
                      </td>
                    </tr>

                    <!-- Sales Profile -->
                    <tr>
                      <td style="padding:20px 24px; border-bottom:1px solid #1F2937;">
                        <div style="font-family:Arial,sans-serif; font-size:11px; font-weight:700; color:#D0FF71; text-transform:uppercase; letter-spacing:2px; margin-bottom:12px;">Sales Profile</div>
                        <table width="100%" cellpadding="0" cellspacing="0">
                          ${row('Experience', app.years_experience || '—')}
                          ${row('Avg Deal Size', app.avg_deal_size || '—')}
                          ${row('Sold Info Products', app.sold_info_products || '—')}
                          ${row('Expected Monthly', app.expected_monthly_earnings || '—')}
                          ${row('Video Intro', videoLink)}
                        </table>
                      </td>
                    </tr>

                    <!-- CTA -->
                    <tr>
                      <td style="padding:20px 24px;">
                        <div style="font-family:Arial,sans-serif; font-size:13px; color:#9CA3AF;">
                          Review this application in the <strong style="color:#FFFFFF;">Recruiting</strong> tab of the admin dashboard.
                        </div>
                      </td>
                    </tr>

                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>`;

    const fullHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${subject}</title>
    <style type="text/css">body, table, td { font-family: Arial, sans-serif !important; }</style>
  </head>
  <body style="margin:0; padding:0; background:#0B0B0B;">
    ${htmlContent}
  </body>
</html>`;

    const emailPayload = {
      from: 'Zkandar AI <careers@app.zkandar.com>',
      to: 'admin@zkandar.com',
      subject,
      html: fullHtml,
    };

    console.log('Sending admin notification for application:', applicationId);

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify(emailPayload),
    });

    const responseText = await res.text();
    console.log('Resend API response:', res.status, responseText);

    if (!res.ok) {
      throw new Error(`Resend API error (${res.status}): ${responseText}`);
    }

    const data = JSON.parse(responseText);
    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error sending admin notification:', message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
