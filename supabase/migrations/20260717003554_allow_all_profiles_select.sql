/*
# Allow all authenticated users to read any profile

The club app requires members to see each other's names/phones
(matching, reservations, admin approval). The existing
select_own_profile policy restricted SELECT to a user's own row,
so admin approval could not resolve names/phones for other users.
*/

DROP POLICY IF EXISTS "select_own_profile" ON profiles;

CREATE POLICY "select_all_profiles" ON profiles FOR SELECT
  TO authenticated USING (true);
