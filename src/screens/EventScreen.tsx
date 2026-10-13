import { useState, useEffect, useCallback } from 'react';
import {
  Trophy,
  Calendar as CalendarIcon,
  Clock,
  Users,
  Wallet,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Medal,
  Loader2,
} from 'lucide-react';
import { supabase, supabaseConfigured } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { todayYMD } from '../components/Calendar';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/ui';
import type { GameDayEvent, EventParticipant, EventMatch, EventGameType } from '../types';

const GAME_TYPE_LABEL: Record<EventGameType, string> = {
  singles: '단식',
  doubles: '복식',
};

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  모집중: { label: '모집중', cls: 'bg-green-100 text-green-700' },
  대기모집: { label: '대기신청', cls: 'bg-amber-100 text-amber-700' },
  대진완료: { label: '대진완료', cls: 'bg-sky-100 text-sky-700' },
  진행중: { label: '진행중', cls: 'bg-volt-100 text-volt-800' },
  종료: { label: '종료', cls: 'bg-navy-100 text-navy-700' },
  취소: { label: '취소', cls: 'bg-rose-100 text-rose-600' },
};

interface EventWithCounts extends GameDayEvent {
  participantCount: number;
  waitingCount: number;
}

export function EventScreen() {
  const { isGuest, user } = useAuth();
  const [events, setEvents] = useState<EventWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<GameDayEvent | null>(null);
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [matches, setMatches] = useState<EventMatch[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [applyModal, setApplyModal] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [playerName2, setPlayerName2] = useState('');
  const [depositorName, setDepositorName] = useState('');
  const [depositorPhone, setDepositorPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [appliedEventIds, setAppliedEventIds] = useState<Set<string>>(new Set());

  const loadEvents = useCallback(async () => {
    if (!supabaseConfigured) return;
    const { data, error } = await supabase
      .from('game_day_events')
      .select('*')
      .order('date', { ascending: true });
    if (error) {
      console.error('[loadEvents]', error.message);
      return;
    }
    if (!data) return;

    const eventIds = (data as Record<string, unknown>[]).map((r) => r.id as string);
    let participantCounts: Record<string, { 참가: number; 대기: number }> = {};
    if (eventIds.length > 0) {
      const { data: pData } = await supabase
        .from('game_day_participants')
        .select('event_id, status')
        .in('event_id', eventIds);
      if (pData) {
        for (const p of pData as Record<string, unknown>[]) {
          const eid = p.event_id as string;
          const st = p.status as string;
          if (!participantCounts[eid]) participantCounts[eid] = { 참가: 0, 대기: 0 };
          if (st === '참가') participantCounts[eid].참가++;
          else if (st === '대기') participantCounts[eid].대기++;
        }
      }
    }

    const enriched: EventWithCounts[] = (data as Record<string, unknown>[]).map((r) => {
      const ev: GameDayEvent = {
        id: r.id as string,
        title: r.title as string,
        gameType: r.game_type as EventGameType,
        date: typeof r.date === 'string' ? r.date : new Date(r.date as string).toISOString().slice(0, 10),
        startTime: r.start_time as string,
        endTime: r.end_time as string,
        court: r.court as string,
        maxTeams: r.max_teams as number,
        minTeams: r.min_teams as number,
        fee: r.fee as number,
        feePerPlayer: (r.fee_per_player as number) ?? 0,
        description: r.description as string,
        status: r.status as string,
        bracketGeneratedAt: r.bracket_generated_at as number | null,
        createdAt: r.created_at as number,
      };
      const counts = participantCounts[ev.id] || { 참가: 0, 대기: 0 };
      return { ...ev, participantCount: counts.참가, waitingCount: counts.대기 };
    });

    // Filter out past events (older than today)
    const today = todayYMD();
    const filtered = enriched.filter((e) => e.date >= today);
    setEvents(filtered);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadEvents();
    if (supabaseConfigured) {
      const channel = supabase
        .channel('game_day_events_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'game_day_events' }, () => loadEvents())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'game_day_participants' }, () => loadEvents())
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [loadEvents]);

  // Check which events the current user has already applied to
  useEffect(() => {
    if (!supabaseConfigured || !user) return;
    (async () => {
      const { data } = await supabase
        .from('game_day_participants')
        .select('event_id, status')
        .eq('user_id', user.id)
        .neq('status', '취소');
      if (data) {
        setAppliedEventIds(new Set((data as unknown[] as Record<string, unknown>[]).map((r) => r.event_id as string)));
      }
    })();
  }, [user]);

  const openDetail = async (ev: GameDayEvent) => {
    setSelectedEvent(ev);
    setDetailLoading(true);
    setParticipants([]);
    setMatches([]);

    const [pRes, mRes] = await Promise.all([
      supabase.from('game_day_participants').select('*').eq('event_id', ev.id).order('created_at', { ascending: true }),
      supabase.from('game_day_matches').select('*').eq('event_id', ev.id).order('round', { ascending: true }),
    ]);

    if (pRes.data) {
      setParticipants((pRes.data as Record<string, unknown>[]).map((r) => ({
        id: r.id as string,
        eventId: r.event_id as string,
        userId: r.user_id as string,
        playerName: r.player_name as string,
        playerName2: (r.player_name2 as string | null) || null,
        depositorName: (r.depositor_name as string) || '',
        depositorPhone: (r.depositor_phone as string) || null,
        status: r.status as EventParticipant['status'],
        createdAt: r.created_at as number,
      })));
    }
    if (mRes.data) {
      setMatches((mRes.data as Record<string, unknown>[]).map((r) => ({
        id: r.id as string,
        eventId: r.event_id as string,
        round: r.round as number,
        teamA: r.team_a as string[],
        teamB: r.team_b as string[],
        scoreA: (r.score_a as number | null) ?? null,
        scoreB: (r.score_b as number | null) ?? null,
        winner: (r.winner as 'A' | 'B' | 'draw' | null) ?? null,
      })));
    }
    setDetailLoading(false);
  };

  const handleApply = async () => {
    if (!selectedEvent || !user) return;
    if (!playerName.trim()) {
      setError('참가자 이름을 입력해주세요.');
      return;
    }
    if (selectedEvent.gameType === 'doubles' && !playerName2.trim()) {
      setError('복식 파트너 이름을 입력해주세요.');
      return;
    }
    if (!depositorName.trim()) {
      setError('입금자명을 입력해주세요.');
      return;
    }
    if (isGuest && !depositorPhone.trim()) {
      setError('연락처를 입력해주세요.');
      return;
    }

    setSubmitting(true);
    setError(null);

    // Check current participant count
    const { data: existing } = await supabase
      .from('game_day_participants')
      .select('id, status')
      .eq('event_id', selectedEvent.id)
      .neq('status', '취소')
      .order('created_at', { ascending: true });

    const confirmedCount = (existing || []).filter((p) => (p as Record<string, unknown>).status === '참가').length;
    const isFull = confirmedCount >= selectedEvent.maxTeams;
    const status = isFull ? '대기' : '참가';

    const newId = `ep_${Math.random().toString(36).slice(2, 9)}`;
    const { error: insertError } = await supabase.from('game_day_participants').insert({
      id: newId,
      event_id: selectedEvent.id,
      user_id: user.id,
      player_name: playerName.trim(),
      player_name2: selectedEvent.gameType === 'doubles' ? playerName2.trim() : null,
      depositor_name: depositorName.trim(),
      depositor_phone: isGuest ? depositorPhone.trim() : null,
      status,
    });

    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setApplyModal(false);
    setSuccessModal(true);
    setPlayerName('');
    setPlayerName2('');
    setDepositorName('');
    setDepositorPhone('');
    setAppliedEventIds((prev) => new Set([...prev, selectedEvent.id]));
    void openDetail(selectedEvent);
    void loadEvents();
  };

  const handleCancel = async (participantId: string) => {
    if (!selectedEvent) return;
    const { error: updateError } = await supabase
      .from('game_day_participants')
      .update({ status: '취소' })
      .eq('id', participantId);
    if (updateError) {
      alert('취소에 실패했습니다: ' + updateError.message);
      return;
    }
    // If a confirmed participant cancels, promote the first waiting participant
    const waiting = participants.filter((p) => p.status === '대기');
    if (waiting.length > 0) {
      const firstWaiting = waiting[0];
      await supabase.from('game_day_participants').update({ status: '참가' }).eq('id', firstWaiting.id);
    }
    void openDetail(selectedEvent);
    void loadEvents();
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' });
  };

  // Build ranking from matches
  const rankings = (() => {
    if (matches.length === 0 || participants.length === 0) return [];
    const scores = new Map<string, { wins: number; pointDiff: number; name: string }>();
    for (const p of participants) {
      if (p.status === '참가' || p.status === '대기') {
        const name = p.playerName2 ? `${p.playerName}·${p.playerName2}` : p.playerName;
        scores.set(p.id, { wins: 0, pointDiff: 0, name });
      }
    }
    for (const m of matches) {
      if (m.winner === null || m.scoreA === null || m.scoreB === null) continue;
      for (const pid of m.teamA) {
        const s = scores.get(pid);
        if (s) {
          if (m.winner === 'A') s.wins++;
          s.pointDiff += m.scoreA - m.scoreB;
        }
      }
      for (const pid of m.teamB) {
        const s = scores.get(pid);
        if (s) {
          if (m.winner === 'B') s.wins++;
          s.pointDiff += m.scoreB - m.scoreA;
        }
      }
    }
    return Array.from(scores.entries())
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.wins - a.wins || b.pointDiff - a.pointDiff);
  })();

  const selectedEventWithCounts = selectedEvent
    ? events.find((e) => e.id === selectedEvent.id)
    : null;

  return (
    <div className="space-y-5 pb-4">
      <div className="mb-3">
        <h2 className="text-xl font-bold text-navy-900 flex items-center gap-1.5">
          <Trophy size={22} className="text-amber-500" />
          게임데이 신청
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          단식·복식 게임데이에 참가하세요. 각 팀은 4게임을 진행합니다.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-slate-300" />
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          icon={<Trophy size={28} />}
          title="진행중인 게임데이가 없습니다"
          description="관리자가 새로운 게임데이를 오픈하면 여기에 표시됩니다."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {events.map((ev) => {
            const st = STATUS_LABEL[ev.status] || STATUS_LABEL['모집중'];
            const isFull = ev.participantCount >= ev.maxTeams;
            const canApply = ev.status === '모집중' || ev.status === '대기모집';
            const alreadyApplied = appliedEventIds.has(ev.id);
            return (
              <button
                key={ev.id}
                onClick={() => openDetail(ev)}
                className="card p-5 text-left transition-all hover:border-navy-200 hover:shadow-navy"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                      <Trophy size={20} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="font-bold text-navy-900 text-lg">{ev.title}</p>
                      <p className="text-xs text-slate-500">{GAME_TYPE_LABEL[ev.gameType]} · {ev.court}</p>
                    </div>
                  </div>
                  <span className={`chip ${st.cls}`}>{st.label}</span>
                </div>
                <div className="space-y-1.5 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <CalendarIcon size={14} className="text-slate-400" />
                    {formatDate(ev.date)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-slate-400" />
                    {ev.startTime} ~ {ev.endTime}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-slate-400" />
                    <span className={isFull ? 'text-amber-600 font-semibold' : ''}>
                      {ev.participantCount}/{ev.maxTeams}팀
                    </span>
                    {ev.waitingCount > 0 && (
                      <span className="text-xs text-slate-400">대기 {ev.waitingCount}</span>
                    )}
                    {ev.minTeams > 0 && (
                      <span className="text-xs text-rose-400">최소 {ev.minTeams}팀</span>
                    )}
                  </div>
                  {ev.fee > 0 || ev.feePerPlayer > 0 ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Wallet size={14} className="text-slate-400" />
                      {ev.feePerPlayer > 0 && <span className="text-sm font-semibold text-navy-900">1인 {ev.feePerPlayer.toLocaleString()}원</span>}
                      {ev.feePerPlayer > 0 && ev.fee > 0 && <span className="text-slate-300">/</span>}
                      {ev.fee > 0 && <span className="text-sm font-semibold text-navy-900">팀 {ev.fee.toLocaleString()}원</span>}
                    </div>
                  ) : null}
                </div>
                {ev.description && (
                  <p className="mt-3 text-xs text-slate-500 line-clamp-2">{ev.description}</p>
                )}
                <div className="mt-3 flex items-center justify-between">
                  {alreadyApplied ? (
                    <span className="chip bg-green-100 text-green-700">신청완료</span>
                  ) : canApply ? (
                    <span className="text-xs font-bold text-navy-600 flex items-center gap-1">
                      {isFull ? '대기 신청하기' : '참가 신청하기'}
                      <ChevronRight size={14} />
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">신청 불가</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Event detail modal */}
      <Modal
        open={!!selectedEvent && !applyModal && !successModal}
        onClose={() => setSelectedEvent(null)}
        title={selectedEvent?.title || ''}
        size="lg"
      >
        {selectedEvent && (
          <div className="space-y-4">
            {detailLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-slate-300" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                    <p className="text-xs text-slate-400">구분</p>
                    <p className="font-bold text-navy-900">{GAME_TYPE_LABEL[selectedEvent.gameType]}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                    <p className="text-xs text-slate-400">코트</p>
                    <p className="font-bold text-navy-900">{selectedEvent.court}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                    <p className="text-xs text-slate-400">날짜</p>
                    <p className="font-bold text-navy-900">{formatDate(selectedEvent.date)}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                    <p className="text-xs text-slate-400">시간</p>
                    <p className="font-bold text-navy-900">{selectedEvent.startTime} ~ {selectedEvent.endTime}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                    <p className="text-xs text-slate-400">모집팀</p>
                    <p className="font-bold text-navy-900">
                      {selectedEventWithCounts?.participantCount ?? 0}/{selectedEvent.maxTeams}팀
                      {selectedEvent.minTeams > 0 && <span className="text-xs text-rose-500 ml-1">최소 {selectedEvent.minTeams}팀</span>}
                    </p>
                  </div>
                  {(selectedEvent.fee > 0 || selectedEvent.feePerPlayer > 0) && (
                    <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                      <p className="text-xs text-slate-400">참가비</p>
                      <p className="font-bold text-navy-900">
                        {selectedEvent.feePerPlayer > 0 && <>1인 {selectedEvent.feePerPlayer.toLocaleString()}원</>}
                        {selectedEvent.feePerPlayer > 0 && selectedEvent.fee > 0 && <span className="text-slate-300 mx-1">/</span>}
                        {selectedEvent.fee > 0 && <>팀 {selectedEvent.fee.toLocaleString()}원</>}
                      </p>
                    </div>
                  )}
                </div>

                {selectedEvent.description && (
                  <div className="rounded-xl border border-slate-100 px-4 py-3">
                    <p className="text-sm text-slate-600">{selectedEvent.description}</p>
                  </div>
                )}

                {selectedEvent.minTeams > 0 && (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-2">
                    <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800">
                      최소 {selectedEvent.minTeams}팀 미만 신청 시 해당 일정은 자동 취소되며 환불 처리됩니다.
                    </p>
                  </div>
                )}

                {/* Participants list */}
                <div>
                  <h4 className="font-bold text-navy-900 mb-2 text-sm">참가 현황</h4>
                  <div className="space-y-1">
                    {participants.filter((p) => p.status === '참가').map((p, idx) => (
                      <div key={p.id} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-green-50/50">
                        <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center">{idx + 1}</span>
                        <span className="text-sm font-semibold text-navy-900 flex-1">
                          {p.playerName}
                          {p.playerName2 && <span className="text-slate-500"> · {p.playerName2}</span>}
                        </span>
                        {p.userId === user?.id && (
                          <button
                            onClick={() => handleCancel(p.id)}
                            className="text-xs font-semibold text-rose-500 hover:text-rose-700 transition"
                          >
                            취소
                          </button>
                        )}
                      </div>
                    ))}
                    {participants.filter((p) => p.status === '대기').map((p, idx) => (
                      <div key={p.id} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-amber-50/50">
                        <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center">대{idx + 1}</span>
                        <span className="text-sm font-semibold text-navy-900 flex-1">
                          {p.playerName}
                          {p.playerName2 && <span className="text-slate-500"> · {p.playerName2}</span>}
                        </span>
                        {p.userId === user?.id && (
                          <button
                            onClick={() => handleCancel(p.id)}
                            className="text-xs font-semibold text-rose-500 hover:text-rose-700 transition"
                          >
                            취소
                          </button>
                        )}
                      </div>
                    ))}
                    {participants.filter((p) => p.status !== '취소').length === 0 && (
                      <p className="text-sm text-slate-400 py-3 text-center">아직 신청한 팀이 없습니다.</p>
                    )}
                  </div>
                </div>

                {/* Bracket / Rankings */}
                {matches.length > 0 && (
                  <div>
                    <h4 className="font-bold text-navy-900 mb-2 text-sm">순위</h4>
                    <div className="space-y-1">
                      {rankings.slice(0, 3).map((r, idx) => (
                        <div key={r.id} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-slate-50">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                            idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-slate-200 text-slate-600' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {idx === 0 ? <Medal size={14} /> : idx + 1}
                          </div>
                          <span className="text-sm font-bold text-navy-900 flex-1">{r.name}</span>
                          <span className="text-xs text-slate-500">{r.wins}승</span>
                          <span className="text-xs text-slate-400">점득 +/-{r.pointDiff}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Apply button */}
                {(() => {
                  const canApply = selectedEvent.status === '모집중' || selectedEvent.status === '대기모집';
                  const alreadyApplied = appliedEventIds.has(selectedEvent.id);
                  if (!canApply || alreadyApplied) return null;
                  const isFull = (selectedEventWithCounts?.participantCount ?? 0) >= selectedEvent.maxTeams;
                  return (
                    <button
                      onClick={() => {
                        if (isGuest) {
                          setDepositorName('');
                        } else {
                          setDepositorName(user?.name || '');
                        }
                        setApplyModal(true);
                      }}
                      className="w-full py-3 rounded-xl bg-navy-900 text-white font-bold hover:bg-navy-800 transition flex items-center justify-center gap-2"
                    >
                      <Trophy size={18} />
                      {isFull ? '대기 신청하기' : '참가 신청하기'}
                    </button>
                  );
                })()}
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Apply form modal */}
      <Modal
        open={applyModal}
        onClose={() => { setApplyModal(false); setError(null); }}
        title="게임데이 신청"
        size="sm"
      >
        <div className="space-y-4">
          {selectedEvent && (
            <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm">
              <p className="font-bold text-navy-900">{selectedEvent.title}</p>
              <p className="text-xs text-slate-500">{formatDate(selectedEvent.date)} · {GAME_TYPE_LABEL[selectedEvent.gameType]}</p>
            </div>
          )}
          <div>
            <label className="text-sm font-semibold text-navy-800 block mb-1">참가자 이름</label>
            <input
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="참가자 이름"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-navy-900 outline-none focus:border-volt-400 focus:ring-2 focus:ring-volt-100"
            />
          </div>
          {selectedEvent?.gameType === 'doubles' && (
            <div>
              <label className="text-sm font-semibold text-navy-800 block mb-1">파트너 이름</label>
              <input
                value={playerName2}
                onChange={(e) => setPlayerName2(e.target.value)}
                placeholder="파트너 이름"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-navy-900 outline-none focus:border-volt-400 focus:ring-2 focus:ring-volt-100"
              />
            </div>
          )}
          <div>
            <label className="text-sm font-semibold text-navy-800 block mb-1">입금자명</label>
            <input
              value={depositorName}
              onChange={(e) => setDepositorName(e.target.value)}
              placeholder="입금자명"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-navy-900 outline-none focus:border-volt-400 focus:ring-2 focus:ring-volt-100"
            />
          </div>
          {isGuest && (
            <div>
              <label className="text-sm font-semibold text-navy-800 block mb-1">연락처</label>
              <input
                value={depositorPhone}
                onChange={(e) => setDepositorPhone(e.target.value)}
                placeholder="010-0000-0000"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-navy-900 outline-none focus:border-volt-400 focus:ring-2 focus:ring-volt-100"
              />
            </div>
          )}
          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-600">
              {error}
            </div>
          )}
          <button
            onClick={handleApply}
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-navy-900 text-white font-bold hover:bg-navy-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
            신청하기
          </button>
        </div>
      </Modal>

      {/* Success modal */}
      <Modal
        open={successModal}
        onClose={() => setSuccessModal(false)}
        title="신청 완료"
        size="sm"
      >
        <div className="text-center py-4">
          <div className="mx-auto w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <CheckCircle2 size={28} className="text-green-600" />
          </div>
          <p className="font-bold text-navy-900 mb-2">신청이 완료되었습니다!</p>
          <p className="text-sm text-slate-500">
            입금 확인 후 참가가 확정됩니다. 관리자 계좌로 참가비를 입금해주세요.
          </p>
        </div>
      </Modal>
    </div>
  );
}
