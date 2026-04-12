import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

/**
 * aggregate-content — Content Aggregation Engine
 *
 * Scraping:        Apify (apify.com) — actors handle blogs, YouTube, and search
 * Summarisation:   OpenRouter API (OpenAI-compatible, any cheap model)
 * Dedup:           URL uniqueness index, 7-day rolling window
 *
 * Payload:
 *   { source_ids?: string[] }   — sync specific sources (omit for all active)
 *   { flush_archive?: true }    — also run auto_archive_old_content() after sync
 *
 * Required Supabase secrets:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   APIFY_API_TOKEN             — from apify.com → Settings → API & Integrations
 *   OPENROUTER_API_KEY          — from openrouter.ai → Keys
 *
 * Apify Actors used (all free-tier friendly):
 *   blog / generic URL  → apify/website-content-crawler  (run with maxCrawlDepth=0, maxCrawlPages=N)
 *   video_channel       → streamers/youtube-channel-video-scraper
 *   search_query        → apify/google-search-scraper
 */

const SUPABASE_URL  = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APIFY_TOKEN      = Deno.env.get("APIFY_API_TOKEN") ?? "";
const OPENROUTER_KEY   = Deno.env.get("OPENROUTER_API_KEY") ?? "";

// Any model available on openrouter.ai works. Default: gemini-2.0-flash (cheap + fast).
// Override by setting the OPENROUTER_MODEL secret.
const OPENROUTER_MODEL = Deno.env.get("OPENROUTER_MODEL") ?? "google/gemini-2.0-flash-001";

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

interface ContentSource {
    id: string;
    name: string;
    type: "video_channel" | "blog" | "search_query";
    url: string | null;
    query: string | null;
    max_results: number;
}

interface RawContentPiece {
    title: string;
    url: string;
    published_at: string | null;
    raw_text: string;
}

interface AiItem {
    title: string;
    url: string;
    published_at: string | null;
    summary: string;
    relevance_score: number;
    deep_dive: string;
    action_items: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Apify helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Run an Apify actor synchronously and return the dataset items.
 * Uses the /run-sync-get-dataset-items endpoint (max 5-minute timeout).
 */
async function runApifyActor(actorId: string, input: Record<string, unknown>): Promise<unknown[]> {
    if (!APIFY_TOKEN) {
        console.warn("APIFY_API_TOKEN not set — skipping Apify actor run");
        return [];
    }

    const url = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${APIFY_TOKEN}&timeout=120&memory=256`;

    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(130_000), // slightly above actor timeout
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Apify actor ${actorId} failed: ${res.status} ${errText.slice(0, 200)}`);
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
}

// ── Blog / generic URL scraping ───────────────────────────────────────────────
async function fetchBlogContent(source: ContentSource): Promise<RawContentPiece[]> {
    if (!source.url) return [];

    // apify/website-content-crawler: crawls starting URLs, returns page text
    const items = await runApifyActor("apify/website-content-crawler", {
        startUrls: [{ url: source.url }],
        maxCrawlDepth: 1,
        maxCrawlPages: source.max_results,
        crawlerType: "cheerio",      // fast lightweight scraper
    }) as {
        url?: string;
        title?: string;
        text?: string;
        markdown?: string;
        metadata?: { datePublished?: string };
    }[];

    return items
        .filter((it) => it.url && it.title)
        .slice(0, source.max_results)
        .map((it) => ({
            title:        it.title ?? "Untitled",
            url:          it.url!,
            published_at: it.metadata?.datePublished
                ? (() => { try { return new Date(it.metadata!.datePublished!).toISOString(); } catch { return null; } })()
                : null,
            raw_text:     `${it.title}\n\n${(it.markdown ?? it.text ?? "").slice(0, 800)}`,
        }));
}

// ── YouTube Channel ───────────────────────────────────────────────────────────
async function fetchVideoChannel(source: ContentSource): Promise<RawContentPiece[]> {
    if (!source.url) return [];

    // streamers/youtube-channel-video-scraper
    const items = await runApifyActor("streamers/youtube-channel-video-scraper", {
        startUrl: source.url,
        maxVideos: source.max_results,
        sortVideosBy: "newest",
    }) as {
        url?: string;
        title?: string;
        description?: string;
        date?: string;
    }[];

    return items
        .filter((it) => it.url && it.title)
        .slice(0, source.max_results)
        .map((it) => ({
            title:        it.title ?? "Untitled",
            url:          it.url!,
            published_at: it.date
                ? (() => { try { return new Date(it.date!).toISOString(); } catch { return null; } })()
                : null,
            raw_text:     `${it.title}\n\n${(it.description ?? "").slice(0, 600)}`,
        }));
}

// ── Search Query ──────────────────────────────────────────────────────────────
async function fetchSearchQuery(source: ContentSource): Promise<RawContentPiece[]> {
    if (!source.query) return [];

    // apify/google-search-scraper
    const items = await runApifyActor("apify/google-search-scraper", {
        queries: source.query,
        maxPagesPerQuery: 1,
        resultsPerPage: source.max_results,
    }) as {
        organicResults?: {
            title?: string;
            url?: string;
            description?: string;
            date?: string;
        }[];
    }[];

    const results = items.flatMap((page) => page.organicResults ?? []);

    return results
        .filter((r) => r.url && r.title)
        .slice(0, source.max_results)
        .map((r) => ({
            title:        r.title ?? "Untitled",
            url:          r.url!,
            published_at: r.date
                ? (() => { try { return new Date(r.date!).toISOString(); } catch { return null; } })()
                : null,
            raw_text:     `${r.title}\n\n${(r.description ?? "").slice(0, 600)}`,
        }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Gemini summarisation
// ─────────────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a content analyst for a business intelligence platform.
For each news item provided, output a JSON array where each element has:
- "title": the article title (string)
- "url": the article URL unchanged (string)
- "published_at": the published date unchanged or null
- "summary": concise 2–3 sentence summary (string)
- "relevance_score": integer 1–100 scoring business / AI relevance
- "deep_dive": 3–5 sentences on why this matters, context, and implications (string)
- "action_items": array of 2–4 short actionable bullet strings (string[])

Return ONLY the JSON array. No markdown fences, no commentary, no extra text.`;

async function summariseWithOpenRouter(pieces: RawContentPiece[]): Promise<AiItem[]> {
    if (!OPENROUTER_KEY || pieces.length === 0) return [];

    const userContent = pieces
        .map((p, i) =>
            `Item ${i + 1}:\nTitle: ${p.title}\nURL: ${p.url}\nPublished: ${p.published_at ?? "unknown"}\nText: ${p.raw_text}`
        )
        .join("\n\n---\n\n");

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OPENROUTER_KEY}`,
            "HTTP-Referer": "https://app.zkandar.com",
            "X-Title": "Zkandar Content Aggregator",
        },
        body: JSON.stringify({
            model: OPENROUTER_MODEL,
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user",   content: userContent },
            ],
            response_format: { type: "json_object" },
        }),
        signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
        const errText = await res.text();
        console.error("OpenRouter API error:", res.status, errText.slice(0, 300));
        return [];
    }

    const data = await res.json();
    const rawText: string = data?.choices?.[0]?.message?.content ?? "[]";

    // Strip any accidental markdown fences
    const cleaned = rawText
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "")
        .trim();

    // response_format:json_object wraps arrays in an object — unwrap if needed
    let parsed: unknown;
    try {
        parsed = JSON.parse(cleaned);
    } catch (e) {
        console.error("Failed to parse OpenRouter response as JSON:", e, cleaned.slice(0, 200));
        return [];
    }

    if (Array.isArray(parsed)) return parsed as AiItem[];
    // Some models wrap in { items: [...] } or similar
    if (parsed && typeof parsed === "object") {
        const vals = Object.values(parsed as Record<string, unknown>);
        for (const v of vals) {
            if (Array.isArray(v)) return v as AiItem[];
        }
    }
    return [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Dedup helper
// ─────────────────────────────────────────────────────────────────────────────

async function fetchExistingUrls(supabase: ReturnType<typeof createClient>): Promise<Set<string>> {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
        .from("content_items")
        .select("original_url")
        .gte("created_at", since);
    return new Set((data ?? []).map((r: { original_url: string }) => r.original_url));
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
        const body        = await req.json().catch(() => ({}));
        const sourceIds   = body.source_ids as string[] | undefined;
        const flushArchive: boolean = body.flush_archive === true;

        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const db = supabase as any;

        // Fetch sources
        let sourcesQuery = db
            .from("content_sources")
            .select("id, name, type, url, query, max_results")
            .eq("active", true);

        if (sourceIds && sourceIds.length > 0) {
            sourcesQuery = sourcesQuery.in("id", sourceIds);
        }

        const { data: sources, error: sourcesErr } = await sourcesQuery;
        if (sourcesErr) throw new Error(`Failed to fetch sources: ${sourcesErr.message}`);
        if (!sources || sources.length === 0) {
            return new Response(
                JSON.stringify({ success: true, message: "No active sources", processed: 0 }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const existingUrls = await fetchExistingUrls(supabase);

        let totalNew    = 0;
        let totalErrors = 0;
        const results: { source: string; new_items: number; status: string; error?: string }[] = [];

        for (const source of sources as ContentSource[]) {
            let pieces: RawContentPiece[] = [];
            let fetchError: string | null = null;

            try {
                if (source.type === "blog") {
                    pieces = await fetchBlogContent(source);
                } else if (source.type === "video_channel") {
                    pieces = await fetchVideoChannel(source);
                } else if (source.type === "search_query") {
                    pieces = await fetchSearchQuery(source);
                }
            } catch (err) {
                fetchError = err instanceof Error ? err.message : String(err);
                console.error(`Fetch error for source "${source.name}":`, fetchError);
                totalErrors++;
            }

            const newPieces = pieces.filter((p) => !existingUrls.has(p.url));
            let newItemCount = 0;

            if (newPieces.length > 0 && !fetchError) {
                const BATCH = 10;
                for (let i = 0; i < newPieces.length; i += BATCH) {
                    const batch   = newPieces.slice(i, i + BATCH);
                    const aiItems = await summariseWithOpenRouter(batch);

                    const rowsToInsert = (aiItems.length > 0 ? aiItems : batch).map((item) => ({
                        source_id:       source.id,
                        title:           item.title,
                        original_url:    (item as AiItem).url ?? (item as RawContentPiece).url,
                        published_at:    item.published_at ?? null,
                        summary:         (item as AiItem).summary   ?? null,
                        relevance_score: (item as AiItem).relevance_score ?? null,
                        deep_dive:       (item as AiItem).deep_dive  ?? null,
                        action_items:    (item as AiItem).action_items ?? [],
                    }));

                    const { error: insertErr } = await db
                        .from("content_items")
                        .upsert(rowsToInsert, { onConflict: "original_url", ignoreDuplicates: true });

                    if (insertErr) {
                        console.error(`Insert error for source "${source.name}":`, insertErr.message);
                    } else {
                        newItemCount += rowsToInsert.length;
                        rowsToInsert.forEach((r) => existingUrls.add(r.original_url));
                    }
                }
            }

            await db
                .from("content_sources")
                .update({
                    last_checked_at: new Date().toISOString(),
                    status:          fetchError ? "failing" : "success",
                    error_log:       fetchError ?? null,
                    updated_at:      new Date().toISOString(),
                })
                .eq("id", source.id);

            totalNew += newItemCount;
            results.push({
                source:    source.name,
                new_items: newItemCount,
                status:    fetchError ? "failing" : "success",
                ...(fetchError ? { error: fetchError } : {}),
            });
        }

        if (flushArchive) {
            await supabase.rpc("auto_archive_old_content");
        }

        return new Response(
            JSON.stringify({ success: true, new_items: totalNew, errors: totalErrors, sources: results }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("aggregate-content error:", message);
        return new Response(JSON.stringify({ error: message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
