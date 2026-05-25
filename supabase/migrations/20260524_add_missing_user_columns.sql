-- Migration to add missing user columns and fix triggers

-- 1. Add missing columns to public.users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS nationality TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS position TEXT;

-- 2. Re-create and refresh the sync trigger functions to compile against the updated table schema
CREATE OR REPLACE FUNCTION public.sync_lead_to_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent infinite trigger recursion loops
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  -- Only sync if fields actually changed and a matching user exists
  IF (TG_OP = 'UPDATE') THEN
    IF (NEW.full_name IS DISTINCT FROM OLD.full_name OR
        NEW.job_title IS DISTINCT FROM OLD.job_title OR
        NEW.country IS DISTINCT FROM OLD.country OR
        NEW.email IS DISTINCT FROM OLD.email) THEN
        
      UPDATE public.users
      SET 
        full_name = COALESCE(NEW.full_name, users.full_name),
        position = COALESCE(NEW.job_title, users.position),
        nationality = COALESCE(NEW.country, users.nationality),
        email = COALESCE(NEW.email, users.email)
      WHERE email = OLD.email;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.sync_user_to_lead()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent infinite trigger recursion loops
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  IF (TG_OP = 'UPDATE' OR TG_OP = 'INSERT') THEN
    -- Check if a lead already exists with this email
    IF EXISTS (SELECT 1 FROM public.leads WHERE email = NEW.email) THEN
      UPDATE public.leads
      SET
        full_name = COALESCE(NEW.full_name, leads.full_name),
        job_title = COALESCE(NEW.position, leads.job_title),
        country = COALESCE(NEW.nationality, leads.country)
      WHERE email = NEW.email;
    ELSE
      -- If inserting a user and no lead exists, create a lead with COMPLETED priority
      INSERT INTO public.leads (
        full_name,
        email,
        job_title,
        country,
        priority,
        notes
      ) VALUES (
        NEW.full_name,
        NEW.email,
        NEW.position,
        NEW.nationality,
        'COMPLETED',
        'Created automatically from system member account.'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
