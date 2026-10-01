/*
# Add campaign & ad tracking columns to visitor_logs

## 목적
네이버 파워링크 등 광고를 통해 유입된 방문자의 검색 키워드와 캠페인 정보를
정확하게 추적하기 위해 visitor_logs 테이블에 UTM 파라미터, 광고 플랫폼,
랜딩 URL 컬럼을 추가합니다.

## 변경 사항
1. 새 컬럼 추가 (모두 nullable — 기존 데이터에 영향 없음):
   - `utm_source` text — 유입 소스 (naver, google 등)
   - `utm_medium` text — 유입 매체 (cpc, ppc, banner 등)
   - `utm_campaign` text — 캠페인명
   - `utm_term` text — 광고 키워드 (검색어)
   - `utm_content` text — 광고 소재/배너 식별자
   - `ad_platform` text — 광고 플랫폼 (naver_powerlink, google_ads 등)
   - `landing_url` text — 방문자가 처음 도달한 전체 URL
2. 인덱스 추가:
   - `visitor_logs_created_at_idx` — 날짜 범위 조회 성능 향상
   - `visitor_logs_search_keyword_idx` — 키워드별 집계 조회 성능 향상
3. Security:
   - 기존 INSERT/SELECT/DELETE 정책 그대로 유지 (anon + authenticated)
   - 새 컬럼은 기존 정책으로 자동 커버됨 (테이블 단위 정책이므로)
## 참고
   - search_keyword는 referrer에서 추출한 자연어 검색어를 저장 (기존 유지)
   - utm_term은 광고 파라미터에서 추출한 광고 키워드를 저장
   - ad_platform은 URL 파라미터를 분석하여 자동 감지
*/

ALTER TABLE visitor_logs
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS utm_term text,
  ADD COLUMN IF NOT EXISTS utm_content text,
  ADD COLUMN IF NOT EXISTS ad_platform text,
  ADD COLUMN IF NOT EXISTS landing_url text;

CREATE INDEX IF NOT EXISTS visitor_logs_created_at_idx ON visitor_logs (created_at);
CREATE INDEX IF NOT EXISTS visitor_logs_search_keyword_idx ON visitor_logs (search_keyword);
CREATE INDEX IF NOT EXISTS visitor_logs_ad_platform_idx ON visitor_logs (ad_platform);
