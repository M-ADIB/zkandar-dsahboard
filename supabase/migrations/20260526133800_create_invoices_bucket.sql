-- Create invoices bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for storage bucket 'invoices'
DO $$ BEGIN
    CREATE POLICY "Anyone can read invoices"
        ON storage.objects FOR SELECT
        TO public
        USING (bucket_id = 'invoices');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Admins and Owners can insert invoices"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (
            bucket_id = 'invoices' AND
            EXISTS (
                SELECT 1 FROM public.users
                WHERE users.id = auth.uid()
                AND users.role IN ('admin', 'owner')
            )
        );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Admins and Owners can update invoices"
        ON storage.objects FOR UPDATE
        TO authenticated
        USING (
            bucket_id = 'invoices' AND
            EXISTS (
                SELECT 1 FROM public.users
                WHERE users.id = auth.uid()
                AND users.role IN ('admin', 'owner')
            )
        );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Admins and Owners can delete invoices"
        ON storage.objects FOR DELETE
        TO authenticated
        USING (
            bucket_id = 'invoices' AND
            EXISTS (
                SELECT 1 FROM public.users
                WHERE users.id = auth.uid()
                AND users.role IN ('admin', 'owner')
            )
        );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
