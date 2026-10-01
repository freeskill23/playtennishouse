import { supabase, supabaseConfigured } from './supabase';

const SESSION_KEY = 'pth_session_id';
const PAGE_VISIT_KEY = 'pth_last_visit';
const CAMPAIGN_KEY = 'pth_campaign';
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

interface CampaignData {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;
  adPlatform: string | null;
  landingUrl: string | null;
}

function detectAdPlatform(
  params: URLSearchParams,
  utmSource: string | null,
  referrer: string,
): string | null {
  // Naver Power Link: n_ad, mk, n_query, nrt params or utm_source=naver
  if (params.has('n_ad') || params.has('mk') || params.has('nrt') || params.has('n_query')) {
    return 'naver_powerlink';
  }
  if (utmSource === 'naver' || utmSource === 'naverblog') return 'naver';
  if (utmSource === 'google') return 'google_ads';
  if (utmSource === 'kakao') return 'kakao';
  if (utmSource === 'meta' || utmSource === 'facebook' || utmSource === 'instagram') return 'meta_ads';
  // Check referrer for known ad platforms
  if (referrer) {
    try {
      const host = new URL(referrer).hostname;
      if (host.includes('naver')) return 'naver';
      if (host.includes('google')) return 'google';
    } catch { /* ignore */ }
  }
  return null;
}

function extractCampaignFromUrl(): CampaignData | null {
  try {
    const url = new URL(window.location.href);
    const params = url.searchParams;
    const referrer = document.referrer || '';

    const utmSource = params.get('utm_source');
    const utmMedium = params.get('utm_medium');
    const utmCampaign = params.get('utm_campaign');
    const utmTerm = params.get('utm_term');
    const utmContent = params.get('utm_content');

    // Also check Naver-specific ad params for keyword
    const naverAdKeyword = params.get('n_query') || params.get('mk');

    // If any UTM or ad param present, capture campaign data
    const hasCampaign =
      utmSource || utmMedium || utmCampaign || utmTerm || utmContent ||
      params.has('n_ad') || params.has('mk') || params.has('nrt') || params.has('n_query');

    if (!hasCampaign) return null;

    const adPlatform = detectAdPlatform(params, utmSource, referrer);
    // utm_term takes priority, then Naver ad keyword param
    const finalTerm = utmTerm || naverAdKeyword || null;

    return {
      utmSource,
      utmMedium,
      utmCampaign,
      utmTerm: finalTerm,
      utmContent,
      adPlatform,
      landingUrl: window.location.href.slice(0, 500),
    };
  } catch {
    return null;
  }
}

function getCampaignData(): CampaignData {
  // Try to get campaign data from the current URL first (first landing)
  const fromUrl = extractCampaignFromUrl();
  if (fromUrl) {
    try {
      sessionStorage.setItem(CAMPAIGN_KEY, JSON.stringify(fromUrl));
    } catch { /* ignore */ }
    return fromUrl;
  }

  // If not in URL, try sessionStorage (persisted from first page load in session)
  try {
    const stored = sessionStorage.getItem(CAMPAIGN_KEY);
    if (stored) return JSON.parse(stored) as CampaignData;
  } catch { /* ignore */ }

  return {
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    utmTerm: null,
    utmContent: null,
    adPlatform: null,
    landingUrl: null,
  };
}

export function logVisit(page: string, isMember: boolean, userName?: string): void {
  if (!supabaseConfigured) return;
  if (!shouldLogPage(page)) return;

  const referrer = document.referrer || '';
  const searchKeyword = extractSearchKeyword(referrer);
  const path = window.location.pathname + window.location.hash;
  const userAgent = navigator.userAgent.slice(0, 200);
  const campaign = getCampaignData();

  // search_keyword: prefer referrer-extracted keyword, fall back to utm_term (ad keyword)
  const finalKeyword = searchKeyword || campaign.utmTerm || null;

  supabase
    .from('visitor_logs')
    .insert({
      session_id: getSessionId(),
      page,
      path,
      referrer: referrer || null,
      search_keyword: finalKeyword,
      user_agent: userAgent,
      is_member: isMember,
      user_name: isMember ? userName || null : null,
      utm_source: campaign.utmSource,
      utm_medium: campaign.utmMedium,
      utm_campaign: campaign.utmCampaign,
      utm_term: campaign.utmTerm,
      utm_content: campaign.utmContent,
      ad_platform: campaign.adPlatform,
      landing_url: campaign.landingUrl,
    })
    .then(({ error }) => {
      if (error) console.error('[logVisit]', error.message);
    });
}
