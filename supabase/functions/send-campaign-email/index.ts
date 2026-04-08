import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

/**
 * send-campaign-email — processes email queue rows and sends via Resend.
 *
 * Called two ways:
 *   1) { campaign_id: "<uuid>" }  — flush a specific campaign (Send Now)
 *   2) { flush_all: true }        — flush ALL pending rows where send_after <= now() (cron)
 *
 * Required secrets:
 *   RESEND_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const FROM = 'Zkandar AI <hello@app.zkandar.com>';
const REPLY_TO = 'admin@zkandar.com';

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

interface QueueRow {
    id: string;
    campaign_id: string | null;
    recipient_email: string;
    recipient_name: string | null;
    subject: string;
    html_body: string;
    status: string;
    attempts: number;
}

async function sendOneEmail(row: QueueRow): Promise<boolean> {
    try {
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: FROM,
                reply_to: REPLY_TO,
                to: row.recipient_email,
                subject: row.subject,
                html: row.html_body,
            }),
        });

        if (!res.ok) {
            const errText = await res.text();
            console.error(`Resend error for ${row.recipient_email}: ${res.status} ${errText}`);
            return false;
        }

        return true;
    } catch (err) {
        console.error(`Network error sending to ${row.recipient_email}:`, err);
        return false;
    }
}

Deno.serve(async (req: Request) => {
    const corsHeaders = getCorsHeaders(req);
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        if (!RESEND_API_KEY) throw new Error('Missing RESEND_API_KEY');

        const body = await req.json();
        const campaignId: string | null = body.campaign_id ?? null;
        const flushAll: boolean = body.flush_all === true;

        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

        // Build query for pending rows
        let query = supabase
            .from('email_queue')
            .select('*')
            .in('status', ['pending'])
            .order('created_at', { ascending: true })
            .limit(200);

        if (campaignId) {
            query = query.eq('campaign_id', campaignId);
        }

        if (flushAll) {
            // Only fetch rows whose send_after has passed or is null
            query = query.or('send_after.is.null,send_after.lte.' + new Date().toISOString());
        }

        const { data: rows, error: fetchErr } = await query;
        if (fetchErr) throw new Error(`Failed to fetch queue: ${fetchErr.message}`);
        if (!rows || rows.length === 0) {
            return new Response(JSON.stringify({ success: true, processed: 0 }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        let sentCount = 0;
        let failedCount = 0;
        const campaignIds = new Set<string>();

        // Process in batches of 10
        const BATCH_SIZE = 10;
        for (let i = 0; i < rows.length; i += BATCH_SIZE) {
            const batch = rows.slice(i, i + BATCH_SIZE) as QueueRow[];

            // Mark batch as processing
            const batchIds = batch.map((r) => r.id);
            await supabase
                .from('email_queue')
                .update({ status: 'processing' })
                .in('id', batchIds);

            // Send all in parallel within batch
            const results = await Promise.allSettled(
                batch.map(async (row) => {
                    const ok = await sendOneEmail(row);
                    const newStatus = ok ? 'sent' : 'failed';

                    // Update queue row
                    await supabase
                        .from('email_queue')
                        .update({ status: newStatus, attempts: row.attempts + 1 })
                        .eq('id', row.id);

                    // Update campaign recipient row
                    if (row.campaign_id) {
                        campaignIds.add(row.campaign_id);
                        await supabase
                            .from('email_campaign_recipients')
                            .update({ status: newStatus })
                            .eq('campaign_id', row.campaign_id)
                            .eq('email', row.recipient_email);
                    }

                    return ok;
                })
            );

            for (const r of results) {
                if (r.status === 'fulfilled' && r.value) sentCount++;
                else failedCount++;
            }
        }

        // Update campaign status for each campaign processed
        for (const cId of campaignIds) {
            // Check if all queue rows for this campaign are done
            const { data: remaining } = await supabase
                .from('email_queue')
                .select('id')
                .eq('campaign_id', cId)
                .in('status', ['pending', 'processing'])
                .limit(1);

            if (!remaining || remaining.length === 0) {
                await supabase
                    .from('email_campaigns')
                    .update({ status: 'sent', sent_at: new Date().toISOString() })
                    .eq('id', cId);
            }
        }

        console.log(`Campaign email processing complete: sent=${sentCount}, failed=${failedCount}`);
        return new Response(
            JSON.stringify({ success: true, processed: sentCount + failedCount, sent: sentCount, failed: failedCount }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('send-campaign-email error:', message);
        return new Response(JSON.stringify({ error: message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
