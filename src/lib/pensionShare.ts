const SHARE_PARAM = 'pshare';

export interface PensionShareParams {
  date: string;
  room: string;
  capacity: number;
}

function isValidYMD(d: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
  const dt = new Date(d + 'T00:00:00');
  return !Number.isNaN(dt.getTime());
}

export function readShareParams(): PensionShareParams | null {
  try {
    const p = new URLSearchParams(window.location.search);
    if (p.get(SHARE_PARAM) !== '1') return null;
    const date = p.get('date') || '';
    const room = p.get('room') || '';
    const cap = parseInt(p.get('cap') || '', 10);
    if (!isValidYMD(date)) return null;
    if (room !== 'A동' && room !== 'B동') return null;
    if (!Number.isFinite(cap) || cap < 1 || cap > 8) return null;
    return { date, room, capacity: cap };
  } catch {
    return null;
  }
}

export function buildShareUrl(params: PensionShareParams): string {
  const u = new URL(window.location.origin + window.location.pathname);
  u.searchParams.set(SHARE_PARAM, '1');
  u.searchParams.set('date', params.date);
  u.searchParams.set('room', params.room);
  u.searchParams.set('cap', String(params.capacity));
  return u.toString();
}

export type ShareResult = 'kakao' | 'native' | 'copied' | 'failed';

declare global {
  interface Window {
    Kakao?: {
      isInitialized: () => boolean;
      init: (key: string) => void;
      Share: {
        sendScrap: (opts: { requestUrl: string }) => void;
      };
    };
  }
}

export async function sharePensionLink(url: string): Promise<ShareResult> {
  const key = import.meta.env.VITE_KAKAO_APP_KEY;
  const Kakao = window.Kakao;
  if (Kakao && key) {
    try {
      if (!Kakao.isInitialized()) Kakao.init(key);
      Kakao.Share.sendScrap({ requestUrl: url });
      return 'kakao';
    } catch {
      // fall through to native share
    }
  }
  if (navigator.share) {
    try {
      await navigator.share({
        title: '펜션 예약 같이 하기',
        text: '펜션 예약 정보를 공유했어요. 아래 링크로 열어주세요.',
        url,
      });
      return 'native';
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return 'failed';
      // fall through to clipboard
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    return 'copied';
  } catch {
    return 'failed';
  }
}
