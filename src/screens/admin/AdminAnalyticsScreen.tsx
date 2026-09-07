import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  Users,
  Eye,
  Search,
  Link2,
  TrendingUp,
  RefreshCw,
  Calendar,
  Globe,
  Smartphone,
  Monitor,
} from 'lucide-react';
import { supabase, supabaseConfigured } from '../../lib/supabase';
import { SectionTitle, EmptyState } from '../../components/ui';

interface RawLog {
  id: number;
  session_id: string;
  page: string;
  path: string | null;
  referrer: string | null;
  search_keyword: string | null;
  user_agent: string | null;
  is_member: boolean;
  created_at: string;
}

interface Stats {
  totalVisits: number;
  todayVisits: number;
  todayUniqueVisitors: number;
  yesterdayVisits: number;
  yesterdayUniqueVisitors: number;
  weekVisits: number;
  weekUniqueVisitors: number;
  monthVisits: number;
  memberVisits: number;
  guestVisits: number;
}

interface DailyCount {
  date: string;
  visits: number;
  uniqueVisitors: number;
}

interface PageCount {
  page: string;
  visits: number;
}

interface ReferrerCount {
  referrer: string;
  visits: number;
}

interface KeywordCount {
  keyword: string;
  visits: number;
}

interface DeviceCount {
  device: string;
  visits: number;
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

function isYesterday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return d.toDateString() === yesterday.toDateString();
}

function isWithinDays(dateStr: string, days: number): boolean {
  const d = new Date(dateStr);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return d >= cutoff;
}

function isThisMonth(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function detectDevice(ua: string | null): string {
  if (!ua) return '기타';
  if (/Mobile|Android|iPhone|iPad/i.test(ua)) return '모바일';
  return 'PC';
}

function formatReferrer(referrer: string | null): string {
  if (!referrer) return '직접 방문';
  try {
    const url = new URL(referrer);
    const host = url.hostname.replace(/^www\./, '');
    if (host.includes('google')) return 'Google 검색';
    if (host.includes('naver')) return 'Naver 검색';
    if (host.includes('daum') || host.includes('kakao')) return 'Daum/Kakao';
    if (host.includes('bing')) return 'Bing 검색';
    if (host.includes('instagram')) return 'Instagram';
    if (host.includes('facebook')) return 'Facebook';
    if (host.includes('twitter') || host.includes('x.com')) return 'X(Twitter)';
    if (host.includes('youtube')) return 'YouTube';
    if (host.includes('blog')) return '블로그';
    if (host.includes('playtennis') || host.includes('localhost')) return '직접 방문';
    return host;
  } catch {
    return '직접 방문';
  }
}

function StatCard({
  icon,
  label,
  value,
  sub,
  accent = 'navy',
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent?: 'navy' | 'green' | 'amber' | 'sky';
}) {
  const colorMap = {
    navy: 'bg-navy-50 text-navy-700 border-navy-100',
    green: 'bg-green-50 text-green-700 border-green-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    sky: 'bg-sky-50 text-sky-700 border-sky-100',
  };
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${colorMap[accent]}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-500 font-semibold">{label}</p>
        <p className="text-xl font-extrabold text-navy-900">{value}</p>
        {sub && <p className="text-[11px] text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}

function BarRow({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-sm text-navy-800 w-28 shrink-0 truncate font-semibold">{label}</span>
      <div className="flex-1 h-6 bg-slate-100 rounded-lg overflow-hidden">
        <div
          className="h-full bg-navy-700 rounded-lg transition-all duration-500"
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>
      <span className="text-sm font-bold text-navy-900 w-10 text-right">{value}</span>
    </div>
  );
}

export function AdminAnalyticsScreen() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<RawLog[]>([]);
  const [range, setRange] = useState<'today' | 'yesterday' | 'week' | 'month' | 'all'>('week');

  const fetchLogs = useCallback(async () => {
    if (!supabaseConfigured) return;
    setLoading(true);
    let cutoff = new Date();
    let endCutoff: Date | null = null;
    if (range === 'today') cutoff.setHours(0, 0, 0, 0);
    else if (range === 'yesterday') {
      cutoff.setDate(cutoff.getDate() - 1);
      cutoff.setHours(0, 0, 0, 0);
      endCutoff = new Date();
      endCutoff.setHours(0, 0, 0, 0);
    } else if (range === 'week') cutoff.setDate(cutoff.getDate() - 7);
    else if (range === 'month') cutoff.setMonth(cutoff.getMonth() - 1);
    else cutoff.setFullYear(2020);

    let query = supabase
      .from('visitor_logs')
      .select('*')
      .gte('created_at', cutoff.toISOString());
    if (endCutoff) {
      query = query.lt('created_at', endCutoff.toISOString());
    }
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(5000);

    if (error) {
      console.error('[analytics]', error.message);
    }
    if (data) {
      setLogs(data as RawLog[]);
    }
    setLoading(false);
  }, [range]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Compute stats
  const stats: Stats = {
    totalVisits: logs.length,
    todayVisits: logs.filter((l) => isToday(l.created_at)).length,
    todayUniqueVisitors: new Set(
      logs.filter((l) => isToday(l.created_at)).map((l) => l.session_id),
    ).size,
    yesterdayVisits: logs.filter((l) => isYesterday(l.created_at)).length,
    yesterdayUniqueVisitors: new Set(
      logs.filter((l) => isYesterday(l.created_at)).map((l) => l.session_id),
    ).size,
    weekVisits: logs.filter((l) => isWithinDays(l.created_at, 7)).length,
    weekUniqueVisitors: new Set(
      logs.filter((l) => isWithinDays(l.created_at, 7)).map((l) => l.session_id),
    ).size,
    monthVisits: logs.filter((l) => isThisMonth(l.created_at)).length,
    memberVisits: logs.filter((l) => l.is_member).length,
    guestVisits: logs.filter((l) => !l.is_member).length,
  };

  // Daily trend (last 7 days)
  const dailyMap = new Map<string, { visits: number; sessions: Set<string> }>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dailyMap.set(d.toDateString(), { visits: 0, sessions: new Set() });
  }
  for (const log of logs) {
    const key = new Date(log.created_at).toDateString();
    if (dailyMap.has(key)) {
      const entry = dailyMap.get(key)!;
      entry.visits++;
      entry.sessions.add(log.session_id);
    }
  }
  const dailyTrend: DailyCount[] = Array.from(dailyMap.entries()).map(([date, v]) => ({
    date,
    visits: v.visits,
    uniqueVisitors: v.sessions.size,
  }));
  const maxDaily = Math.max(...dailyTrend.map((d) => d.visits), 1);

  // Page breakdown
  const pageMap = new Map<string, number>();
  for (const log of logs) {
    pageMap.set(log.page, (pageMap.get(log.page) || 0) + 1);
  }
  const pageCounts: PageCount[] = Array.from(pageMap.entries())
    .map(([page, visits]) => ({ page, visits }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 10);
  const maxPage = Math.max(...pageCounts.map((p) => p.visits), 1);

  // Referrer breakdown
  const refMap = new Map<string, number>();
  for (const log of logs) {
    const ref = formatReferrer(log.referrer);
    refMap.set(ref, (refMap.get(ref) || 0) + 1);
  }
  const refCounts: ReferrerCount[] = Array.from(refMap.entries())
    .map(([referrer, visits]) => ({ referrer, visits }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 10);
  const maxRef = Math.max(...refCounts.map((r) => r.visits), 1);

  // Search keywords
  const kwMap = new Map<string, number>();
  for (const log of logs) {
    if (log.search_keyword) {
      kwMap.set(log.search_keyword, (kwMap.get(log.search_keyword) || 0) + 1);
    }
  }
  const kwCounts: KeywordCount[] = Array.from(kwMap.entries())
    .map(([keyword, visits]) => ({ keyword, visits }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 15);
  const maxKw = Math.max(...kwCounts.map((k) => k.visits), 1);

  // Device breakdown
  const devMap = new Map<string, number>();
  for (const log of logs) {
    const dev = detectDevice(log.user_agent);
    devMap.set(dev, (devMap.get(dev) || 0) + 1);
  }
  const devCounts: DeviceCount[] = Array.from(devMap.entries())
    .map(([device, visits]) => ({ device, visits }))
    .sort((a, b) => b.visits - a.visits);
  const maxDev = Math.max(...devCounts.map((d) => d.visits), 1);

  const rangeLabels: Record<typeof range, string> = {
    today: '오늘',
    yesterday: '어제',
    week: '최근 7일',
    month: '이번 달',
    all: '전체',
  };

  const todayLabel = new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' });

  return (
    <div className="space-y-5 pb-4">
      <SectionTitle
        title="방문자 분석"
        subtitle={todayLabel}
        right={
          <div className="flex items-center gap-2">
            <select
              value={range}
              onChange={(e) => setRange(e.target.value as typeof range)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-navy-800 bg-white outline-none focus:border-volt-400"
            >
              <option value="today">오늘</option>
              <option value="yesterday">어제</option>
              <option value="week">최근 7일</option>
              <option value="month">이번 달</option>
              <option value="all">전체</option>
            </select>
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="rounded-lg p-2 bg-white border border-slate-200 text-navy-700 hover:bg-slate-50 transition"
              aria-label="새로고침"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={<Eye size={20} />}
          label="총 방문수"
          value={stats.totalVisits}
          sub={rangeLabels[range]}
          accent="navy"
        />
        <StatCard
          icon={<Users size={20} />}
          label="오늘 방문자"
          value={stats.todayUniqueVisitors}
          sub={`방문 ${stats.todayVisits}회`}
          accent="green"
        />
        <StatCard
          icon={<TrendingUp size={20} />}
          label="어제 방문자"
          value={stats.yesterdayUniqueVisitors}
          sub={`방문 ${stats.yesterdayVisits}회`}
          accent="sky"
        />
        <StatCard
          icon={<Calendar size={20} />}
          label="이번 달 방문"
          value={stats.monthVisits}
          accent="amber"
        />
      </div>

      {/* Member vs Guest */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-700">
            <Users size={18} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold">회원 방문</p>
            <p className="text-lg font-extrabold text-navy-900">{stats.memberVisits}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
            <Globe size={18} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold">비회원 방문</p>
            <p className="text-lg font-extrabold text-navy-900">{stats.guestVisits}</p>
          </div>
        </div>
      </div>

      {/* Daily Trend */}
      <div className="card p-5">
        <h3 className="font-bold text-navy-900 mb-3 flex items-center gap-2">
          <BarChart3 size={18} className="text-navy-600" />
          일별 방문 추이 (최근 7일)
        </h3>
        <div className="space-y-1.5">
          {dailyTrend.map((d) => {
            const label = new Date(d.date).toLocaleDateString('ko-KR', {
              month: 'numeric',
              day: 'numeric',
              weekday: 'short',
            });
            return (
              <div key={d.date}>
                <div className="flex items-center gap-3 py-1">
                  <span className="text-xs text-slate-500 w-20 shrink-0 font-semibold">{label}</span>
                  <div className="flex-1 h-7 bg-slate-100 rounded-lg overflow-hidden flex items-center px-2">
                    <div
                      className="h-full bg-gradient-to-r from-green-600 to-emerald-500 rounded-lg transition-all duration-500 flex items-center justify-end pr-2"
                      style={{ width: `${Math.max((d.visits / maxDaily) * 100, d.visits > 0 ? 8 : 0)}%` }}
                    >
                      {d.visits > 0 && (
                        <span className="text-[10px] font-bold text-white whitespace-nowrap">
                          {d.visits}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 w-16 text-right">
                    {d.uniqueVisitors}명
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Page Breakdown */}
        <div className="card p-5">
          <h3 className="font-bold text-navy-900 mb-3 flex items-center gap-2">
            <BarChart3 size={18} className="text-navy-600" />
            페이지별 방문
          </h3>
          {pageCounts.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">데이터가 없습니다.</p>
          ) : (
            <div className="space-y-0.5">
              {pageCounts.map((p) => (
                <BarRow key={p.page} label={p.page} value={p.visits} max={maxPage} />
              ))}
            </div>
          )}
        </div>

        {/* Referrer Breakdown */}
        <div className="card p-5">
          <h3 className="font-bold text-navy-900 mb-3 flex items-center gap-2">
            <Link2 size={18} className="text-navy-600" />
            유입 경로
          </h3>
          {refCounts.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">데이터가 없습니다.</p>
          ) : (
            <div className="space-y-0.5">
              {refCounts.map((r) => (
                <BarRow key={r.referrer} label={r.referrer} value={r.visits} max={maxRef} />
              ))}
            </div>
          )}
        </div>

        {/* Search Keywords */}
        <div className="card p-5">
          <h3 className="font-bold text-navy-900 mb-3 flex items-center gap-2">
            <Search size={18} className="text-navy-600" />
            검색 키워드
          </h3>
          {kwCounts.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">검색을 통한 방문이 아직 없습니다.</p>
          ) : (
            <div className="space-y-0.5">
              {kwCounts.map((k) => (
                <BarRow key={k.keyword} label={k.keyword} value={k.visits} max={maxKw} />
              ))}
            </div>
          )}
        </div>

        {/* Device Breakdown */}
        <div className="card p-5">
          <h3 className="font-bold text-navy-900 mb-3 flex items-center gap-2">
            <Monitor size={18} className="text-navy-600" />
            접속 기기
          </h3>
          {devCounts.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">데이터가 없습니다.</p>
          ) : (
            <div className="space-y-0.5">
              {devCounts.map((d) => (
                <div key={d.device} className="flex items-center gap-3 py-2">
                  <div className="flex items-center gap-2 w-28 shrink-0">
                    {d.device === '모바일' ? (
                      <Smartphone size={16} className="text-slate-400" />
                    ) : (
                      <Monitor size={16} className="text-slate-400" />
                    )}
                    <span className="text-sm text-navy-800 font-semibold">{d.device}</span>
                  </div>
                  <div className="flex-1 h-6 bg-slate-100 rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-sky-500 rounded-lg transition-all duration-500"
                      style={{ width: `${Math.max((d.visits / maxDev) * 100, 5)}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-navy-900 w-10 text-right">{d.visits}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {logs.length === 0 && !loading && (
        <EmptyState
          icon={<BarChart3 size={28} />}
          title="아직 방문 데이터가 없어요"
          description="방문자가 접속하면 여기에 분석 데이터가 표시됩니다."
        />
      )}
    </div>
  );
}
