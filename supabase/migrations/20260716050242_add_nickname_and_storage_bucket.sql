/*
# Add nickname column and profile images storage bucket

1. Schema Changes
- Add `nickname` column to `profiles` table (text, nullable).
  Users can set a display nickname separate from their real name.

2. Storage
- Create `profile-images` storage bucket (public) for user profile photos.
- Add storage policy allowing authenticated users to upload/read their own
  profile image at path `{user_id}/...`.

3. Security
- The existing RLS policies on `profiles` remain unchanged (owner-scoped CRUD).
- Storage policies: authenticated users can upload to their own folder and
  anyone can read (public bucket).
*/

-- Add nickname column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nickname text;

-- Create profile-images storage bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: authenticated users can upload to their own folder
DROP POLICY IF EXISTS "users_upload_own_profile_image" ON storage.objects;
CREATE POLICY "users_upload_own_profile_image"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Anyone can read profile images (public bucket)
DROP POLICY IF EXISTS "anyone_read_profile_images" ON storage.objects;
CREATE POLICY "anyone_read_profile_images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'profile-images');

-- Users can update/delete their own profile image
DROP POLICY IF EXISTS "users_update_own_profile_image" ON storage.objects;
CREATE POLICY "users_update_own_profile_image"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-images' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'profile-images' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "users_delete_own_profile_image" ON storage.objects;
CREATE POLICY "users_delete_own_profile_image"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profile-images' AND (storage.foldername(name))[1] = auth.uid()::text);
