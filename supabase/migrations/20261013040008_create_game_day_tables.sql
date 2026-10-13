/*
# Create Game Day (게임데이) tables

1. New Tables
- `game_day_events` — 관리자가 생성하는 게임데이 이벤트 (남자복식데이, 여자단식데이 등)
  - id: text PK (client-generated)
  - title: 이벤트 타이틀 (자유 지정)
  - game_type: 'singles' | 'doubles'
  - date: 진행 날짜 (YYYY-MM-DD)
  - start_time / end_time: 진행 시간 (HH:MM)
  - court: 'A코트' | 'B코트'
  - max_teams: 최대 모집 팀 수
  - min_teams: 최소 모집 팀 수 (미달 시 자동 취소/환불)
  - fee: 참가비
  - description: 설명
  - status: '모집중' | '대기모집' | '대진완료' | '진행중' | '종료' | '취소'
  - bracket_generated_at: 대진표 생성 시각
  - created_at: bigint epoch ms
- `game_day_participants` — 참가 신청 (정원 초과시 대기)
  - id: text PK
  - event_id: FK → game_day_events.id
  - user_id: 신청자 user ID
  - player_name: 참가자 1명 (단식) 또는 팀 대표 (복식)
  - player_name2: 복식 파트너 (단식은 null)
  - depositor_name: 입금자명
  - depositor_phone: 연락처
  - status: '참가' | '대기' | '취소'
  - created_at: bigint epoch ms
- `game_day_matches` — 대진표의 개별 경기
  - id: text PK
  - event_id: FK → game_day_events.id
  - round: 1~4 (4게임 보장)
  - team_a: participant ID 배열 (단식 1명, 복식 2명)
  - team_b: participant ID 배열
  - score_a / score_b: 점수 (null = 미입력)
  - winner: 'A' | 'B' | 'draw' | null

2. Security
- RLS enabled on all three tables.
- TO anon, authenticated CRUD (shared booking board model, same as reservations).
- USING (true) is acceptable because the data is intentionally public/shared.

3. Indexes
- game_day_participants: event_id, (event_id, status)
- game_day_matches: event_id

4. Realtime
- All three tables added to supabase_realtime publication.
*/

CREATE TABLE IF NOT EXISTS game_day_events (
  id text PRIMARY KEY,
  title text NOT NULL,
  game_type text NOT NULL DEFAULT 'doubles',
  date date NOT NULL,
  start_time text NOT NULL DEFAULT '09:00',
  end_time text NOT NULL DEFAULT '18:00',
  court text NOT NULL DEFAULT 'A코트',
  max_teams integer NOT NULL DEFAULT 8,
  min_teams integer NOT NULL DEFAULT 4,
  fee integer NOT NULL DEFAULT 0,
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT '모집중',
  bracket_generated_at bigint,
  created_at bigint NOT NULL DEFAULT (extract(epoch from now())*1000)::bigint
);

ALTER TABLE game_day_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_game_day_events" ON game_day_events;
CREATE POLICY "anon_select_game_day_events" ON game_day_events FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_game_day_events" ON game_day_events;
CREATE POLICY "anon_insert_game_day_events" ON game_day_events FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_game_day_events" ON game_day_events;
CREATE POLICY "anon_update_game_day_events" ON game_day_events FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_game_day_events" ON game_day_events;
CREATE POLICY "anon_delete_game_day_events" ON game_day_events FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS game_day_participants (
  id text PRIMARY KEY,
  event_id text NOT NULL REFERENCES game_day_events(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  player_name text NOT NULL,
  player_name2 text,
  depositor_name text NOT NULL DEFAULT '',
  depositor_phone text,
  status text NOT NULL DEFAULT '참가',
  created_at bigint NOT NULL DEFAULT (extract(epoch from now())*1000)::bigint
);

ALTER TABLE game_day_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_game_day_participants" ON game_day_participants;
CREATE POLICY "anon_select_game_day_participants" ON game_day_participants FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_game_day_participants" ON game_day_participants;
CREATE POLICY "anon_insert_game_day_participants" ON game_day_participants FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_game_day_participants" ON game_day_participants;
CREATE POLICY "anon_update_game_day_participants" ON game_day_participants FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_game_day_participants" ON game_day_participants;
CREATE POLICY "anon_delete_game_day_participants" ON game_day_participants FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS game_day_matches (
  id text PRIMARY KEY,
  event_id text NOT NULL REFERENCES game_day_events(id) ON DELETE CASCADE,
  round integer NOT NULL DEFAULT 1,
  team_a text[] NOT NULL DEFAULT '{}',
  team_b text[] NOT NULL DEFAULT '{}',
  score_a integer,
  score_b integer,
  winner text,
  created_at bigint NOT NULL DEFAULT (extract(epoch from now())*1000)::bigint
);

ALTER TABLE game_day_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_game_day_matches" ON game_day_matches;
CREATE POLICY "anon_select_game_day_matches" ON game_day_matches FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_game_day_matches" ON game_day_matches;
CREATE POLICY "anon_insert_game_day_matches" ON game_day_matches FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_game_day_matches" ON game_day_matches;
CREATE POLICY "anon_update_game_day_matches" ON game_day_matches FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_game_day_matches" ON game_day_matches;
CREATE POLICY "anon_delete_game_day_matches" ON game_day_matches FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_game_day_participants_event_id ON game_day_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_game_day_participants_event_status ON game_day_participants(event_id, status);
CREATE INDEX IF NOT EXISTS idx_game_day_matches_event_id ON game_day_matches(event_id);

ALTER PUBLICATION supabase_realtime ADD TABLE game_day_events;
ALTER PUBLICATION supabase_realtime ADD TABLE game_day_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE game_day_matches;
