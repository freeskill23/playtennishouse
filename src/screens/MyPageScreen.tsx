import {
  Ticket,
  BedDouble,
  CalendarRange,
  Users,
  Clock,
  Phone,
  XCircle,
  Plus,
  Hand,
  CheckCircle2,
  Trash2,
  LogOut,
} from 'lucide-react';
import { useApp } from '../store';
import { useAuth } from '../lib/auth';
import { SectionTitle, StatusBadge, EmptyState } from '../components/ui';
import { Modal } from '../components/Modal';
import { useState } from 'react';
import type { NTRP, GameType, GenderRequirement } from '../types';

export function MyPageScreen({ go }: { go: (k: string) => void }) {
  const {
    currentUser,
    reservations,
    matchingPosts,
    cancelReservation,
    createMatchingPost,
    getUser,
  } = useApp();
  const { signOut } = useAuth();
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [matchingTarget, setMatchingTarget] = useState<string | null>(null);

  const myReservations = reservations.filter((r) => r.userId === currentUser.id);
  const myMatchings = matchingPosts.filter((m) => m.userId === currentUser.id);
  const myAppliedMatchings = matchingPosts.filter((m) =>
    m.applications.some((a) => a.userId === currentUser.id),
  );

  const eligibleReservations = myReservations.filter(
    (r) => r.status === '예약완료' && r.waitingSequence === null,
  );

  // matching form state
  const [form, setForm] = useState<{
    ntrpRequirement: NTRP | 'any';
    genderRequirement: GenderRequirement;
    maxPlayers: number;
    gameType: GameType;
    description: string;
  }>({
    ntrpRequirement: 'any',
    genderRequirement: 'any',
    maxPlayers: 4,
    gameType: 'doubles',
    description: '',
  });

  const handleCreateMatching = () => {
    if (!matchingTarget) return;
    const res = createMatchingPost({ reservationId: matchingTarget, ...form });
    if (res.ok) {
      setMatchingTarget(null);
      setForm({
        ntrpRequirement: 'any',
        genderRequirement: 'any',
        maxPlayers: 4,
        gameType: 'doubles',
        description: '',
      });
    }
  };

  return (
    <div className="space-y-6 pb-4">
      {/* Profile */}
      <div className="card p-5">
        <div className="flex items-center gap-4">
          <img
            src={currentUser.profileImg}
            alt={currentUser.name}
            className="w-16 h-16 rounded-2xl object-cover"
          />
          <div className="flex-1">
            <p className="text-lg font-extrabold text-navy-900">{currentUser.name}</p>
            <p className="text-sm text-slate-500">{currentUser.phone}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="chip bg-volt-100 text-volt-800">NTRP {currentUser.ntrp}</span>
              <span className="chip bg-navy-50 text-navy-700">구력 {currentUser.career}</span>
              <span className="chip bg-slate-100 text-slate-600">
                {currentUser.hand === 'right' ? '오른손' : currentUser.hand === 'left' ? '왼손' : '양손'}
              </span>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="shrink-0 rounded-xl px-3 py-2 text-sm font-semibold text-rose-500 hover:bg-rose-50 transition flex items-center gap-1.5"
          >
            <LogOut size={16} /> 로그아웃
          </button>
        </div>
        {currentUser.bio && (
          <p className="text-sm text-slate-600 mt-3 pt-3 border-t border-slate-100">{currentUser.bio}</p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatBox label="예약" value={myReservations.filter((r) => r.status !== '취소').length} icon={<Ticket size={16} />} tone="navy" />
        <StatBox label="모집 매칭" value={myMatchings.length} icon={<Users size={16} />} tone="volt" />
        <StatBox label="신청 매칭" value={myAppliedMatchings.length} icon={<Hand size={16} />} tone="sky" />
      </div>

      {/* My reservations */}
      <div>
        <SectionTitle title="내 예약" subtitle="예약 및 대기 내역" />
        {myReservations.length === 0 ? (
          <EmptyState
            icon={<Ticket size={28} />}
            title="예약 내역이 없어요"
            action={<button className="btn-primary" onClick={() => go('pension')}>펜션 예약하러 가기</button>}
          />
        ) : (
          <div className="space-y-2">
            {myReservations.map((r) => (
              <div key={r.id} className="card p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${r.type === 'pension' ? 'bg-volt-100 text-volt-700' : 'bg-navy-50 text-navy-700'}`}>
                    {r.type === 'pension' ? <BedDouble size={18} /> : <CalendarRange size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-navy-900">{r.targetLabel}</p>
                      {r.type === 'court' && r.timeSlot && <span className="chip bg-slate-100 text-slate-600">{r.timeSlot}</span>}
                      {r.waitingSequence && <span className="chip bg-amber-100 text-amber-700">대기 {r.waitingSequence}순위</span>}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {r.date}{r.capacity && ` · ${r.capacity}명`} · {r.amount.toLocaleString()}원
                    </p>
                    <div className="mt-2">
                      <StatusBadge status={r.status} />
                    </div>
                  </div>
                  {(r.status === '신청' || r.status === '입금대기' || r.status === '승인대기' || r.status === '예약완료') && (
                    <button
                      onClick={() => setCancelTarget(r.id)}
                      className="text-rose-500 hover:bg-rose-50 rounded-lg p-1.5 transition"
                      aria-label="취소"
                    >
                      <XCircle size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create matching */}
      {eligibleReservations.length > 0 && (
        <div>
          <SectionTitle title="매칭글 작성" subtitle="예약완료 건으로 메이트를 모집하세요" />
          <div className="space-y-2">
            {eligibleReservations.map((r) => (
              <div key={r.id} className="card p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${r.type === 'pension' ? 'bg-volt-100 text-volt-700' : 'bg-navy-50 text-navy-700'}`}>
                  {r.type === 'pension' ? <BedDouble size={18} /> : <CalendarRange size={18} />}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-navy-900">{r.targetLabel} {r.type === 'court' && r.timeSlot}</p>
                  <p className="text-xs text-slate-500">{r.date}</p>
                </div>
                <button onClick={() => setMatchingTarget(r.id)} className="btn-primary text-sm py-2 px-3">
                  <Plus size={16} /> 매칭 모집
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My matchings */}
      <div>
        <SectionTitle title="내 매칭" subtitle="내가 모집한 / 신청한 매칭" />
        {myMatchings.length === 0 && myAppliedMatchings.length === 0 ? (
          <EmptyState icon={<Users size={28} />} title="매칭 내역이 없어요" />
        ) : (
          <div className="space-y-2">
            {myMatchings.map((m) => (
              <div key={m.id} className="card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-navy-900">{m.court} · {m.time}</p>
                    <p className="text-xs text-slate-500">{m.date} · {m.applications.length}명 신청</p>
                  </div>
                  <span className={`chip ${m.status === '모집중' ? 'bg-volt-100 text-volt-800' : 'bg-slate-100 text-slate-600'}`}>{m.status}</span>
                </div>
              </div>
            ))}
            {myAppliedMatchings.filter((m) => m.userId !== currentUser.id).map((m) => {
              const myApp = m.applications.find((a) => a.userId === currentUser.id);
              const host = getUser(m.userId);
              return (
                <div key={m.id} className="card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-navy-900">{host?.name}님 매칭 · {m.court}</p>
                      <p className="text-xs text-slate-500">{m.date} {m.time}</p>
                    </div>
                    {myApp?.status === '승인' ? (
                      <span className="chip bg-volt-100 text-volt-800"><CheckCircle2 size={12} /> 승인</span>
                    ) : (
                      <span className="chip bg-amber-100 text-amber-700"><Clock size={12} /> 대기</span>
                    )}
                  </div>
                  {myApp?.status === '승인' && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-sm">
                      <Phone size={14} className="text-volt-700" />
                      <span className="font-bold text-navy-900">{host?.phone}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancel confirm */}
      <Modal
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title="예약 취소"
        size="sm"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setCancelTarget(null)}>아니오</button>
            <button
              className="btn-danger"
              onClick={() => {
                if (cancelTarget) cancelReservation(cancelTarget);
                setCancelTarget(null);
              }}
            >
              <Trash2 size={16} /> 취소하기
            </button>
          </>
        }
      >
        <p className="text-sm text-navy-800">정말 예약을 취소하시겠어요? 취소 후 복구할 수 없으며, 대기자가 있을 경우 자동 승격됩니다.</p>
      </Modal>

      {/* Matching form */}
      <Modal
        open={!!matchingTarget}
        onClose={() => setMatchingTarget(null)}
        title="매칭 모집글 작성"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setMatchingTarget(null)}>취소</button>
            <button className="btn-primary" onClick={handleCreateMatching}>등록하기</button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">구력 요건 (NTRP)</label>
            <div className="flex flex-wrap gap-1.5">
              {(['any', '2.5', '3.0', '3.5', '4.0', '4.5'] as const).map((n) => (
                <button
                  key={n}
                  onClick={() => setForm((f) => ({ ...f, ntrpRequirement: n }))}
                  className={`chip ${form.ntrpRequirement === n ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                  {n === 'any' ? '무관' : n + '+'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">성별 요건</label>
            <div className="flex gap-1.5">
              {(['any', 'male', 'female'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setForm((f) => ({ ...f, genderRequirement: g }))}
                  className={`chip ${form.genderRequirement === g ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                  {g === 'any' ? '무관' : g === 'male' ? '남성' : '여성'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">게임 유형</label>
            <div className="flex gap-1.5">
              {(['singles', 'doubles', 'mixed'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setForm((f) => ({ ...f, gameType: g }))}
                  className={`chip ${form.gameType === g ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                  {g === 'singles' ? '단식' : g === 'doubles' ? '복식' : '혼성'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">모집 인원</label>
            <input
              type="number"
              min={2}
              max={8}
              value={form.maxPlayers}
              onChange={(e) => setForm((f) => ({ ...f, maxPlayers: Number(e.target.value) }))}
              className="input"
            />
          </div>
          <div>
            <label className="label">설명</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="예: 편하게 복식 한 게임 어때요! NTRP 3.0 이상 환영합니다."
              className="input min-h-[80px]"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

function StatBox({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: 'navy' | 'volt' | 'sky';
}) {
  const toneCls =
    tone === 'navy' ? 'bg-navy-50 text-navy-700' : tone === 'volt' ? 'bg-volt-100 text-volt-700' : 'bg-sky-50 text-sky-700';
  return (
    <div className="card p-3.5">
      <div className={`w-8 h-8 rounded-lg ${toneCls} flex items-center justify-center mb-1.5`}>{icon}</div>
      <p className="text-xl font-extrabold text-navy-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
