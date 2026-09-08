import { supabase, supabaseConfigured } from './supabase';

const SESSION_KEY = 'pth_session_id';
const PAGE_VISIT_KEY = 'pth_last_visit';
const VISIT_COOLDOWN_MS = 30 * 60 * 1000; // 30 min — don't re-log same page within this window

function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function shouldLogPage(page: string): boolean {
  const now = Date.now();
  try {
    const raw = localStorage.getItem(PAGE_VISIT_KEY);
    if (raw) {
      const map = JSON.parse(raw) as Record<string, number>;
      const last = map[page] || 0;
      if (now - last < VISIT_COOLDOWN_MS) return false;
      map[page] = now;
      localStorage.setItem(PAGE_VISIT_KEY, JSON.stringify(map));
    } else {
      localStorage.setItem(PAGE_VISIT_KEY, JSON.stringify({ [page]: now }));
    }
  } catch {
    // localStorage full or corrupted — allow logging
  }
  return true;
}

function extractSearchKeyword(referrer: string): string | null {
  if (!referrer) return null;
  try {
    const url = new URL(referrer);
    const host = url.hostname;
    const params = url.searchParams;

    if (host.includes('google')) return params.get('q');
    if (host.includes('naver')) return params.get('query') || params.get('q');
    if (host.includes('daum')) return params.get('q');
    if (host.includes('bing')) return params.get('q');
    if (host.includes('yahoo')) return params.get('p') || params.get('q');
    return params.get('q') || params.get('query') || params.get('search') || null;
  } catch {
    return null;
  }
}

export function logVisit(page: string, isMember: boolean, userName?: string): void {
  if (!supabaseConfigured) return;
  if (!shouldLogPage(page)) return;

  const referrer = document.referrer || '';
  const searchKeyword = extractSearchKeyword(referrer);
  const path = window.location.pathname + window.location.hash;
  const userAgent = navigator.userAgent.slice(0, 200);

  supabase
    .from('visitor_logs')
    .insert({
      session_id: getSessionId(),
      page,
      path,
      referrer: referrer || null,
      search_keyword: searchKeyword,
      user_agent: userAgent,
      is_member: isMember,
      user_name: isMember ? userName || null : null,
    })
    .then(({ error }) => {
      if (error) console.error('[logVisit]', error.message);
    });
}
