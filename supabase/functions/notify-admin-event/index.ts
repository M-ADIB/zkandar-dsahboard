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
    const { eventId } = await req.json();

    if (!eventId) throw new Error("Missing required parameter: eventId");
    if (!resendApiKey) throw new Error("Missing RESEND_API_KEY");

    const supabase = createClient(supabaseUrl!, supabaseKey!);
    const { data: ev, error: fetchError } = await supabase
      .from('event_requests')
      .select('*')
      .eq('id', eventId)
      .single();

    if (fetchError || !ev) {
      throw new Error(`Failed to fetch event request: ${fetchError?.message}`);
    }

    const submittedAt = new Date(ev.created_at).toLocaleString('en-GB', {
      timeZone: 'Asia/Dubai',
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }) + ' GST';

    const proposedDate = ev.proposed_date
      ? new Date(ev.proposed_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : '—';

    const descriptionSnippet = ev.event_description
      ? (ev.event_description.length > 200
          ? ev.event_description.slice(0, 200) + '…'
          : ev.event_description)
      : '—';

    const techList = Array.isArray(ev.available_tech) && ev.available_tech.length > 0
      ? ev.available_tech.join(', ')
      : '—';

    const subject = `New Event Request — ${ev.company} / ${ev.event_type}`;

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
                        <div style="font-family:Arial,sans-serif; font-size:11px; font-weight:700; color:#D0FF71; text-transform:uppercase; letter-spacing:2px; margin-bottom:8px;">New Event Request</div>
                        <div style="font-family:Arial,sans-serif; font-size:20px; font-weight:700; color:#FFFFFF;">${ev.company}</div>
                        <div style="font-family:Arial,sans-serif; font-size:14px; color:#D1D5DB; margin-top:4px;">${ev.event_type}</div>
                        <div style="font-family:Arial,sans-serif; font-size:13px; color:#9CA3AF; margin-top:4px;">Submitted ${submittedAt}</div>
                      </td>
                    </tr>

                    <!-- Organizer -->
                    <tr>
                      <td style="padding:20px 24px; border-bottom:1px solid #1F2937;">
                        <div style="font-family:Arial,sans-serif; font-size:11px; font-weight:700; color:#D0FF71; text-transform:uppercase; letter-spacing:2px; margin-bottom:12px;">Organizer</div>
                        <table width="100%" cellpadding="0" cellspacing="0">
                          ${row('Name', ev.full_name)}
                          ${row('Email', ev.email)}
                          ${row('Role', ev.role_title || '—')}
                          ${row('Day-of Contact', ev.contact_name ? `${ev.contact_name} — ${ev.contact_phone}` : '—')}
                        </table>
                      </td>
                    </tr>

                    <!-- Event Details -->
                    <tr>
                      <td style="padding:20px 24px; border-bottom:1px solid #1F2937;">
                        <div style="font-family:Arial,sans-serif; font-size:11px; font-weight:700; color:#D0FF71; text-transform:uppercase; letter-spacing:2px; margin-bottom:12px;">Event Details</div>
                        <table width="100%" cellpadding="0" cellspacing="0">
                          ${row('Date', proposedDate)}
                          ${row('Venue', ev.venue || '—')}
                          ${row('Audience Size', ev.audience_size ? String(ev.audience_size) : '—')}
                          ${row('Session Format', ev.session_format || '—')}
                          ${row('Duration', ev.duration || '—')}
                          ${row('Moderator', ev.has_moderator ? 'Yes' : 'No')}
                          ${row('Q&A', ev.has_qa ? 'Yes' : 'No')}
                          ${row('Catering', ev.has_catering ? 'Yes' : 'No')}
                          ${row('Available Tech', techList)}
                          ${row('Marketing Flyer', ev.marketing_flyer || '—')}
                        </table>
                      </td>
                    </tr>

                    <!-- Description -->
                    <tr>
                      <td style="padding:20px 24px; border-bottom:1px solid #1F2937;">
                        <div style="font-family:Arial,sans-serif; font-size:11px; font-weight:700; color:#D0FF71; text-transform:uppercase; letter-spacing:2px; margin-bottom:10px;">Event Description</div>
                        <div style="font-family:Arial,sans-serif; font-size:13px; color:#D1D5DB; line-height:1.6;">${descriptionSnippet}</div>
                      </td>
                    </tr>

                    <!-- CTA -->
                    <tr>
                      <td style="padding:20px 24px;">
                        <div style="font-family:Arial,sans-serif; font-size:13px; color:#9CA3AF;">
                          Review this request in the <strong style="color:#FFFFFF;">Events</strong> tab of the admin dashboard.
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
      from: 'Zkandar AI <events@app.zkandar.com>',
      to: 'admin@zkandar.com',
      subject,
      html: fullHtml,
    };

    console.log('Sending admin notification for event:', eventId);

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
