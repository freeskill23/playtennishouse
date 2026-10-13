import {
  Ticket,
  BedDouble,
  CalendarRange,
  Users,
  Clock,
  Plus,
  Hand,
  CheckCircle2,
  LogOut,
  Pencil,
  KeyRound,
  Camera,
  Loader2,
  Wallet,
  AlertTriangle,
  Trash2,
  Flame,
} from 'lucide-react';
import { useApp } from '../store';
import { useAuth } from '../lib/auth';
import { SectionTitle, StatusBadge, EmptyState } from '../components/ui';
import { Modal } from '../components/Modal';
import { useState, useRef, useEffect, useCallback } from 'react';
import type { NTRP, GameType, GenderRequirement, Hand as HandType, Reservation, GameDayEvent, EventParticipant } from '../types';
import { mergeTimeSlots } from '../types';
import { supabase, supabaseConfigured } from '../lib/supabase';
import { Trophy } from 'lucide-react';

function isBatchEnded(date: string, timeRange: string): boolean {
  if (!date || !timeRange) return false;
  const end = timeRange.split('-')[1]?.trim();
  if (!end) return false;
  const endDt = new Date(`${date}T${end}:00`);
  if (isNaN(endDt.getTime())) return false;
  return endDt.getTime() <= Date.now();
}

function timeWithDuration(timeStr: string): string {
  if (!timeStr) return '';
  const slots = timeStr.split(',').map((s) => s.trim()).filter(Boolean);
  const merged = mergeTimeSlots(slots);
  if (!merged) return '';
  const [s, e] = merged.split('-');
  const [sh, sm] = s.split(':').map(Number);
  const [eh, em] = e.split(':').map(Number);
  const hours = (eh * 60 + em - sh * 60 - sm) / 60;
  const hInt = Math.floor(hours);
  const dur = hours === hInt ? `${hInt}시간` : `${hours}시간`;
  return `${dur} ${merged}`;
}

const NTRP_OPTIONS: NTRP[] = ['1.5', '2.0', '2.5', '3.0', '3.5', '4.0', '4.5', '5.0', '5.5'];
const HAND_OPTIONS: { value: HandType; label: string }[] = [
  { value: 'right', label: '오른손' },
  { value: 'left', label: '왼손' },
  { value: 'both', label: '양손' },
];
const CAREER_OPTIONS = ['0년', '1년', '2년', '3년', '5년', '7년', '10년', '15년+'];

export function MyPageScreen({ go }: { go: (k: string) => void }) {
  const {
    currentUser,
    reservations,
    matchingPosts,
    createMatchingPostFromReservation,
    updateCurrentUser,
    bankAccount,
    cancelReservation,
  } = useApp();
  const { signOut, updateProfile, changePassword, uploadProfileImage } = useAuth();
  const [matchingTarget, setMatchingTarget] = useState<string[] | null>(null);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [pwChangeOpen, setPwChangeOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<string[] | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  // Game day participations
  const [myParticipations, setMyParticipations] = useState<{ participant: EventParticipant; event: GameDayEvent }[]>([]);
  const loadMyParticipations = useCallback(async () => {
    if (!supabaseConfigured || !currentUser.id) return;
    const { data, error } = await supabase
      .from('game_day_participants')
      .select('*')
      .eq('user_id', currentUser.id)
      .neq('status', '취소')
      .order('created_at', { ascending: false });
    if (error || !data) return;
    const eventIds = Array.from(new Set((data as Record<string, unknown>[]).map((r) => r.event_id as string)));
    if (eventIds.length === 0) { setMyParticipations([]); return; }
    const { data: eventData } = await supabase
      .from('game_day_events')
      .select('*')
      .in('id', eventIds);
    const eventMap = new Map<string, GameDayEvent>();
    for (const r of (eventData || []) as Record<string, unknown>[]) {
      eventMap.set(r.id as string, {
        id: r.id as string,
        title: r.title as string,
        gameType: r.game_type as GameDayEvent['gameType'],
        date: typeof r.date === 'string' ? r.date : new Date(r.date as string).toISOString().slice(0, 10),
        startTime: r.start_time as string,
        endTime: r.end_time as string,
        court: r.court as string,
        maxTeams: r.max_teams as number,
        minTeams: r.min_teams as number,
        fee: r.fee as number,
        feePerPlayer: (r.fee_per_player as number) ?? 0,
        refundAccount: (r.refund_account as string) || '',
        description: r.description as string,
        status: r.status as GameDayEvent['status'],
        bracketGeneratedAt: r.bracket_generated_at as number | null,
        createdAt: r.created_at as number,
      });
    }
    const pairs: { participant: EventParticipant; event: GameDayEvent }[] = [];
    for (const r of data as Record<string, unknown>[]) {
      const ev = eventMap.get(r.event_id as string);
      if (!ev) continue;
      pairs.push({
        participant: {
          id: r.id as string,
          eventId: r.event_id as string,
          userId: r.user_id as string,
          playerName: r.player_name as string,
          playerName2: (r.player_name2 as string | null) || null,
          depositorName: (r.depositor_name as string) || '',
          depositorPhone: (r.depositor_phone as string) || null,
          refundAccount: (r.refund_account as string) || null,
          status: r.status as EventParticipant['status'],
          createdAt: r.created_at as number,
        },
        event: ev,
      });
    }
    setMyParticipations(pairs);
  }, [currentUser.id]);

  useEffect(() => { void loadMyParticipations(); }, [loadMyParticipations]);

  const handleCancelGameDay = async (participantId: string) => {
    if (!confirm('게임데이 참가를 취소하시겠습니까?')) return;
    await supabase.from('game_day_participants').update({ status: '취소' }).eq('id', participantId);
    void loadMyParticipations();
  };

  const myReservations = reservations.filter((r) => r.userId === currentUser.id);

  // Group reservations by date + targetLabel (e.g. 7/17 A코트) so consecutive slots collapse into one row
  const groupKey = (r: Reservation) => `${r.date}|${r.targetLabel}|${r.type}|${r.matchingPostId || ''}|${r.batchId || ''}`;
  const buildBatchGroups = (list: Reservation[]) => {
    const map = new Map<string, Reservation[]>();
    for (const r of list) {
      const key = groupKey(r);
      const arr = map.get(key) || [];
      arr.push(r);
      map.set(key, arr);
    }
    for (const arr of map.values()) arr.sort((a, b) => (a.timeSlot || '').localeCompare(b.timeSlot || ''));
    return Array.from(map.entries()).sort(([, a], [, b]) => {
      const aKey = `${a[0].date}|${a[0].timeSlot || ''}`;
      const bKey = `${b[0].date}|${b[0].timeSlot || ''}`;
      return aKey < bKey ? -1 : aKey > bKey ? 1 : 0;
    });
  };
  const courtBatchGroups = buildBatchGroups(
    myReservations.filter((r) => r.type === 'court' && !r.matchingPostId),
  );
  const matchingBatchGroups = buildBatchGroups(
    myReservations.filter((r) => r.type === 'court' && !!r.matchingPostId),
  );
  const pensionBatchGroups = buildBatchGroups(
    myReservations.filter((r) => r.type === 'pension'),
  );

  const bbqBatchGroups = buildBatchGroups(
    myReservations.filter((r) => r.type === 'bbq'),
  );

  // Group eligible reservations by date + court
  const eligibleReservations = myReservations.filter(
    (r) =>
      r.status === '예약완료' &&
      r.waitingSequence === null &&
      r.type === 'court' &&
      !matchingPosts.some((mp) => mp.reservationIds.includes(r.id)),
  );
  const eligibleBatchGroups = (() => {
    const map = new Map<string, Reservation[]>();
    for (const r of eligibleReservations) {
      const key = groupKey(r);
      const arr = map.get(key) || [];
      arr.push(r);
      map.set(key, arr);
    }
    for (const arr of map.values()) arr.sort((a, b) => (a.timeSlot || '').localeCompare(b.timeSlot || ''));
    return Array.from(map.entries()).sort(([, a], [, b]) => {
      const aKey = `${a[0].date}|${a[0].timeSlot || ''}`;
      const bKey = `${b[0].date}|${b[0].timeSlot || ''}`;
      return aKey < bKey ? -1 : aKey > bKey ? 1 : 0;
    });
  })();

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
    const res = createMatchingPostFromReservation({ reservationIds: matchingTarget, ...form });
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
        <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
          <button
            onClick={() => setEditProfileOpen(true)}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold text-navy-800 bg-slate-100 hover:bg-slate-200 transition"
          >
            <Pencil size={15} /> 프로필 수정
          </button>
          <button
            onClick={() => setPwChangeOpen(true)}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold text-navy-800 bg-slate-100 hover:bg-slate-200 transition"
          >
            <KeyRound size={15} /> 비밀번호 변경
          </button>
        </div>
      </div>

      {/* My reservations - grouped by category */}
      <div>
        <SectionTitle title="내 예약" subtitle="예약 및 대기 내역" />
        {myReservations.length === 0 && myParticipations.length === 0 ? (
          <EmptyState
            icon={<Ticket size={28} />}
            title="예약 내역이 없어요"
            action={<button className="btn-primary" onClick={() => go('pension')}>펜션 예약하러 가기</button>}
          />
        ) : (
          <div className="space-y-4">
            {([
              { label: '코트 예약', groups: courtBatchGroups, icon: <CalendarRange size={14} /> },
              { label: '매칭', groups: matchingBatchGroups, icon: <Users size={14} /> },
              { label: '펜션 예약', groups: pensionBatchGroups, icon: <BedDouble size={14} /> },
              { label: '바베큐패키지', groups: bbqBatchGroups, icon: <Flame size={14} /> },
            ] as const).map((sec) => {
              if (sec.groups.length === 0) return null;
              return (
                <div key={sec.label}>
                  <div className="flex items-center gap-1.5 px-1 mb-2 text-slate-600">
                    {sec.icon}
                    <span className="text-sm font-bold">{sec.label}</span>
                    <span className="text-xs text-slate-400">({sec.groups.length})</span>
                  </div>
                  <div className="space-y-3">
                    {sec.groups.map(([groupKeyVal, items]) => {
                      const date = items[0].date;
                      const isCourt = items[0].type === 'court';
                      const activeItems = items.filter((r) => r.status !== '취소');
                      const cancelledItems = items.filter((r) => r.status === '취소');
                      const hasPartialCancel = isCourt && cancelledItems.length > 0 && activeItems.length > 0;
                      const allCancelled = cancelledItems.length === items.length;
                      const activeTimeRange = isCourt ? mergeTimeSlots(activeItems.map((r) => r.timeSlot || '').filter(Boolean)) : '';
                      const fullTimeRange = isCourt ? mergeTimeSlots(items.map((r) => r.timeSlot || '').filter(Boolean)) : '';
                      const displayTimeRange = hasPartialCancel ? activeTimeRange : fullTimeRange;
                      const activeHours = isCourt ? activeItems.length : 0;
                      const totalAmount = items.reduce((sum, r) => sum + r.amount, 0);
                      const hasWaiting = items.some((r) => r.waitingSequence);
                      const statuses = Array.from(new Set(activeItems.map((r) => r.status)));
                      const ended = isBatchEnded(date, displayTimeRange || items[0].timeSlot || '');
                      return (
                        <div key={groupKeyVal} className="card p-4">
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isCourt ? 'bg-navy-50 text-navy-700' : 'bg-volt-100 text-volt-700'}`}>
                              {isCourt ? <CalendarRange size={18} /> : <BedDouble size={18} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-volt-600">{date}</span>
                                <p className="font-bold text-navy-900">{items[0].targetLabel}</p>
                                {isCourt && displayTimeRange && <span className="chip bg-slate-100 text-slate-600">{timeWithDuration(displayTimeRange)}</span>}
                                {hasWaiting && <span className="chip bg-amber-100 text-amber-700">대기</span>}
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {isCourt && `${activeHours}시간`} · {totalAmount.toLocaleString()}원
                              </p>
                              {hasPartialCancel && (
                                <p className="text-xs text-rose-500 mt-0.5">
                                  {cancelledItems.length}시간 취소됨
                                </p>
                              )}
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {ended && (
                                  <span className="chip bg-slate-100 text-slate-500"><Clock size={12} /> 이용시간이 종료</span>
                                )}
                                {hasPartialCancel && (
                                  <span className="chip bg-rose-100 text-rose-600">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                    일부취소
                                  </span>
                                )}
                                {allCancelled ? (
                                  <StatusBadge status="취소" />
                                ) : (
                                  statuses.map((s) => <StatusBadge key={s} status={s} />)
                                )}
                              </div>
                              {!allCancelled && activeItems.some((r) => r.status === '신청' || r.status === '입금대기' || r.status === '승인대기') && (
                                <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 p-3 space-y-2">
                                  <div className="flex items-center gap-2 text-sm">
                                    <Wallet size={15} className="text-amber-600 shrink-0" />
                                    <span className="text-amber-900 font-bold">
                                      입금 계좌: {bankAccount.bank} {bankAccount.number} ({bankAccount.holder})
                                    </span>
                                  </div>
                                  <p className="text-sm font-bold text-amber-900">
                                    입금 금액: {totalAmount.toLocaleString()}원
                                  </p>
                                  <div className="flex items-start gap-1.5 text-xs text-amber-700 font-semibold pt-1 border-t border-amber-200">
                                    <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                                    <span>
                                      {isCourt
                                        ? '24시간 안에 입금 확인이 되지 않으면 예약이 자동 취소됩니다.'
                                        : '48시간 안에 입금 확인이 되지 않으면 예약이 자동 취소됩니다.'}
                                    </span>
                                  </div>
                                </div>
                              )}
                              {!allCancelled && !ended && activeItems.some((r) => r.status === '신청' || r.status === '입금대기' || r.status === '승인대기') && (
                                <div className="mt-3">
                                  <button
                                    onClick={() => setCancelTarget(activeItems.map((r) => r.id))}
                                    className="flex items-center justify-center gap-1.5 w-full rounded-xl py-2 text-sm font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition"
                                  >
                                    <Trash2 size={15} /> 예약 취소
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Game day reservations */}
            {myParticipations.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 px-1 mb-2 text-slate-600">
                  <Trophy size={14} />
                  <span className="text-sm font-bold">게임데이</span>
                  <span className="text-xs text-slate-400">({myParticipations.length})</span>
                </div>
                <div className="space-y-3">
                  {myParticipations.map(({ participant, event }) => {
                    const gameEnded = event.status === '종료' || event.status === '취소';
                    const canCancel = !gameEnded && (participant.status === '입금대기' || participant.status === '대기');
                    const statusLabel = participant.status === '참가'
                      ? { label: '참가', cls: 'bg-green-100 text-green-700' }
                      : participant.status === '입금대기'
                        ? { label: '입금대기', cls: 'bg-sky-100 text-sky-700' }
                        : participant.status === '대기'
                          ? { label: '대기', cls: 'bg-amber-100 text-amber-700' }
                          : { label: participant.status, cls: 'bg-slate-100 text-slate-600' };
                    return (
                      <div key={participant.id} className="card p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-100 text-amber-600">
                            <Trophy size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-volt-600">{event.date}</span>
                              <p className="font-bold text-navy-900">{event.title}</p>
                              <span className={`chip ${statusLabel.cls}`}>{statusLabel.label}</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {event.startTime}~{event.endTime} · {event.court.split(',').filter(Boolean).sort().join(', ')}
                              {participant.playerName2 && ` · ${participant.playerName}·${participant.playerName2}`}
                            </p>
                            {participant.status === '입금대기' && (event.fee > 0 || event.feePerPlayer > 0) && (
                              <div className="mt-2 rounded-xl bg-amber-50 border border-amber-200 p-3 space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                  <Wallet size={15} className="text-amber-600 shrink-0" />
                                  <span className="text-amber-900 font-bold">
                                    입금 계좌: {bankAccount.bank} {bankAccount.number} ({bankAccount.holder})
                                  </span>
                                </div>
                                <p className="text-sm font-bold text-amber-900">
                                  입금 금액: {(event.feePerPlayer > 0 ? event.feePerPlayer : event.fee).toLocaleString()}원
                                </p>
                              </div>
                            )}
                            {canCancel && (
                              <div className="mt-3">
                                <button
                                  onClick={() => handleCancelGameDay(participant.id)}
                                  className="flex items-center justify-center gap-1.5 w-full rounded-xl py-2 text-sm font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition"
                                >
                                  <Trash2 size={15} /> 참가 취소
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create matching - grouped by batch */}
      {eligibleBatchGroups.length > 0 && (
        <div>
          <SectionTitle title="매칭글 작성" subtitle="예약완료 건으로 메이트를 모집하세요" />
          <div className="space-y-3">
            {eligibleBatchGroups.map(([groupKeyVal, items]) => {
              const date = items[0].date;
              const timeRange = mergeTimeSlots(items.map((r) => r.timeSlot || '').filter(Boolean));
              const ids = items.map((r) => r.id);
              const ended = isBatchEnded(date, timeRange);
              return (
                <div key={groupKeyVal}>
                  <div className="flex items-center gap-2 px-1 mb-1.5">
                    <CalendarRange size={14} className="text-volt-600" />
                    <span className="text-sm font-bold text-navy-900">{date}</span>
                    <span className="text-xs text-slate-400">({items.length}시간)</span>
                  </div>
                  <div className="space-y-2">
                    <div className="card p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-navy-50 text-navy-700">
                        <CalendarRange size={18} />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-navy-900">{items[0].targetLabel} <span className="text-slate-500 font-normal">{timeWithDuration(timeRange)}</span></p>
                        <p className="text-xs text-slate-500">{items.length}시간 대관</p>
                      </div>
                      {ended ? (
                        <span className="chip bg-slate-100 text-slate-500"><Clock size={12} /> 이용시간종료</span>
                      ) : (
                        <button onClick={() => setMatchingTarget(ids)} className="btn-primary text-sm py-2 px-3">
                          <Plus size={16} /> 매칭 모집
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
            <div className="flex gap-1.5 flex-wrap">
              {(['singles', 'doubles', 'mixed', 'women_doubles', 'men_doubles', 'any'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setForm((f) => ({ ...f, gameType: g }))}
                  className={`chip ${form.gameType === g ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                  {g === 'singles' ? '단식' : g === 'doubles' ? '복식' : g === 'mixed' ? '혼복' : g === 'women_doubles' ? '여복' : g === 'men_doubles' ? '남복' : '무관'}
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

      {/* Profile edit modal */}
      <EditProfileModal
        open={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
        currentUser={currentUser}
        updateProfile={updateProfile}
        uploadProfileImage={uploadProfileImage}
        onUpdated={(patch) => updateCurrentUser(patch)}
      />

      {/* Password change modal */}
      <PasswordChangeModal
        open={pwChangeOpen}
        onClose={() => setPwChangeOpen(false)}
        changePassword={changePassword}
      />

      {/* Cancel reservation confirmation modal */}
      <Modal
        open={!!cancelTarget}
        onClose={() => !cancelLoading && setCancelTarget(null)}
        title="예약 취소"
        size="sm"
        footer={
          <>
            <button
              className="btn-ghost"
              onClick={() => setCancelTarget(null)}
              disabled={cancelLoading}
            >
              아니오
            </button>
            <button
              className="btn-primary bg-rose-500 hover:bg-rose-600"
              onClick={async () => {
                if (!cancelTarget) return;
                setCancelLoading(true);
                for (const id of cancelTarget) {
                  cancelReservation(id);
                }
                setCancelLoading(false);
                setCancelTarget(null);
              }}
              disabled={cancelLoading}
            >
              {cancelLoading ? <Loader2 size={16} className="animate-spin" /> : null}
              {cancelLoading ? '취소 중...' : '네, 취소합니다'}
            </button>
          </>
        }
      >
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
            <AlertTriangle size={24} className="text-rose-500" />
          </div>
          <p className="text-sm font-bold text-navy-900">취소된 예약건은 바로 삭제됩니다.</p>
          <p className="text-xs text-slate-500">정말 예약을 취소하시겠습니까?</p>
        </div>
      </Modal>
    </div>
  );
}

/* ---------- Edit Profile Modal ---------- */

function EditProfileModal({
  open,
  onClose,
  currentUser,
  updateProfile,
  uploadProfileImage,
  onUpdated,
}: {
  open: boolean;
  onClose: () => void;
  currentUser: ReturnType<typeof useApp>['currentUser'];
  updateProfile: ReturnType<typeof useAuth>['updateProfile'];
  uploadProfileImage: ReturnType<typeof useAuth>['uploadProfileImage'];
  onUpdated: (patch: Partial<ReturnType<typeof useApp>['currentUser']>) => void;
}) {
  const [name, setName] = useState(currentUser.name);
  const [phone, setPhone] = useState(currentUser.phone);
  const [ntrp, setNtrp] = useState<string>(currentUser.ntrp);
  const [career, setCareer] = useState(currentUser.career);
  const [hand, setHand] = useState<HandType>(currentUser.hand);
  const [bio, setBio] = useState(currentUser.bio || '');
  const [profileImg, setProfileImg] = useState(currentUser.profileImg);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    const res = await uploadProfileImage(file);
    setUploading(false);
    if (res.ok && res.url) {
      setProfileImg(res.url);
    } else {
      setError(res.error || '이미지 업로드에 실패했습니다.');
    }
  };

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('이름을 입력해주세요.');
      return;
    }
    if (trimmed.length > 8) {
      setError('이름은 8자 이내로 입력해주세요.');
      return;
    }
    setSaving(true);
    setError('');
    const patch = { name, phone, ntrp: ntrp as NTRP, career, hand, bio, profileImg };
    const res = await updateProfile(patch);
    setSaving(false);
    if (res.ok) {
      onUpdated(patch);
      onClose();
    } else {
      setError(res.error || '저장에 실패했습니다.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="프로필 수정"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>취소</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving || uploading}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : null}
            {saving ? '저장 중...' : '저장하기'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Profile image */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            <img
              src={profileImg}
              alt="프로필"
              className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-200"
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-navy-900 text-white flex items-center justify-center shadow-lg hover:bg-navy-800 transition disabled:opacity-50"
              aria-label="사진 변경"
            >
              {uploading ? <Loader2 size={13} className="animate-spin" /> : <Camera size={14} />}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>
          <p className="text-xs text-slate-400">사진을 눌러 프로필 이미지 변경</p>
        </div>

        {/* Name */}
        <div>
          <label className="label">이름 (한글/영문/숫자 8자 이내)</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value.replace(/[^가-힣a-zA-Z0-9\s]/g, '').slice(0, 8))}
            maxLength={8}
            className="input"
            placeholder="이름"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="label">연락처</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input"
            placeholder="010-0000-0000"
          />
        </div>

        {/* NTRP */}
        <div>
          <label className="label">NTRP</label>
          <div className="flex flex-wrap gap-1.5">
            {NTRP_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => setNtrp(n)}
                className={`chip ${ntrp === n ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-600'}`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Career */}
        <div>
          <label className="label">구력</label>
          <div className="flex flex-wrap gap-1.5">
            {CAREER_OPTIONS.map((c) => (
              <button
                key={c}
                onClick={() => setCareer(c)}
                className={`chip ${career === c ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-600'}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Hand */}
        <div>
          <label className="label">주사용 손</label>
          <div className="flex gap-1.5">
            {HAND_OPTIONS.map((h) => (
              <button
                key={h.value}
                onClick={() => setHand(h.value)}
                className={`chip ${hand === h.value ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-600'}`}
              >
                {h.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="label">소개</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="input min-h-[70px]"
            placeholder="간단한 소개를 작성해주세요"
          />
        </div>

        {error && <p className="text-sm text-rose-500 font-semibold">{error}</p>}
      </div>
    </Modal>
  );
}

/* ---------- Password Change Modal ---------- */

function PasswordChangeModal({
  open,
  onClose,
  changePassword,
}: {
  open: boolean;
  onClose: () => void;
  changePassword: ReturnType<typeof useAuth>['changePassword'];
}) {
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (!currentPw || !newPw || !confirmPw) {
      setError('모든 필드를 입력해주세요.');
      return;
    }
    if (newPw.length < 6) {
      setError('새 비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    if (newPw !== confirmPw) {
      setError('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    setSaving(true);
    const res = await changePassword(currentPw, newPw);
    setSaving(false);
    if (res.ok) {
      setSuccess(true);
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } else {
      setError(res.error || '비밀번호 변경에 실패했습니다.');
    }
  };

  const handleClose = () => {
    setCurrentPw('');
    setNewPw('');
    setConfirmPw('');
    setError('');
    setSuccess(false);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="비밀번호 변경"
      size="sm"
      footer={
        <>
          <button className="btn-ghost" onClick={handleClose}>취소</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : null}
            {saving ? '변경 중...' : '변경하기'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {success ? (
          <div className="flex flex-col items-center py-6 text-center">
            <CheckCircle2 size={40} className="text-volt-500 mb-3" />
            <p className="font-bold text-navy-900">비밀번호가 변경되었습니다.</p>
          </div>
        ) : (
          <>
            <div>
              <label className="label">현재 비밀번호</label>
              <input
                type="password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                className="input"
                placeholder="현재 비밀번호"
                autoComplete="current-password"
              />
            </div>
            <div>
              <label className="label">새 비밀번호</label>
              <input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                className="input"
                placeholder="새 비밀번호 (6자 이상)"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="label">새 비밀번호 확인</label>
              <input
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                className="input"
                placeholder="새 비밀번호 재입력"
                autoComplete="new-password"
              />
            </div>
            {error && <p className="text-sm text-rose-500 font-semibold">{error}</p>}
          </>
        )}
      </div>
    </Modal>
  );
}


