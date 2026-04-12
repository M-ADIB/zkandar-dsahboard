import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

/**
 * send-content-digest — Daily Digest Email Service
 *
 * Fetches the top-relevance content items from the past 24 hours and emails
 * them as a formatted HTML digest to all active subscribers.
 *
 * Payload: {} (no required params — designed for cron + manual trigger)
 *
 * Required secrets:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   RESEND_API_KEY
 */

const SUPABASE_URL  = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_KEY    = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM          = "Zkandar AI <hello@app.zkandar.com>";
const REPLY_TO      = "admin@zkandar.com";

function getCorsHeaders(req: Request): Record<string, string> {
    const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN");
    const requestOrigin = req.headers.get("origin") ?? "";
    const origin = allowedOrigin
        ? (requestOrigin === allowedOrigin ? requestOrigin : allowedOrigin)
        : requestOrigin || "*";
    return {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface DigestItem {
    id: string;
    title: string;
    original_url: string;
    summary: string | null;
    relevance_score: number | null;
    action_items: string[];
    source_name: string | null;
    source_type: string | null;
}

interface Subscriber {
    email: string;
    name: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Email HTML builder
// ─────────────────────────────────────────────────────────────────────────────

function relevanceBadgeColor(score: number | null): string {
    if (!score) return "#6b7280";
    if (score >= 80) return "#84cc16";   // lime — high
    if (score >= 60) return "#f59e0b";   // amber — medium
    return "#6b7280";                    // gray — low
}

function sourceTypeLabel(type: string | null): string {
    if (type === "video_channel") return "Video";
    if (type === "blog")          return "Blog";
    if (type === "search_query")  return "Search";
    return "Source";
}

function buildDigestHtml(items: DigestItem[], recipientName: string | null, date: string): string {
    const greeting = recipientName ? `Hi ${recipientName},` : "Hi there,";

    const itemCards = items
        .map((item) => {
            const badgeColor  = relevanceBadgeColor(item.relevance_score);
            const scoreLabel  = item.relevance_score ? `${item.relevance_score}/100` : "N/A";
            const actionsList = (item.action_items ?? [])
                .slice(0, 3)
                .map((a) => `<li style="margin:4px 0;color:#d1d5db;font-size:13px;">${a}</li>`)
                .join("");

            return `
<div style="background:#111;border:1px solid #1f2937;border-radius:12px;padding:20px;margin-bottom:16px;">
  <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px;">
    <div style="flex:1;">
      <span style="font-size:10px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;color:#6b7280;background:#1f2937;padding:2px 8px;border-radius:999px;">${sourceTypeLabel(item.source_type)}${item.source_name ? " · " + item.source_name : ""}</span>
    </div>
    <span style="font-size:11px;font-weight:700;color:${badgeColor};background:${badgeColor}1a;padding:2px 8px;border-radius:999px;white-space:nowrap;margin-left:8px;">Score ${scoreLabel}</span>
  </div>
  <h3 style="margin:8px 0;font-size:16px;font-weight:700;color:#f9fafb;line-height:1.4;">${item.title}</h3>
  ${item.summary ? `<p style="margin:8px 0;font-size:14px;color:#9ca3af;line-height:1.6;">${item.summary}</p>` : ""}
  ${actionsList ? `
  <div style="margin-top:12px;">
    <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Action Items</p>
    <ul style="margin:0;padding-left:16px;">${actionsList}</ul>
  </div>` : ""}
  <a href="${item.original_url}" style="display:inline-block;margin-top:14px;font-size:13px;font-weight:600;color:#84cc16;text-decoration:none;">Read full article →</a>
</div>`;
        })
        .join("\n");

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Zkandar Content Digest — ${date}</title>
</head>
<body style="margin:0;padding:0;background:#050505;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#050505;min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding:0 0 32px;">
              <div style="display:flex;align-items:center;margin-bottom:24px;">
                <span style="font-size:22px;font-weight:800;color:#f9fafb;letter-spacing:-0.5px;">Zkandar</span>
                <span style="margin-left:8px;font-size:11px;font-weight:600;background:#84cc16;color:#050505;padding:2px 8px;border-radius:999px;letter-spacing:0.05em;">DIGEST</span>
              </div>
              <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#f9fafb;line-height:1.2;">Today's Content Brief</h1>
              <p style="margin:0;font-size:14px;color:#6b7280;">${greeting} Here are the top ${items.length} items curated for you on ${date}.</p>
            </td>
          </tr>

          <!-- Items -->
          <tr>
            <td>${itemCards}</td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:32px 0 0;border-top:1px solid #1f2937;margin-top:24px;">
              <p style="margin:0;font-size:12px;color:#374151;text-align:center;">
                You're receiving this because you're subscribed to the Zkandar Content Digest.<br>
                &copy; ${new Date().getFullYear()} Zkandar. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Send via Resend
// ─────────────────────────────────────────────────────────────────────────────

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    if (!RESEND_KEY) {
        console.warn("RESEND_API_KEY not set — skipping email send");
        return false;
    }

    try {
        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${RESEND_KEY}`,
            },
            body: JSON.stringify({
                from:     FROM,
                reply_to: REPLY_TO,
                to,
                subject,
                html,
            }),
            signal: AbortSignal.timeout(10_000),
        });

        if (!res.ok) {
            const errText = await res.text();
            console.error(`Resend error for ${to}: ${res.status} ${errText}`);
            return false;
        }

        return true;
    } catch (err) {
        console.error(`Network error sending to ${to}:`, err);
        return false;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main handler
// ─────────────────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
    const corsHeaders = getCorsHeaders(req);

    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

        // 1. Check digest is enabled
        const { data: settings } = await supabase
            .from("platform_settings")
            .select("key, value")
            .in("key", ["content_digest_enabled"]);

        const settingMap: Record<string, string> = {};
        (settings ?? []).forEach((s: { key: string; value: string }) => { settingMap[s.key] = s.value; });

        if (settingMap["content_digest_enabled"] !== "true") {
            return new Response(
                JSON.stringify({ success: true, skipped: true, reason: "digest disabled" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 2. Fetch top-relevance items from the past 24h (score >= 60, not archived)
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        const { data: rawItems, error: itemsErr } = await supabase
            .from("content_items")
            .select("id, title, original_url, summary, relevance_score, action_items, content_sources(name, type)")
            .eq("is_archived", false)
            .gte("relevance_score", 60)
            .gte("created_at", since)
            .order("relevance_score", { ascending: false })
            .limit(12);

        if (itemsErr) throw new Error(`Failed to fetch items: ${itemsErr.message}`);

        if (!rawItems || rawItems.length === 0) {
            return new Response(
                JSON.stringify({ success: true, skipped: true, reason: "no qualifying items" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const items: DigestItem[] = (rawItems as {
            id: string;
            title: string;
            original_url: string;
            summary: string | null;
            relevance_score: number | null;
            action_items: string[];
            content_sources: { name: string; type: string } | null;
        }[]).map((r) => ({
            id:              r.id,
            title:           r.title,
            original_url:    r.original_url,
            summary:         r.summary,
            relevance_score: r.relevance_score,
            action_items:    Array.isArray(r.action_items) ? r.action_items : [],
            source_name:     r.content_sources?.name ?? null,
            source_type:     r.content_sources?.type ?? null,
        }));

        // 3. Fetch active subscribers
        const { data: subscribers, error: subErr } = await supabase
            .from("content_subscribers")
            .select("email, name")
            .eq("active", true);

        if (subErr) throw new Error(`Failed to fetch subscribers: ${subErr.message}`);
        if (!subscribers || subscribers.length === 0) {
            return new Response(
                JSON.stringify({ success: true, skipped: true, reason: "no active subscribers" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 4. Build email and send to all subscribers
        const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
        const subject = `Your Content Digest — ${dateStr}`;

        let sent   = 0;
        let failed = 0;

        for (const sub of subscribers as Subscriber[]) {
            const html = buildDigestHtml(items, sub.name, dateStr);
            const ok   = await sendEmail(sub.email, subject, html);
            if (ok) sent++; else failed++;
        }

        console.log(`Content digest sent: ${sent} ok, ${failed} failed, ${items.length} items`);

        return new Response(
            JSON.stringify({ success: true, subscribers_sent: sent, subscribers_failed: failed, items_included: items.length }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("send-content-digest error:", message);
        return new Response(JSON.stringify({ error: message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
