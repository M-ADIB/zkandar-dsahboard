-- The management_submissions.company_id FK was created without ON DELETE behaviour
-- (defaults to RESTRICT), so deleting a company with linked submissions fails.
-- Change to ON DELETE SET NULL to preserve survey history while allowing company deletion.

ALTER TABLE public.management_submissions
    DROP CONSTRAINT IF EXISTS management_submissions_company_id_fkey;

ALTER TABLE public.management_submissions
    ADD CONSTRAINT management_submissions_company_id_fkey
    FOREIGN KEY (company_id) REFERENCES public.companies(id)
    ON DELETE SET NULL;
