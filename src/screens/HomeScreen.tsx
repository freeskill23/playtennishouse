import {
  BedDouble,
  CalendarRange,
  Users,
  Megaphone,
  Ticket,
  Clock,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../store';
import { Logo } from '../components/Logo';
import { todayYMD } from '../components/Calendar';
import { StatusBadge, SectionTitle } from '../components/ui';

const QUICK_MENUS = [
  { key: 'pension', label: '펜션예약', icon: BedDouble, color: 'bg-volt-500', desc: 'A·B동 숙박' },
  { key: 'court', label: '코트예약', icon: CalendarRange, color: 'bg-navy-700', desc: '2시간 단위' },
  { key: 'matching', label: '매칭', icon: Users, color: 'bg-sky-500', desc: '메이트 모집' },
  { key: 'notices', label: '공지', icon: Megaphone, color: 'bg-clay-400', desc: '이벤트·안내' },
  { key: 'mypage', label: '내예약', icon: Ticket, color: 'bg-rose-500', desc: '예약·매칭 내역' },
] as const;

export function HomeScreen({ go }: { go: (k: string) => void }) {
  const { reservations, matchingPosts, notices, currentUser, bannerImageUrl, logoImageUrl } = useApp();
  const today = todayYMD();

  const todays = reservations.filter((r) => r.date === today && r.status !== '취소');
  const myActive = reservations.filter(
    (r) => r.userId === currentUser.id && r.status !== '취소' && r.status !== '이용완료',
  );
  const openMatchings = matchingPosts.filter((m) => m.status === '모집중');

  return (
    <div className="space-y-6 pb-4">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 shadow-navy">
        {bannerImageUrl ? (
          <>
            <img
              src={bannerImageUrl}
              alt="배너"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-navy-950/85 via-navy-900/60 to-transparent" />
          </>
        ) : (
          <>
            <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-volt-500/20 blur-2xl" />
            <div className="absolute bottom-0 right-6 w-24 h-24 rounded-full bg-volt-400/30 blur-xl animate-bounce-ball" />
          </>
        )}
        <div className="relative p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <Logo size={44} imageUrl={logoImageUrl} />
          </div>
          <p className="mt-3 text-lg font-bold text-white">{currentUser.name}님 플테하에서 오늘도 즐테하세요!</p>
        </div>
      </div>

      {/* Today summary banner */}
      <div className="card p-5">
        <SectionTitle
          title="오늘의 현황"
          subtitle={`${today.slice(2).replace(/-/g, '.')} 예약 요약`}
          right={
            <span className="chip bg-navy-50 text-navy-700">
              <TrendingUp size={14} /> 실시간
            </span>
          }
        />
        <div className="grid grid-cols-3 gap-3">
          <SummaryCard
            icon={<Clock size={18} />}
            label="오늘 예약"
            value={todays.length}
            tone="navy"
          />
          <SummaryCard
            icon={<Users size={18} />}
            label="모집중 매칭"
            value={openMatchings.length}
            tone="volt"
          />
          <SummaryCard
            icon={<CheckCircle2 size={18} />}
            label="내 활동 예약"
            value={myActive.length}
            tone="sky"
          />
        </div>
      </div>

      {/* Quick menus */}
      <div>
        <SectionTitle title="퀵 메뉴" subtitle="원하는 서비스를 바로 이용하세요" />
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {QUICK_MENUS.map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.key}
                onClick={() => go(m.key)}
                className="card p-4 flex flex-col items-center text-center hover:-translate-y-1 hover:shadow-navy transition-all duration-200 group"
              >
                <div
                  className={`w-12 h-12 rounded-2xl ${m.color} flex items-center justify-center text-white mb-2.5 group-hover:scale-110 transition-transform`}
                >
                  <Icon size={22} />
                </div>
                <p className="font-bold text-navy-900 text-sm">{m.label}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{m.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent notices */}
      <div>
        <SectionTitle
          title="최근 공지"
          subtitle="새로운 안내를 확인하세요"
          right={
            <button onClick={() => go('notices')} className="text-sm font-semibold text-navy-600 hover:text-navy-900">
              전체보기
            </button>
          }
        />
        <div className="space-y-2">
          {notices.slice(0, 3).map((n) => (
            <button
              key={n.id}
              onClick={() => go('notices')}
              className="card w-full p-4 flex items-center gap-3 text-left hover:border-navy-200 transition"
            >
              <div className="w-10 h-10 rounded-xl bg-navy-50 flex items-center justify-center text-navy-700">
                <Megaphone size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-navy-900 truncate">{n.title}</p>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{n.content}</p>
              </div>
              <span className="chip bg-slate-100 text-slate-600 shrink-0">{n.type}</span>
            </button>
          ))}
        </div>
      </div>

      {/* My active reservations preview */}
      {myActive.length > 0 && (
        <div>
          <SectionTitle
            title="내 예약 현황"
            right={
              <button onClick={() => go('mypage')} className="text-sm font-semibold text-navy-600 hover:text-navy-900">
                마이페이지
              </button>
            }
          />
          <div className="space-y-2">
            {myActive.slice(0, 3).map((r) => (
              <div key={r.id} className="card p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-volt-100 flex items-center justify-center text-volt-700">
                  {r.type === 'pension' ? <BedDouble size={18} /> : <CalendarRange size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-navy-900">
                    {r.targetLabel} {r.type === 'court' && r.timeSlot}
                  </p>
                  <p className="text-xs text-slate-500">
                    {r.date} {r.waitingSequence && `(대기 ${r.waitingSequence}순위)`}
                  </p>
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: 'navy' | 'volt' | 'sky';
}) {
  const toneCls =
    tone === 'navy'
      ? 'bg-navy-50 text-navy-700'
      : tone === 'volt'
        ? 'bg-volt-100 text-volt-700'
        : 'bg-sky-50 text-sky-700';
  return (
    <div className="rounded-2xl border border-slate-100 p-3.5">
      <div className={`w-9 h-9 rounded-xl ${toneCls} flex items-center justify-center mb-2`}>
        {icon}
      </div>
      <p className="text-2xl font-extrabold text-navy-900">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}
