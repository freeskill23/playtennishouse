/*
# Create profiles table for user accounts

1. New Tables
- `profiles`
  - `id` (uuid, primary key, references auth.users)
  - `email` (text, not null)
  - `name` (text, not null)
  - `phone` (text, nullable)
  - `profile_img` (text, nullable)
  - `career` (text, nullable, default '0년')
  - `ntrp` (text, nullable, default '2.0')
  - `hand` (text, nullable, default 'right')
  - `game_preference` (text, nullable, default 'any')
  - `bio` (text, nullable)
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `profiles`.
- Owner-scoped CRUD: each authenticated user can only access their own profile row.
- SELECT, INSERT, UPDATE, DELETE policies for authenticated users.

3. Important Notes
- The `id` column defaults to `auth.uid()` so new profiles are automatically
  linked to the signed-up user.
- Email confirmation is OFF — users can sign in immediately after signup.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text NOT NULL,
  phone text,
  profile_img text,
  career text DEFAULT '0년',
  ntrp text DEFAULT '2.0',
  hand text DEFAULT 'right',
  game_preference text DEFAULT 'any',
  bio text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);
