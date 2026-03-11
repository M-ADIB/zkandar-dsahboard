import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const resendApiKey = Deno.env.get('RESEND_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Handle CORS
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
    const { applicationId, status } = await req.json();

    if (!applicationId || !status) {
      throw new Error("Missing required parameters: applicationId or status");
    }

    if (!resendApiKey) {
      throw new Error("Missing RESEND_API_KEY");
    }

    // Connect to Supabase with service role key to bypass RLS
    const supabase = createClient(supabaseUrl!, supabaseKey!);
    const { data: app, error: fetchError } = await supabase
      .from('job_applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (fetchError || !app) {
      throw new Error(`Failed to fetch application details: ${fetchError?.message}`);
    }

    let subject = "";
    let htmlContent = "";

    const positionName = app.position_type.replace(/_/g, ' ');

    if (status === 'shortlisted') {
      subject = "Next Steps — Zkandar AI Application 🎉";
      htmlContent = `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0B0B0B;">
          <tr>
            <td align="center" style="padding:32px 16px;">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%;">
                <tr>
                  <td style="background:#111111; border:1px solid #1F2937; border-radius:16px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:22px 24px; border-bottom:1px solid #1F2937;">
                          <div style="font-family:Arial,sans-serif; font-size:18px; font-weight:700; color:#FFFFFF;">Hi ${app.full_name},</div>
                          <div style="font-family:Arial,sans-serif; font-size:14px; color:#D1D5DB; margin-top:8px;">
                            We reviewed your application for the <span style="text-transform: capitalize;"><strong>${positionName}</strong></span> position and we're excited to move you to the next stage of our process!
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:0 24px 24px 24px;">
                          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0B0B0B; border:1px solid #1F2937; border-radius:12px; margin-top:24px;">
                            <tr>
                              <td style="padding:14px; font-family:Arial,sans-serif;">
                                <div style="font-size:14px; font-weight:700; color:#FFFFFF;">Next Steps</div>
                                <div style="font-size:13px; color:#D1D5DB; margin-top:6px;">
                                  Our team will be reaching out to you shortly to schedule an interview. Please keep an eye on your inbox (and spam folder) for the calendar link.
                                </div>
                              </td>
                            </tr>
                          </table>
                          <div style="font-family:Arial,sans-serif; font-size:14px; font-weight:700; color:#FFFFFF; margin-top:24px;">Adib</div>
                          <div style="font-family:Arial,sans-serif; font-size:12px; color:#9CA3AF;">Ops Manager, Zkandar AI</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `;
    } else if (status === 'rejected') {
      subject = "Update on your application — Zkandar AI";
      htmlContent = `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0B0B0B;">
          <tr>
            <td align="center" style="padding:32px 16px;">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%;">
                <tr>
                  <td style="background:#111111; border:1px solid #1F2937; border-radius:16px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:22px 24px; border-bottom:1px solid #1F2937;">
                          <div style="font-family:Arial,sans-serif; font-size:18px; font-weight:700; color:#FFFFFF;">Hi ${app.full_name},</div>
                          <div style="font-family:Arial,sans-serif; font-size:14px; color:#D1D5DB; margin-top:8px;">
                            Thank you for taking the time to apply for the <span style="text-transform: capitalize;"><strong>${positionName}</strong></span> role at Zkandar AI.
                          </div>
                          <div style="font-family:Arial,sans-serif; font-size:14px; color:#D1D5DB; margin-top:12px;">
                            Currently, we are moving forward with other candidates whose experience more closely matches our precise needs for this specific role.
                          </div>
                          <div style="font-family:Arial,sans-serif; font-size:14px; color:#D1D5DB; margin-top:12px;">
                            We truly appreciate your interest in joining our team and wish you the best of luck in your job search.
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:0 24px 24px 24px;">
                          <div style="font-family:Arial,sans-serif; font-size:14px; font-weight:700; color:#FFFFFF; margin-top:24px;">Adib</div>
                          <div style="font-family:Arial,sans-serif; font-size:12px; color:#9CA3AF;">Ops Manager, Zkandar AI</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `;
    } else {
      throw new Error("Invalid status. Emails are only sent for 'shortlisted' or 'rejected'.");
    }

    const fullHtml = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <title>${subject}</title>
          <style type="text/css">
            body, table, td { font-family: Arial, sans-serif !important; }
          </style>
        </head>
        <body style="margin:0; padding:0; background:#0B0B0B;">
          ${htmlContent}
        </body>
      </html>
    `;

    const emailPayload = {
      from: 'Zkandar AI <careers@app.zkandar.com>',
      to: app.email,
      subject: subject,
      html: fullHtml,
    };

    console.log('Sending email to:', app.email, 'with subject:', subject);

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify(emailPayload),
    });

    const responseText = await res.text();
    console.log('Resend API response status:', res.status, 'body:', responseText);

    if (!res.ok) {
      throw new Error(`Resend API error (${res.status}): ${responseText}`);
    }

    const data = JSON.parse(responseText);
    console.log('Email sent successfully:', data);

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error sending email:', message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
