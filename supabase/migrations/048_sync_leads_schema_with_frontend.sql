-- Rename columns to match TypeScript types expected by frontend
-- Wrapped in DO blocks to be idempotent (remote migrations may have already applied these)
DO $$ BEGIN
    ALTER TABLE leads RENAME COLUMN payment TO payment_amount;
EXCEPTION WHEN undefined_column THEN
    -- column already renamed or doesn't exist with old name
    NULL;
WHEN duplicate_column THEN
    NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE leads RENAME COLUMN dop TO date_of_payment;
EXCEPTION WHEN undefined_column THEN NULL;
WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE leads RENAME COLUMN dop_2 TO date_of_payment_2;
EXCEPTION WHEN undefined_column THEN NULL;
WHEN duplicate_column THEN NULL;
END $$;

-- Convert string boolean columns to actual BOOLEAN type (skip if already boolean)
DO $$ BEGIN
    ALTER TABLE leads ALTER COLUMN paid_deposit TYPE boolean USING (
        CASE
            WHEN lower(paid_deposit::text) IN ('true', 'yes', '1', 'y') THEN true
            WHEN lower(paid_deposit::text) IN ('false', 'no', '0', 'n') THEN false
            ELSE false
        END
    );
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE leads ALTER COLUMN paid_full TYPE boolean USING (
        CASE
            WHEN lower(paid_full::text) IN ('true', 'yes', '1', 'y') THEN true
            WHEN lower(paid_full::text) IN ('false', 'no', '0', 'n') THEN false
            ELSE false
        END
    );
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE leads ALTER COLUMN booked_support TYPE boolean USING (
        CASE
            WHEN lower(booked_support::text) IN ('true', 'yes', '1', 'y') THEN true
            WHEN lower(booked_support::text) IN ('false', 'no', '0', 'n') THEN false
            ELSE false
        END
    );
EXCEPTION WHEN others THEN NULL;
END $$;

-- Convert string numeric columns to actual NUMERIC type (skip if already numeric)
DO $$ BEGIN
    ALTER TABLE leads ALTER COLUMN coupon_percent TYPE numeric USING (
        NULLIF(regexp_replace(coupon_percent::text, '[^0-9.]', '', 'g'), '')::numeric
    );
EXCEPTION WHEN others THEN NULL;
END $$;
