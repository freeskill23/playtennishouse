/*
# Create reviews table for 이용후기

1. New Table
- `reviews`
  - `id` text PRIMARY KEY — client-generated id
  - `author_name` text NOT NULL — 작성자 이름 (회원 or 비회원)
  - `author_id` text — Supabase auth user id (null for guest)
  - `content` text NOT NULL — 후기 내용
  - `rating` int NOT NULL — 별점 1~5
  - `image_urls` jsonb NOT NULL DEFAULT '[]' — 이미지 URL 배열 (최대 5장)
  - `admin_reply` text — 관리자 답변 (null if none)
  - `admin_reply_at` bigint — 관리자 답변 작성 시각
  - `is_deleted` boolean NOT NULL DEFAULT false — 관리자 삭제 여부
  - `created_at` bigint NOT NULL — epoch millis
2. Security
- Enable RLS on `reviews`.
- anon + authenticated can SELECT (비회원도 작성/조회 가능)
- anon + authenticated can INSERT (비회원도 후기 작성 가능)
- anon + authenticated can UPDATE (관리자 답변용, 프론트에서 관리자 권한 체크)
- anon + authenticated can DELETE (관리자 삭제용, 프론트에서 관리자 권한 체크)
3. Notes
- Frontend enforces admin gating (same pattern as notices/gallery).
- Soft-delete via is_deleted flag; deleted reviews hidden from public view.
*/

CREATE TABLE IF NOT EXISTS reviews (
  id text PRIMARY KEY,
  author_name text NOT NULL,
  author_id text,
  content text NOT NULL,
  rating int NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  image_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  admin_reply text,
  admin_reply_at bigint,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at bigint NOT NULL DEFAULT (EXTRACT(epoch FROM now()) * 1000)::bigint
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_reviews" ON reviews;
CREATE POLICY "select_reviews" ON reviews FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_reviews" ON reviews;
CREATE POLICY "insert_reviews" ON reviews FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_reviews" ON reviews;
CREATE POLICY "update_reviews" ON reviews FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_reviews" ON reviews;
CREATE POLICY "delete_reviews" ON reviews FOR DELETE
  TO anon, authenticated USING (true);
