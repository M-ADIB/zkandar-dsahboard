-- ─────────────────────────────────────────────────────────────────────────────
-- 059_content_aggregator.sql
-- Tables: content_sources, content_items, content_subscribers
-- Platform settings keys for digest schedule/preferences
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Content Sources ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_sources (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT        NOT NULL,
    type            TEXT        NOT NULL,
    url             TEXT,
    query           TEXT,
    max_results     INTEGER     NOT NULL DEFAULT 10,
    last_checked_at TIMESTAMPTZ,
    status          TEXT        NOT NULL DEFAULT 'pending',
    error_log       TEXT,
    active          BOOLEAN     NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT content_sources_type_check
        CHECK (type IN ('video_channel', 'blog', 'search_query')),
    CONSTRAINT content_sources_status_check
        CHECK (status IN ('pending', 'success', 'failing'))
);

-- ── Content Items ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_items (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id       UUID        REFERENCES content_sources(id) ON DELETE SET NULL,
    title           TEXT        NOT NULL,
    original_url    TEXT        NOT NULL,
    published_at    TIMESTAMPTZ,
    summary         TEXT,
    relevance_score INTEGER,
    deep_dive       TEXT,
    action_items    JSONB       NOT NULL DEFAULT '[]',
    is_read         BOOLEAN     NOT NULL DEFAULT false,
    is_pinned       BOOLEAN     NOT NULL DEFAULT false,
    is_archived     BOOLEAN     NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT content_items_relevance_check
        CHECK (relevance_score IS NULL OR (relevance_score >= 1 AND relevance_score <= 100))
);

-- Prevent duplicate URLs within 7-day deduplication window via partial unique index
CREATE UNIQUE INDEX IF NOT EXISTS content_items_url_unique
    ON content_items (original_url);

-- ── Content Subscribers ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_subscribers (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    email           TEXT        NOT NULL,
    name            TEXT,
    origin_source   TEXT,
    active          BOOLEAN     NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT content_subscribers_email_unique UNIQUE (email)
);

-- ── Row-Level Security ────────────────────────────────────────────────────────
ALTER TABLE content_sources     ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_subscribers ENABLE ROW LEVEL SECURITY;

-- Admin-only access for all three tables
CREATE POLICY admin_manage_content_sources ON content_sources
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
              AND users.role IN ('owner', 'admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
              AND users.role IN ('owner', 'admin')
        )
    );

CREATE POLICY admin_manage_content_items ON content_items
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
              AND users.role IN ('owner', 'admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
              AND users.role IN ('owner', 'admin')
        )
    );

CREATE POLICY admin_manage_content_subscribers ON content_subscribers
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
              AND users.role IN ('owner', 'admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
              AND users.role IN ('owner', 'admin')
        )
    );

-- Service role bypass (needed by edge functions)
CREATE POLICY service_role_content_sources ON content_sources
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_content_items ON content_items
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_content_subscribers ON content_subscribers
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── Platform Settings — Content Keys ─────────────────────────────────────────
INSERT INTO platform_settings (key, value, category) VALUES
    ('content_digest_enabled',  'false',  'content'),
    ('content_digest_time',     '08:00',  'content'),
    ('content_digest_timezone', 'UTC',    'content'),
    ('content_archive_days',    '7',      'content')
ON CONFLICT (key) DO NOTHING;

-- ── Auto-archive helper function ──────────────────────────────────────────────
-- Called by the aggregate-content edge function after each sync run.
CREATE OR REPLACE FUNCTION auto_archive_old_content()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_days   INTEGER;
    v_count  INTEGER;
BEGIN
    SELECT COALESCE(value::INTEGER, 7)
    INTO   v_days
    FROM   platform_settings
    WHERE  key = 'content_archive_days';

    UPDATE content_items
    SET    is_archived = true,
           updated_at  = NOW()
    WHERE  is_archived = false
      AND  is_pinned   = false
      AND  created_at  < NOW() - (v_days || ' days')::INTERVAL;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;
