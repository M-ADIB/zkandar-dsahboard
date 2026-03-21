-- Every table with a company_id FK to companies.id was created without ON DELETE,
-- which defaults to RESTRICT and blocks company deletion whenever related rows exist.
-- This migration fixes all of them to ON DELETE SET NULL so companies can be deleted
-- while preserving the related records (they just lose their company link).

-- team_submissions (FK added by remote migrations, not in local files)
ALTER TABLE public.team_submissions
    DROP CONSTRAINT IF EXISTS team_submissions_company_id_fkey;
ALTER TABLE public.team_submissions
    ADD CONSTRAINT team_submissions_company_id_fkey
    FOREIGN KEY (company_id) REFERENCES public.companies(id)
    ON DELETE SET NULL;

-- users (from migration 001 — no ON DELETE)
ALTER TABLE public.users
    DROP CONSTRAINT IF EXISTS users_company_id_fkey;
ALTER TABLE public.users
    ADD CONSTRAINT users_company_id_fkey
    FOREIGN KEY (company_id) REFERENCES public.companies(id)
    ON DELETE SET NULL;

-- chat_messages (from migration 001 — no ON DELETE)
ALTER TABLE public.chat_messages
    DROP CONSTRAINT IF EXISTS chat_messages_company_id_fkey;
ALTER TABLE public.chat_messages
    ADD CONSTRAINT chat_messages_company_id_fkey
    FOREIGN KEY (company_id) REFERENCES public.companies(id)
    ON DELETE SET NULL;

-- invitations (from migration 001 — no ON DELETE)
ALTER TABLE public.invitations
    DROP CONSTRAINT IF EXISTS invitations_company_id_fkey;
ALTER TABLE public.invitations
    ADD CONSTRAINT invitations_company_id_fkey
    FOREIGN KEY (company_id) REFERENCES public.companies(id)
    ON DELETE SET NULL;
