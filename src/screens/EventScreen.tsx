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
  Loader2,
} from 'lucide-react';
import { supabase, supabaseConfigured, SUPABASE_URL, SUPABASE_ANON_KEY } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useApp } from '../store';
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
  모집마감: { label: '모집마감', cls: 'bg-slate-200 text-slate-600' },
  대진완료: { label: '대진완료', cls: 'bg-sky-100 text-sky-700' },
  진행중: { label: '진행중', cls: 'bg-volt-100 text-volt-800' },
  종료: { label: '종료', cls: 'bg-navy-100 text-navy-700' },
  취소: { label: '취소', cls: 'bg-rose-100 text-rose-600' },
};

interface EventWithCounts extends GameDayEvent {
  participantCount: number;
  waitingCount: number;
  pendingCount: number;
}

export function EventScreen() {
  const { isGuest, user } = useAuth();
  const { bankAccount } = useApp();
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
  const [soloApply, setSoloApply] = useState(false);
  const [depositorName, setDepositorName] = useState('');
  const [editPartnerId, setEditPartnerId] = useState<string | null>(null);
  const [editPartnerName, setEditPartnerName] = useState('');
  const [depositorPhone, setDepositorPhone] = useState('');
  const [refundAccount, setRefundAccount] = useState('');
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
    let participantCounts: Record<string, { 참가: number; 대기: number; 입금대기: number }> = {};
    if (eventIds.length > 0) {
      const { data: pData } = await supabase
        .from('game_day_participants')
        .select('event_id, status')
        .in('event_id', eventIds);
      if (pData) {
        for (const p of pData as Record<string, unknown>[]) {
          const eid = p.event_id as string;
          const st = p.status as string;
          if (!participantCounts[eid]) participantCounts[eid] = { 참가: 0, 대기: 0, 입금대기: 0 };
          if (st === '참가') participantCounts[eid].참가++;
          else if (st === '대기') participantCounts[eid].대기++;
          else if (st === '입금대기') participantCounts[eid].입금대기++;
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
        refundAccount: (r.refund_account as string) || '',
        description: r.description as string,
        status: r.status as string,
        bracketGeneratedAt: r.bracket_generated_at as number | null,
        createdAt: r.created_at as number,
      };
      const counts = participantCounts[ev.id] || { 참가: 0, 대기: 0, 입금대기: 0 };
      return { ...ev, participantCount: counts.참가, waitingCount: counts.대기, pendingCount: counts.입금대기 };
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
        .on('postgres_changes', { event: '*', schema: 'public', table: 'game_day_matches' }, () => loadEvents())
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
        refundAccount: (r.refund_account as string) || null,
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
    if (isGuest) {
      setError('게임데이 신청은 회원만 가능합니다. 로그인 후 이용해주세요.');
      return;
    }
    if (!playerName.trim()) {
      setError('참가자 이름을 입력해주세요.');
      return;
    }
    if (selectedEvent.gameType === 'doubles' && !soloApply && !playerName2.trim()) {
      setError('파트너 이름을 입력하거나 혼자 신청을 체크해주세요.');
      return;
    }
    if (!depositorName.trim()) {
      setError('입금자명을 입력해주세요.');
      return;
    }
    if (!refundAccount.trim()) {
      setError('환불받을 계좌번호를 입력해주세요.');
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
    const pendingCount = (existing || []).filter((p) => (p as Record<string, unknown>).status === '입금대기').length;
    const effectiveCount = confirmedCount + pendingCount;
    const isFull = effectiveCount >= selectedEvent.maxTeams;
    const status = isFull ? '대기' : '입금대기';

    const newId = `ep_${Math.random().toString(36).slice(2, 9)}`;
    const { error: insertError } = await supabase.from('game_day_participants').insert({
      id: newId,
      event_id: selectedEvent.id,
      user_id: user.id,
      player_name: playerName.trim(),
      player_name2: selectedEvent.gameType === 'doubles' && !soloApply ? playerName2.trim() : null,
      depositor_name: depositorName.trim(),
      depositor_phone: isGuest ? depositorPhone.trim() : null,
      refund_account: refundAccount.trim(),
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
    setSoloApply(false);
    setDepositorName('');
    setDepositorPhone('');
    setRefundAccount('');
    setAppliedEventIds((prev) => new Set([...prev, selectedEvent.id]));
    void openDetail(selectedEvent);
    void loadEvents();

    // Send Telegram notification to admin
    const applicantLabel = (playerName2.trim() && !soloApply)
      ? `${playerName} / ${playerName2}`
      : playerName;
    const statusLabel = status === '대기' ? '대기 신청' : '참가 신청';
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/telegram-notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          title: `게임데이 신청`,
          body: `이벤트: ${selectedEvent.title}\n신청자: ${applicantLabel}\n상태: ${statusLabel}`,
        }),
      });
    } catch {
      // silent fail — Telegram is a best-effort notification channel
    }
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

  const handleEditPartner = async (participantId: string) => {
    if (!selectedEvent) return;
    const { error: updateError } = await supabase
      .from('game_day_participants')
      .update({ player_name2: editPartnerName.trim() || null })
      .eq('id', participantId);
    if (updateError) {
      alert('파트너 수정에 실패했습니다: ' + updateError.message);
      return;
    }
    setEditPartnerId(null);
    setEditPartnerName('');
    void openDetail(selectedEvent);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' });
  };

  // Build participant name lookup for bracket display
  const participantNameMap = (() => {
    const m = new Map<string, string>();
    for (const p of participants) {
      const name = p.playerName2 ? `${p.playerName}·${p.playerName2}` : p.playerName;
      m.set(p.id, name);
    }
    return m;
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
          단식·복식 게임데이에 참가하세요. 각 팀 최소 4게임 이상 진행.
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
            const isFull = (ev.participantCount + ev.pendingCount) >= ev.maxTeams;
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
                      <p className="text-xs text-slate-500">{GAME_TYPE_LABEL[ev.gameType]} · {ev.court.split(',').filter(Boolean).sort().join(', ')}</p>
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
                    {ev.pendingCount > 0 && (
                      <span className="text-xs text-sky-500">입금대기 {ev.pendingCount}</span>
                    )}
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
                  <p className="mt-3 text-xs text-slate-500 line-clamp-2 whitespace-pre-line">{ev.description}</p>
                )}
                <div className="mt-3 flex items-center justify-between">
                  {alreadyApplied ? (
                    <span className="chip bg-green-100 text-green-700">신청완료</span>
                  ) : canApply ? (
                    isGuest ? (
                      <span className="text-xs font-semibold text-amber-600">회원만 신청 가능</span>
                    ) : (
                      <span className="text-xs font-bold text-navy-600 flex items-center gap-1">
                        {isFull ? '대기 신청하기' : '참가 신청하기'}
                        <ChevronRight size={14} />
                      </span>
                    )
                  ) : ev.status === '모집마감' ? (
                    <span className="text-xs text-slate-500 font-semibold">모집 마감</span>
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
                    <p className="font-bold text-navy-900">{selectedEvent.court.split(',').filter(Boolean).sort().join(', ')}</p>
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
                      {(selectedEventWithCounts?.participantCount ?? 0) + (selectedEventWithCounts?.pendingCount ?? 0)}/{selectedEvent.maxTeams}팀
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
                    <p className="text-sm text-slate-600 whitespace-pre-line">{selectedEvent.description}</p>
                  </div>
                )}

                {selectedEvent.minTeams > 0 && (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-2">
                    <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800">
                      최소 {selectedEvent.minTeams}팀 미만 신청 시 해당 일정은 자동 취소되며 환불 처리됩니다.
                      {selectedEvent.refundAccount && (
                        <span className="block mt-1 text-xs">환불 계좌: {selectedEvent.refundAccount}</span>
                      )}
                    </p>
                  </div>
                )}

                {/* Participants list */}
                <div>
                  <h4 className="font-bold text-navy-900 mb-2 text-sm">참가 현황</h4>
                  <div className="space-y-1">
                    {participants.filter((p) => p.status === '참가').map((p, idx) => (
                      <div key={p.id} className={`py-2 px-3 rounded-lg bg-green-50/50 ${editPartnerId === p.id ? 'space-y-2' : 'flex items-center gap-3'}`}>
                        {editPartnerId === p.id ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-navy-900">{p.playerName}</span>
                              <span className="text-xs text-slate-400">파트너 수정</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                value={editPartnerName}
                                onChange={(e) => setEditPartnerName(e.target.value)}
                                placeholder="새 파트너 이름 (비우면 혼자 신청)"
                                className="flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-navy-900 outline-none focus:border-volt-400"
                              />
                              <button onClick={() => handleEditPartner(p.id)} className="text-xs font-bold text-volt-700 hover:text-volt-800">저장</button>
                              <button onClick={() => { setEditPartnerId(null); setEditPartnerName(''); }} className="text-xs font-semibold text-slate-500">취소</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center">{idx + 1}</span>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-semibold text-navy-900">
                                {p.playerName}
                                {p.playerName2 && <span className="text-slate-500"> · {p.playerName2}</span>}
                                {!p.playerName2 && selectedEvent?.gameType === 'doubles' && <span className="text-volt-600 text-xs ml-1">(혼자 신청)</span>}
                              </span>
                              {p.userId === user?.id && p.refundAccount && (
                                <span className="block text-xs text-slate-400 mt-0.5">환불계좌: {p.refundAccount}</span>
                              )}
                            </div>
                            {p.userId === user?.id && selectedEvent?.gameType === 'doubles' && (
                              <button
                                onClick={() => { setEditPartnerId(p.id); setEditPartnerName(p.playerName2 || ''); }}
                                className="text-xs font-semibold text-navy-600 hover:text-navy-800 transition"
                              >
                                파트너 수정
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                    {participants.filter((p) => p.status === '입금대기').map((p, idx) => (
                      <div key={p.id} className={`py-2 px-3 rounded-lg bg-sky-50/50 ${editPartnerId === p.id ? 'space-y-2' : 'flex items-center gap-3'}`}>
                        {editPartnerId === p.id ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-navy-900">{p.playerName}</span>
                              <span className="text-xs text-slate-400">파트너 수정</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                value={editPartnerName}
                                onChange={(e) => setEditPartnerName(e.target.value)}
                                placeholder="새 파트너 이름 (비우면 혼자 신청)"
                                className="flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-navy-900 outline-none focus:border-volt-400"
                              />
                              <button onClick={() => handleEditPartner(p.id)} className="text-xs font-bold text-volt-700 hover:text-volt-800">저장</button>
                              <button onClick={() => { setEditPartnerId(null); setEditPartnerName(''); }} className="text-xs font-semibold text-slate-500">취소</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 text-xs font-bold flex items-center justify-center">입{idx + 1}</span>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-semibold text-navy-900">
                                {p.playerName}
                                {p.playerName2 && <span className="text-slate-500"> · {p.playerName2}</span>}
                                {!p.playerName2 && selectedEvent?.gameType === 'doubles' && <span className="text-volt-600 text-xs ml-1">(혼자 신청)</span>}
                              </span>
                              {p.userId === user?.id && p.refundAccount && (
                                <span className="block text-xs text-slate-400 mt-0.5">환불계좌: {p.refundAccount}</span>
                              )}
                            </div>
                            <span className="text-xs text-sky-600 font-semibold">입금대기</span>
                            {p.userId === user?.id && selectedEvent?.gameType === 'doubles' && (
                              <button
                                onClick={() => { setEditPartnerId(p.id); setEditPartnerName(p.playerName2 || ''); }}
                                className="text-xs font-semibold text-navy-600 hover:text-navy-800 transition"
                              >
                                파트너 수정
                              </button>
                            )}
                            {p.userId === user?.id && (
                              <button
                                onClick={() => handleCancel(p.id)}
                                className="text-xs font-semibold text-rose-500 hover:text-rose-700 transition"
                              >
                                취소
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                    {participants.filter((p) => p.status === '대기').map((p, idx) => (
                      <div key={p.id} className={`py-2 px-3 rounded-lg bg-amber-50/50 ${editPartnerId === p.id ? 'space-y-2' : 'flex items-center gap-3'}`}>
                        {editPartnerId === p.id ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-navy-900">{p.playerName}</span>
                              <span className="text-xs text-slate-400">파트너 수정</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                value={editPartnerName}
                                onChange={(e) => setEditPartnerName(e.target.value)}
                                placeholder="새 파트너 이름 (비우면 혼자 신청)"
                                className="flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-navy-900 outline-none focus:border-volt-400"
                              />
                              <button onClick={() => handleEditPartner(p.id)} className="text-xs font-bold text-volt-700 hover:text-volt-800">저장</button>
                              <button onClick={() => { setEditPartnerId(null); setEditPartnerName(''); }} className="text-xs font-semibold text-slate-500">취소</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center">대{idx + 1}</span>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-semibold text-navy-900">
                                {p.playerName}
                                {p.playerName2 && <span className="text-slate-500"> · {p.playerName2}</span>}
                                {!p.playerName2 && selectedEvent?.gameType === 'doubles' && <span className="text-volt-600 text-xs ml-1">(혼자 신청)</span>}
                              </span>
                              {p.userId === user?.id && p.refundAccount && (
                                <span className="block text-xs text-slate-400 mt-0.5">환불계좌: {p.refundAccount}</span>
                              )}
                            </div>
                            {p.userId === user?.id && selectedEvent?.gameType === 'doubles' && (
                              <button
                                onClick={() => { setEditPartnerId(p.id); setEditPartnerName(p.playerName2 || ''); }}
                                className="text-xs font-semibold text-navy-600 hover:text-navy-800 transition"
                              >
                                파트너 수정
                              </button>
                            )}
                            {p.userId === user?.id && (
                              <button
                                onClick={() => handleCancel(p.id)}
                                className="text-xs font-semibold text-rose-500 hover:text-rose-700 transition"
                              >
                                취소
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                    {participants.filter((p) => p.status !== '취소').length === 0 && (
                      <p className="text-sm text-slate-400 py-3 text-center">아직 신청한 팀이 없습니다.</p>
                    )}
                  </div>
                </div>

                {/* Bracket / Matches */}
                {matches.length > 0 && (
                  <div>
                    <h4 className="font-bold text-navy-900 mb-2 text-sm">대진표 · 결과</h4>
                    <div className="space-y-2">
                      {matches.sort((a, b) => a.round - b.round).map((m) => {
                        const nameA = participantNameMap.get(m.teamA[0]) || '?';
                        const nameB = participantNameMap.get(m.teamB[0]) || '?';
                        return (
                          <div key={m.id} className="rounded-xl border border-slate-100 px-4 py-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-slate-400">게임 {m.round}</span>
                              {m.winner && (
                                <span className={`chip text-[10px] ${m.winner === 'draw' ? 'bg-slate-100 text-slate-600' : 'bg-sky-100 text-sky-700'}`}>
                                  {m.winner === 'draw' ? '무승부' : '종료'}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <div className={`flex-1 text-sm font-semibold ${m.winner === 'A' ? 'text-green-700' : 'text-navy-900'}`}>
                                {nameA}
                                {m.scoreA !== null && <span className="ml-2 text-lg font-extrabold">{m.scoreA}</span>}
                              </div>
                              <span className="text-xs text-slate-400">vs</span>
                              <div className={`flex-1 text-right text-sm font-semibold ${m.winner === 'B' ? 'text-green-700' : 'text-navy-900'}`}>
                                {m.scoreB !== null && <span className="mr-2 text-lg font-extrabold">{m.scoreB}</span>}
                                {nameB}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Apply button */}
                {(() => {
                  const canApply = selectedEvent.status === '모집중' || selectedEvent.status === '대기모집';
                  const alreadyApplied = appliedEventIds.has(selectedEvent.id);
                  if (selectedEvent.status === '모집마감' && !alreadyApplied) {
                    return (
                      <div className="rounded-xl bg-slate-100 border border-slate-200 px-4 py-3 text-center">
                        <p className="text-sm font-semibold text-slate-600">모집이 마감되었습니다</p>
                      </div>
                    );
                  }
                  if (!canApply || alreadyApplied) return null;
                  if (isGuest) {
                    return (
                      <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-center">
                        <p className="text-sm font-semibold text-amber-800">게임데이 신청은 회원만 가능합니다</p>
                        <p className="text-xs text-amber-600 mt-0.5">로그인 후 이용해주세요.</p>
                      </div>
                    );
                  }
                  const isFull = ((selectedEventWithCounts?.participantCount ?? 0) + (selectedEventWithCounts?.pendingCount ?? 0)) >= selectedEvent.maxTeams;
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
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-semibold text-navy-800">파트너 이름</label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={soloApply}
                    onChange={(e) => setSoloApply(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-volt-600 focus:ring-volt-400"
                  />
                  <span className="text-xs font-semibold text-navy-700">혼자 신청하기</span>
                </label>
              </div>
              {soloApply ? (
                <div className="rounded-xl bg-volt-50 border border-volt-200 px-3 py-2.5 text-xs text-volt-800 leading-relaxed">
                  혼자 신청하면 혼자 신청한 플레이어끼리 게임데이날 랜덤 매칭으로 게임이 진행됩니다.
                </div>
              ) : (
                <input
                  value={playerName2}
                  onChange={(e) => setPlayerName2(e.target.value)}
                  placeholder="파트너 이름"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-navy-900 outline-none focus:border-volt-400 focus:ring-2 focus:ring-volt-100"
                />
              )}
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
          <div>
            <label className="text-sm font-semibold text-navy-800 block mb-1">환불 계좌</label>
            <input
              value={refundAccount}
              onChange={(e) => setRefundAccount(e.target.value)}
              placeholder="은행명 계좌번호 예금주"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-navy-900 outline-none focus:border-volt-400 focus:ring-2 focus:ring-volt-100"
            />
            <p className="text-xs text-slate-400 mt-1">취소 시 환불을 위한 계좌를 입력해주세요.</p>
          </div>
          {isGuest && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-700">
              게임데이 신청은 회원만 가능합니다. 로그인 후 이용해주세요.
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
            입금하시면 관리자 확인 후 참가가 확정됩니다. 아래 계좌로 참가비를 입금해주세요.
          </p>
          {bankAccount.bank && bankAccount.number && (
            <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-left">
              <p className="text-xs text-slate-400 mb-1">입금 계좌</p>
              <p className="font-bold text-navy-900">{bankAccount.bank} {bankAccount.number}</p>
              <p className="text-sm text-navy-700 mt-0.5">예금주: {bankAccount.holder}</p>
            </div>
          )}
          {selectedEvent?.refundAccount && (
            <p className="mt-3 text-xs text-slate-400">환불 계좌: {selectedEvent.refundAccount}</p>
          )}
        </div>
      </Modal>
    </div>
  );
}
