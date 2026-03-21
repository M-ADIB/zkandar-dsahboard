-- Rename columns to match TypeScript types expected by frontend
ALTER TABLE leads RENAME COLUMN payment TO payment_amount;
ALTER TABLE leads RENAME COLUMN dop TO date_of_payment;
ALTER TABLE leads RENAME COLUMN dop_2 TO date_of_payment_2;

-- Convert string boolean columns to actual BOOLEAN type
ALTER TABLE leads ALTER COLUMN paid_deposit TYPE boolean USING (
    CASE 
        WHEN lower(paid_deposit::text) IN ('true', 'yes', '1', 'y') THEN true 
        WHEN lower(paid_deposit::text) IN ('false', 'no', '0', 'n') THEN false 
        ELSE false 
    END
);

ALTER TABLE leads ALTER COLUMN paid_full TYPE boolean USING (
    CASE 
        WHEN lower(paid_full::text) IN ('true', 'yes', '1', 'y') THEN true 
        WHEN lower(paid_full::text) IN ('false', 'no', '0', 'n') THEN false 
        ELSE false 
    END
);

ALTER TABLE leads ALTER COLUMN booked_support TYPE boolean USING (
    CASE 
        WHEN lower(booked_support::text) IN ('true', 'yes', '1', 'y') THEN true 
        WHEN lower(booked_support::text) IN ('false', 'no', '0', 'n') THEN false 
        ELSE false 
    END
);

-- Convert string numeric columns to actual NUMERIC type
ALTER TABLE leads ALTER COLUMN coupon_percent TYPE numeric USING (
    NULLIF(regexp_replace(coupon_percent::text, '[^0-9.]', '', 'g'), '')::numeric
);
