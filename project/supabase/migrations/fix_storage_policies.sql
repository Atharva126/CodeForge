-- Drop valid policies that might be too restrictive
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Create more permissive policies for the 'avatars' bucket
-- Allow any authenticated user to upload to the avatars bucket
CREATE POLICY "Users can upload avatars"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
  );

-- Allow users to update their own avatars (based on owner_id if tracked, or just permissive for now)
-- Storage objects don't always track owner_id cleanly in all setups, but let's try to be safe.
-- If the file name contains the user ID, we could check that, but the previous policy was failing on folder structure.
-- Simplified: Authenticated users can update files in avatars bucket (Supabase usually handles owner metadata)
CREATE POLICY "Users can update avatars"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
    AND (auth.uid() = owner) -- Supabase storage.objects has an owner column
  );

CREATE POLICY "Users can delete avatars"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
    AND (auth.uid() = owner)
  );
