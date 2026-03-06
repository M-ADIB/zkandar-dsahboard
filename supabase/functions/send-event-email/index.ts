import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const resendApiKey = Deno.env.get('RESEND_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Handle CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { eventId, status } = await req.json();

    if (!eventId || !status) {
      throw new Error("Missing required parameters: eventId or status");
    }

    if (!resendApiKey) {
      throw new Error("Missing RESEND_API_KEY");
    }

    // Connect to Supabase with service role key to bypass RLS
    const supabase = createClient(supabaseUrl!, supabaseKey!);
    const { data: event, error: fetchError } = await supabase
      .from('event_requests')
      .select('*')
      .eq('id', eventId)
      .single();

    if (fetchError || !event) {
      throw new Error(`Failed to fetch event details: ${fetchError?.message}`);
    }

    let subject = "";
    let htmlContent = "";

    if (status === 'approved') {
      subject = "You're confirmed — Zkandar AI Talk 🎉";
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
                          <div style="font-family:Arial,sans-serif; font-size:18px; font-weight:700; color:#FFFFFF;">Hi ${event.full_name},</div>
                          <div style="font-family:Arial,sans-serif; font-size:14px; color:#D1D5DB; margin-top:8px;">
                            We're very excited to confirm Khaled for your upcoming speaking engagement on <strong>${event.proposed_date}</strong>.
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:22px 24px;">
                          <div style="font-family:Arial,sans-serif; font-size:13px; color:#9CA3AF; font-weight:700; text-transform:uppercase;">Speaker Resources</div>
                          <div style="font-family:Arial,sans-serif; font-size:15px; font-weight:700; color:#FFFFFF; margin-top:6px;">Electronic Press Kit</div>
                          <div style="font-family:Arial,sans-serif; font-size:14px; color:#D1D5DB; margin-top:6px;">
                            In the meantime, you can access Khaled's official EPK and branding assets here:
                          </div>
                          <table cellpadding="0" cellspacing="0" style="margin-top:16px;">
                            <tr>
                              <td bgcolor="#D0FF71" style="border-radius:10px;">
                                <a href="https://ops.zkandar.com/epk"
                                   style="display:inline-block; padding:14px 22px; font-family:Arial,sans-serif; font-size:14px; font-weight:700; color:#0B0B0B; text-decoration:none; border-radius:10px;">
                                  Access EPK
                                </a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:0 24px 24px 24px;">
                          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0B0B0B; border:1px solid #1F2937; border-radius:12px;">
                            <tr>
                              <td style="padding:14px; font-family:Arial,sans-serif;">
                                <div style="font-size:14px; font-weight:700; color:#FFFFFF;">Next Steps</div>
                                <div style="font-size:13px; color:#D1D5DB; margin-top:6px;">
                                  Adib will be in touch with ${event.contact_name} at ${event.contact_phone} to confirm the run of show and AV requirements.
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
    } else if (status === 'declined') {
      subject = "Thank you for reaching out — Zkandar AI";
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
                          <div style="font-family:Arial,sans-serif; font-size:18px; font-weight:700; color:#FFFFFF;">Hi ${event.full_name},</div>
                          <div style="font-family:Arial,sans-serif; font-size:14px; color:#D1D5DB; margin-top:8px;">
                            Thank you so much for reaching out and extending this speaking opportunity to Khaled. 
                          </div>
                          <div style="font-family:Arial,sans-serif; font-size:14px; color:#D1D5DB; margin-top:12px;">
                            Unfortunately, due to current capacity and scheduling constraints, we are unable to commit to this event at this time.
                          </div>
                          <div style="font-family:Arial,sans-serif; font-size:14px; color:#D1D5DB; margin-top:12px;">
                            We truly appreciate your interest and hope to collaborate in the future.
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
      throw new Error("Invalid status. Emails are only sent for 'approved' or 'declined'.");
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
      from: 'Zkandar AI <events@app.zkandar.com>',
      to: event.email,
      subject: subject,
      html: fullHtml,
    };

    console.log('Sending email to:', event.email, 'with subject:', subject);

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
