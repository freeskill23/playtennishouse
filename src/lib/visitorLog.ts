import { supabase, supabaseConfigured } from './supabase';

const SESSION_KEY = 'pth_session_id';
const LOG_DEBOUNCE_MS = 5000; // avoid duplicate logs within 5s

let lastLogTime = 0;

function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function extractSearchKeyword(referrer: string): string | null {
  if (!referrer) return null;
  try {
    const url = new URL(referrer);
    const host = url.hostname;
    const params = url.searchParams;

    // Google, Naver, Daum, Bing, Yahoo
    if (host.includes('google')) {
      return params.get('q');
    }
    if (host.includes('naver')) {
      return params.get('query') || params.get('q');
    }
    if (host.includes('daum')) {
      return params.get('q');
    }
    if (host.includes('bing')) {
      return params.get('q');
    }
    if (host.includes('yahoo')) {
      return params.get('p') || params.get('q');
    }
    // Generic: try common query params
    return params.get('q') || params.get('query') || params.get('search') || null;
  } catch {
    return null;
  }
}

export function logVisit(page: string, isMember: boolean): void {
  if (!supabaseConfigured) return;

  const now = Date.now();
  if (now - lastLogTime < LOG_DEBOUNCE_MS) return;
  lastLogTime = now;

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
    })
    .then(({ error }) => {
      if (error) console.error('[logVisit]', error.message);
    });
}
