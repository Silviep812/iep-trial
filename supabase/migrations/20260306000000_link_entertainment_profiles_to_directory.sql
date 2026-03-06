
-- ============================================================
-- Migration: Link public.entertainment_profiles to "Entertainment Directory"
-- 
-- Purpose:
--   The public.entertainments table (renamed entertainment_profiles in a
--   prior migration) is reformulated as a proper "Profile" table that is
--   associated with an entry in public."Entertainment Directory".
--   This adds entertainment_directory_id FK + supporting RLS / indexes.
-- ============================================================

-- Step 1: Add the foreign-key column if it doesn't already exist
ALTER TABLE public.entertainment_profiles
  ADD COLUMN IF NOT EXISTS entertainment_directory_id bigint;

-- Step 2: Add a foreign key constraint linking to "Entertainment Directory"
DO $$ BEGIN
  ALTER TABLE public.entertainment_profiles
    ADD CONSTRAINT entertainment_profiles_directory_id_fkey
    FOREIGN KEY (entertainment_directory_id)
    REFERENCES public."Entertainment Directory" (id)
    ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'Constraint entertainment_profiles_directory_id_fkey already exists, skipping.';
END $$;

-- Step 3: Create an index for the FK column for better join performance
CREATE INDEX IF NOT EXISTS idx_entertainment_profiles_directory_id
  ON public.entertainment_profiles (entertainment_directory_id);

-- Step 4: Add a comment clarifying the relationship
COMMENT ON COLUMN public.entertainment_profiles.entertainment_directory_id IS
  'Foreign key linking this profile to an entry in "Entertainment Directory". Makes entertainment_profiles a proper profile table tied to the Entertainment Directory listing.';

-- Step 5: Ensure RLS is enabled on entertainment_profiles (idempotent)
ALTER TABLE public.entertainment_profiles ENABLE ROW LEVEL SECURITY;

-- Step 6: Ensure existing view policy exists (recreate safely)
DROP POLICY IF EXISTS "Anyone can view entertainment_profiles" ON public.entertainment_profiles;
CREATE POLICY "Anyone can view entertainment_profiles"
  ON public.entertainment_profiles
  FOR SELECT
  USING (true);

-- Step 7: Add insert / update / delete policies for authenticated users (idempotent)
DROP POLICY IF EXISTS "Authenticated users can insert entertainment_profiles" ON public.entertainment_profiles;
CREATE POLICY "Authenticated users can insert entertainment_profiles"
  ON public.entertainment_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update entertainment_profiles" ON public.entertainment_profiles;
CREATE POLICY "Authenticated users can update entertainment_profiles"
  ON public.entertainment_profiles
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete entertainment_profiles" ON public.entertainment_profiles;
CREATE POLICY "Authenticated users can delete entertainment_profiles"
  ON public.entertainment_profiles
  FOR DELETE
  TO authenticated
  USING (true);
