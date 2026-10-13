import { useState, useEffect, useCallback } from 'react';
import {
  Trophy,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  Users,
  Trash2,
  CheckCircle2,
  X,
  Loader2,
  AlertTriangle,
  Edit3,
  ClipboardList,
  XCircle,
} from 'lucide-react';
import { supabase, supabaseConfigured } from '../../lib/supabase';
import { Calendar, todayYMD, addDaysToYMD } from '../../components/Calendar';
import { Modal } from '../../components/Modal';
import { EmptyState } from '../../components/ui';
import type { GameDayEvent, EventParticipant, EventMatch, EventGameType, CourtName } from '../../types';

const COURTS: CourtName[] = ['A코트', 'B코트'];

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

const HOURS = Array.from({ length: 20 }, (_, i) => i + 5); // 5~24

function formatElapsed(createdMs: number, nowMs: number): string {
  const diff = Math.max(0, nowMs - createdMs);
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}초 전`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 ${min % 60}분 전`;
  const day = Math.floor(hr / 24);
  return `${day}일 ${hr % 24}시간 전`;
}

function formatHour(h: number) {
  return `${String(h).padStart(2, '0')}:00`;
}

interface AdminEventWithCounts extends GameDayEvent {
  participantCount: number;
  waitingCount: number;
  pendingCount: number;
}

export function AdminEventScreen() {
  const [events, setEvents] = useState<AdminEventWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [editTarget, setEditTarget] = useState<GameDayEvent | null>(null);
  const [detailEvent, setDetailEvent] = useState<GameDayEvent | null>(null);
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [matches, setMatches] = useState<EventMatch[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Create form state
  const [title, setTitle] = useState('');
  const [gameType, setGameType] = useState<EventGameType>('doubles');
  const [date, setDate] = useState(todayYMD());
  const [startHour, setStartHour] = useState(9);
  const [endHour, setEndHour] = useState(18);
  const [courts, setCourts] = useState<CourtName[]>(['A코트']);
  const [maxTeams, setMaxTeams] = useState(8);
  const [minTeams, setMinTeams] = useState(4);
  const [fee, setFee] = useState(0);
  const [feePerPlayer, setFeePerPlayer] = useState(0);
  const [refundAccount, setRefundAccount] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live clock for elapsed-time display
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Score editing
  const [scoreEdit, setScoreEdit] = useState<string | null>(null);
  const [scoreA, setScoreA] = useState('');
  const [scoreB, setScoreB] = useState('');

  const loadEvents = useCallback(async () => {
    if (!supabaseConfigured) return;
    const { data, error } = await supabase
      .from('game_day_events')
      .select('*')
      .order('date', { ascending: false });
    if (error) {
      console.error('[loadEvents]', error.message);
      return;
    }
    if (!data) { setLoading(false); return; }

    const eventIds = (data as Record<string, unknown>[]).map((r) => r.id as string);
    let pCounts: Record<string, { 참가: number; 대기: number; 입금대기: number }> = {};
    if (eventIds.length > 0) {
      const { data: pData } = await supabase
        .from('game_day_participants')
        .select('event_id, status')
        .in('event_id', eventIds);
      if (pData) {
        for (const p of pData as Record<string, unknown>[]) {
          const eid = p.event_id as string;
          const st = p.status as string;
          if (!pCounts[eid]) pCounts[eid] = { 참가: 0, 대기: 0, 입금대기: 0 };
          if (st === '참가') pCounts[eid].참가++;
          else if (st === '대기') pCounts[eid].대기++;
          else if (st === '입금대기') pCounts[eid].입금대기++;
        }
      }
    }

    const enriched: AdminEventWithCounts[] = (data as Record<string, unknown>[]).map((r) => {
      const ev: GameDayEvent = {
        id: r.id as string,
        title: r.title as string,
        gameType: r.game_type as EventGameType,
        date: typeof r.date === 'string' ? r.date : new Date(r.date as string).toISOString().slice(0, 10),
        startTime: r.start_time as string,
        endTime: r.end_time as string,
        court: r.court as CourtName,
        maxTeams: r.max_teams as number,
        minTeams: r.min_teams as number,
        fee: r.fee as number,
        feePerPlayer: (r.fee_per_player as number) ?? 0,
        refundAccount: (r.refund_account as string) || '',
        description: r.description as string,
        status: r.status as GameDayEvent['status'],
        bracketGeneratedAt: r.bracket_generated_at as number | null,
        createdAt: r.created_at as number,
      };
      const counts = pCounts[ev.id] || { 참가: 0, 대기: 0, 입금대기: 0 };
      return { ...ev, participantCount: counts.참가, waitingCount: counts.대기, pendingCount: counts.입금대기 };
    });
    setEvents(enriched);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadEvents();
    if (supabaseConfigured) {
      const channel = supabase
        .channel('admin_game_day_events_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'game_day_events' }, () => loadEvents())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'game_day_participants' }, () => loadEvents())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'game_day_matches' }, () => { if (detailEvent) loadDetail(detailEvent.id); })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [loadEvents, detailEvent]);

  const loadDetail = async (eventId: string) => {
    setDetailLoading(true);
    const [pRes, mRes] = await Promise.all([
      supabase.from('game_day_participants').select('*').eq('event_id', eventId).order('created_at', { ascending: true }),
      supabase.from('game_day_matches').select('*').eq('event_id', eventId).order('round', { ascending: true }),
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

  const openDetail = async (ev: GameDayEvent) => {
    setDetailEvent(ev);
    void loadDetail(ev.id);
  };

  const resetForm = () => {
    setTitle('');
    setGameType('doubles');
    setDate(todayYMD());
    setStartHour(9);
    setEndHour(18);
    setCourts(['A코트']);
    setMaxTeams(8);
    setMinTeams(4);
    setFee(0);
    setFeePerPlayer(0);
    setRefundAccount('');
    setDescription('');
    setError(null);
    setEditTarget(null);
  };

  const openCreate = () => {
    resetForm();
    setCreateModal(true);
  };

  const openEdit = (ev: GameDayEvent) => {
    setEditTarget(ev);
    setTitle(ev.title);
    setGameType(ev.gameType);
    setDate(ev.date);
    setStartHour(parseInt(ev.startTime.slice(0, 2), 10) || 9);
    setEndHour(parseInt(ev.endTime.slice(0, 2), 10) || 18);
    setCourts(ev.court.split(',').filter(Boolean) as CourtName[]);
    setMaxTeams(ev.maxTeams);
    setMinTeams(ev.minTeams);
    setFee(ev.fee);
    setFeePerPlayer(ev.feePerPlayer);
    setRefundAccount(ev.refundAccount);
    setDescription(ev.description);
    setCreateModal(true);
  };

  const handleSubmit = async () => {
    if (!title.trim()) { setError('타이틀을 입력해주세요.'); return; }
    if (maxTeams < 2) { setError('최대 팀 수는 2 이상이어야 합니다.'); return; }
    if (minTeams < 0) { setError('최소 팀 수는 0 이상이어야 합니다.'); return; }

    setSubmitting(true);
    setError(null);

    if (editTarget) {
      const { error: updateError } = await supabase
        .from('game_day_events')
        .update({
          title: title.trim(),
          game_type: gameType,
          date,
          start_time: formatHour(startHour),
          end_time: formatHour(endHour),
          court: [...courts].sort().join(','),
          max_teams: maxTeams,
          min_teams: minTeams,
          fee,
          fee_per_player: feePerPlayer,
          refund_account: refundAccount.trim(),
          description: description.trim(),
        })
        .eq('id', editTarget.id);
      setSubmitting(false);
      if (updateError) { setError(updateError.message); return; }
    } else {
      const newId = `gd_${Math.random().toString(36).slice(2, 9)}`;
      const { error: insertError } = await supabase.from('game_day_events').insert({
        id: newId,
        title: title.trim(),
        game_type: gameType,
        date,
        start_time: formatHour(startHour),
        end_time: formatHour(endHour),
        court: [...courts].sort().join(','),
        max_teams: maxTeams,
        min_teams: minTeams,
        fee,
        fee_per_player: feePerPlayer,
        refund_account: refundAccount.trim(),
        description: description.trim(),
        status: '모집중',
        created_at: Date.now(),
      });
      setSubmitting(false);
      if (insertError) { setError(insertError.message); return; }
    }

    setCreateModal(false);
    resetForm();
    void loadEvents();
  };

  const handleDelete = async (ev: GameDayEvent) => {
    if (!confirm(`"${ev.title}" 이벤트를 삭제하시겠습니까?`)) return;
    await supabase.from('game_day_events').delete().eq('id', ev.id);
    void loadEvents();
  };

  const handleCloseRecruitment = async (ev: GameDayEvent) => {
    if (!confirm(`"${ev.title}" 모집을 마감하시겠습니까?\n마감 후 추가 신청이 불가능합니다.`)) return;
    await supabase.from('game_day_events').update({ status: '모집마감' }).eq('id', ev.id);
    if (detailEvent) {
      setDetailEvent({ ...detailEvent, status: '모집마감' });
      void loadDetail(detailEvent.id);
    }
    void loadEvents();
  };

  const handleCancelEvent = async (ev: GameDayEvent) => {
    if (!confirm(`"${ev.title}" 이벤트를 취소하시겠습니까? 참가자들에게 환불 처리가 필요합니다.`)) return;
    await supabase.from('game_day_events').update({ status: '취소' }).eq('id', ev.id);
    void loadEvents();
  };

  const handleConfirmDeposit = async (p: EventParticipant) => {
    await supabase.from('game_day_participants').update({ status: '참가' }).eq('id', p.id);
    if (detailEvent) void loadDetail(detailEvent.id);
    void loadEvents();
  };

  const handlePromoteParticipant = async (p: EventParticipant) => {
    await supabase.from('game_day_participants').update({ status: '참가' }).eq('id', p.id);
    if (detailEvent) void loadDetail(detailEvent.id);
    void loadEvents();
  };

  const handleRemoveParticipant = async (p: EventParticipant) => {
    await supabase.from('game_day_participants').update({ status: '취소' }).eq('id', p.id);
    // Promote first waiting
    const waiting = participants.filter((pp) => pp.status === '대기' && pp.id !== p.id);
    if (waiting.length > 0) {
      await supabase.from('game_day_participants').update({ status: '참가' }).eq('id', waiting[0].id);
    }
    if (detailEvent) void loadDetail(detailEvent.id);
    void loadEvents();
  };

  // Generate bracket: each team plays 4 games, round-robin style
  const generateBracket = async (ev: GameDayEvent) => {
    const confirmed = participants.filter((p) => p.status === '참가');
    if (confirmed.length < 2) {
      alert('참가 팀이 2팀 이상이어야 대진표를 생성할 수 있습니다.');
      return;
    }

    // Check if it's 2 days before the event
    const eventDate = new Date(ev.date + 'T00:00:00');
    const now = new Date();
    const diffDays = Math.floor((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 2) {
      if (!confirm('아직 이벤트 2일 전이 아닙니다. 그래도 대진표를 생성하시겠습니까?')) return;
    }

    // Delete existing matches
    await supabase.from('game_day_matches').delete().eq('event_id', ev.id);

    const teamIds = confirmed.map((p) => p.id);
    const n = teamIds.length;
    const targetGames = 4;

    // Track games per team and opponent frequency for balanced scheduling
    const gamesPerTeam = new Map<string, number>();
    const opponentsPerTeam = new Map<string, Map<string, number>>();
    for (const id of teamIds) {
      gamesPerTeam.set(id, 0);
      opponentsPerTeam.set(id, new Map());
    }

    const matchesToCreate: { teamA: string[]; teamB: string[]; round: number }[] = [];

    // Greedy: pick pairs where both teams still need games, prioritizing:
    // 1) teams with fewest total games, 2) matchups that haven't happened yet
    for (let safety = 0; safety < n * targetGames; safety++) {
      const needGames = teamIds.filter((id) => gamesPerTeam.get(id)! < targetGames);
      if (needGames.length < 2) break;

      let bestPair: [string, string] | null = null;
      let bestScore = Infinity;

      for (let i = 0; i < needGames.length; i++) {
        for (let j = i + 1; j < needGames.length; j++) {
          const a = needGames[i];
          const b = needGames[j];
          const ga = gamesPerTeam.get(a)!;
          const gb = gamesPerTeam.get(b)!;
          const matchupCount = opponentsPerTeam.get(a)!.get(b) || 0;
          // Prioritize: lowest combined game count, then fewest prior meetings
          const score = (ga + gb) * 100 + matchupCount;
          if (score < bestScore) {
            bestScore = score;
            bestPair = [a, b];
          }
        }
      }

      if (!bestPair) break;

      const [a, b] = bestPair;
      matchesToCreate.push({ teamA: [a], teamB: [b], round: 0 });
      gamesPerTeam.set(a, gamesPerTeam.get(a)! + 1);
      gamesPerTeam.set(b, gamesPerTeam.get(b)! + 1);
      opponentsPerTeam.get(a)!.set(b, (opponentsPerTeam.get(a)!.get(b) || 0) + 1);
      opponentsPerTeam.get(b)!.set(a, (opponentsPerTeam.get(b)!.get(a) || 0) + 1);
    }

    // If any team couldn't reach targetGames (too few unique opponents),
    // allow rematches to top them up
    const stillNeed = teamIds.filter((id) => gamesPerTeam.get(id)! < targetGames);
    for (const id of stillNeed) {
      while (gamesPerTeam.get(id)! < targetGames) {
        // Find the opponent with the fewest games (excluding self)
        let bestOpp = null;
        let bestOppGames = Infinity;
        for (const other of teamIds) {
          if (other === id) continue;
          const g = gamesPerTeam.get(other)!;
          if (g < bestOppGames) {
            bestOppGames = g;
            bestOpp = other;
          }
        }
        if (!bestOpp) break;
        matchesToCreate.push({ teamA: [id], teamB: [bestOpp], round: 0 });
        gamesPerTeam.set(id, gamesPerTeam.get(id)! + 1);
        gamesPerTeam.set(bestOpp, gamesPerTeam.get(bestOpp)! + 1);
        opponentsPerTeam.get(id)!.set(bestOpp, (opponentsPerTeam.get(id)!.get(bestOpp) || 0) + 1);
        opponentsPerTeam.get(bestOpp)!.set(id, (opponentsPerTeam.get(bestOpp)!.get(id) || 0) + 1);
      }
    }

    // Assign rounds: no team plays twice in the same round
    const teamRounds = new Map<string, Set<number>>();
    for (const id of teamIds) teamRounds.set(id, new Set());

    for (const m of matchesToCreate) {
      let round = 1;
      while (teamRounds.get(m.teamA[0])!.has(round) || teamRounds.get(m.teamB[0])!.has(round)) {
        round++;
      }
      m.round = round;
      teamRounds.get(m.teamA[0])!.add(round);
      teamRounds.get(m.teamB[0])!.add(round);
    }

    for (const m of matchesToCreate) {
      const matchId = `gm_${Math.random().toString(36).slice(2, 9)}`;
      await supabase.from('game_day_matches').insert({
        id: matchId,
        event_id: ev.id,
        round: m.round,
        team_a: m.teamA,
        team_b: m.teamB,
        score_a: null,
        score_b: null,
        winner: null,
      });
    }

    await supabase.from('game_day_events').update({
      status: '대진완료',
      bracket_generated_at: Date.now(),
    }).eq('id', ev.id);

    if (detailEvent) void loadDetail(ev.id);
    void loadEvents();
    alert('대진표가 생성되었습니다!');
  };

  const handleSaveScore = async (matchId: string) => {
    const a = parseInt(scoreA, 10);
    const b = parseInt(scoreB, 10);
    if (isNaN(a) || isNaN(b)) {
      alert('점수를 올바르게 입력해주세요.');
      return;
    }
    const winner = a > b ? 'A' : b > a ? 'B' : 'draw';
    await supabase.from('game_day_matches').update({
      score_a: a,
      score_b: b,
      winner,
    }).eq('id', matchId);
    setScoreEdit(null);
    setScoreA('');
    setScoreB('');
    if (detailEvent) void loadDetail(detailEvent.id);
  };

  const handleFinishEvent = async (ev: GameDayEvent) => {
    if (!confirm('이벤트를 종료 처리하시겠습니까?')) return;
    await supabase.from('game_day_events').update({ status: '종료' }).eq('id', ev.id);
    void loadEvents();
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric', weekday: 'short' });
  };

  const detailEventWithCounts = detailEvent ? events.find((e) => e.id === detailEvent.id) : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-navy-900 flex items-center gap-1.5">
          <Trophy size={22} className="text-amber-500" />
          게임데이 관리
        </h2>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-700 text-white text-sm font-bold hover:bg-green-800 transition"
        >
          <Plus size={16} />
          게임데이 생성
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-slate-300" />
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          icon={<Trophy size={28} />}
          title="게임데이가 없습니다"
          description="새로운 게임데이를 생성해주세요."
          action={
            <button onClick={openCreate} className="px-4 py-2 rounded-xl bg-green-700 text-white text-sm font-bold hover:bg-green-800 transition">
              게임데이 생성
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {events.map((ev) => {
            const st = STATUS_LABEL[ev.status] || STATUS_LABEL['모집중'];
            return (
              <div key={ev.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-navy-900 text-lg">{ev.title}</p>
                      <span className={`chip ${st.cls}`}>{st.label}</span>
                      <span className="chip bg-slate-100 text-slate-600">{GAME_TYPE_LABEL[ev.gameType]}</span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                      <span className="flex items-center gap-1"><CalendarIcon size={13} />{formatDate(ev.date)}</span>
                      <span className="flex items-center gap-1"><Clock size={13} />{ev.startTime}~{ev.endTime}</span>
                      <span className="flex items-center gap-1">{ev.court.split(',').filter(Boolean).sort().join(', ')}</span>
                      <span className="flex items-center gap-1"><Users size={13} />{ev.participantCount}/{ev.maxTeams}팀{ev.pendingCount > 0 && ` (입금대기${ev.pendingCount})`}{ev.waitingCount > 0 && ` (대기${ev.waitingCount})`}</span>
                      {ev.fee > 0 && <span>팀 {ev.fee.toLocaleString()}원</span>}
                      {ev.feePerPlayer > 0 && <span>1인 {ev.feePerPlayer.toLocaleString()}원</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openEdit(ev)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition" title="수정">
                      <Edit3 size={16} />
                    </button>
                    <button onClick={() => openDetail(ev)} className="rounded-lg p-2 text-navy-600 hover:bg-navy-50 transition" title="상세관리">
                      <ClipboardList size={16} />
                    </button>
                    {ev.status !== '취소' && ev.status !== '종료' && (
                      <button onClick={() => handleCancelEvent(ev)} className="rounded-lg p-2 text-amber-500 hover:bg-amber-50 transition" title="이벤트 취소">
                        <AlertTriangle size={16} />
                      </button>
                    )}
                    <button onClick={() => handleDelete(ev)} className="rounded-lg p-2 text-rose-500 hover:bg-rose-50 transition" title="삭제">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                {ev.minTeams > 0 && (ev.participantCount + ev.pendingCount) < ev.minTeams && ev.status === '모집중' && (
                  <div className="mt-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs text-amber-700">
                    최소 {ev.minTeams}팀 미달 — 마감 시 자동 취소 및 환불 처리 필요
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit modal */}
      <Modal
        open={createModal}
        onClose={() => { setCreateModal(false); resetForm(); }}
        title={editTarget ? '게임데이 수정' : '게임데이 생성'}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-navy-800 block mb-1">이벤트 타이틀</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 남자복식데이, 여자단식데이, 혼성복식데이"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-navy-900 outline-none focus:border-volt-400 focus:ring-2 focus:ring-volt-100"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-navy-800 block mb-1">게임 구분</label>
            <div className="flex gap-2">
              {(['singles', 'doubles'] as EventGameType[]).map((gt) => (
                <button
                  key={gt}
                  onClick={() => setGameType(gt)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition ${
                    gameType === gt ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {GAME_TYPE_LABEL[gt]}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {gameType === 'singles' ? '참가자 1명 입력란이 표시됩니다.' : '참가자 2명(파트너) 입력란이 표시됩니다.'}
            </p>
          </div>

          <div>
            <label className="text-sm font-semibold text-navy-800 block mb-1">날짜</label>
            <Calendar
              value={date}
              onChange={(d) => setDate(d)}
              minDate={todayYMD()}
              maxDate={addDaysToYMD(90)}
              compact
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold text-navy-800 block mb-1">시작 시간</label>
              <select
                value={startHour}
                onChange={(e) => setStartHour(parseInt(e.target.value, 10))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-navy-900 outline-none focus:border-volt-400"
              >
                {HOURS.filter((h) => h < endHour).map((h) => (
                  <option key={h} value={h}>{formatHour(h)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-navy-800 block mb-1">종료 시간</label>
              <select
                value={endHour}
                onChange={(e) => setEndHour(parseInt(e.target.value, 10))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-navy-900 outline-none focus:border-volt-400"
              >
                {HOURS.filter((h) => h > startHour).map((h) => (
                  <option key={h} value={h}>{formatHour(h)}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-navy-800 block mb-1">코트 (복수 선택 가능)</label>
            <div className="flex gap-2">
              {COURTS.map((c) => {
                const selected = courts.includes(c);
                return (
                  <button
                    key={c}
                    onClick={() => setCourts(selected ? courts.filter((x) => x !== c) : [...courts, c])}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition ${
                      selected ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold text-navy-800 block mb-1">최대 팀 수</label>
              <input
                type="number"
                value={maxTeams}
                onChange={(e) => setMaxTeams(parseInt(e.target.value, 10) || 0)}
                min={2}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-navy-900 outline-none focus:border-volt-400"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-navy-800 block mb-1">최소 팀 수</label>
              <input
                type="number"
                value={minTeams}
                onChange={(e) => setMinTeams(parseInt(e.target.value, 10) || 0)}
                min={0}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-navy-900 outline-none focus:border-volt-400"
              />
              <p className="text-xs text-rose-400 mt-0.5">미달 시 자동 취소·환불</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold text-navy-800 block mb-1">참가비 - 팀 (원)</label>
              <input
                type="number"
                value={fee}
                onChange={(e) => setFee(parseInt(e.target.value, 10) || 0)}
                min={0}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-navy-900 outline-none focus:border-volt-400"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-navy-800 block mb-1">참가비 - 1인 (원)</label>
              <input
                type="number"
                value={feePerPlayer}
                onChange={(e) => setFeePerPlayer(parseInt(e.target.value, 10) || 0)}
                min={0}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-navy-900 outline-none focus:border-volt-400"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-navy-800 block mb-1">환불 계좌</label>
            <input
              value={refundAccount}
              onChange={(e) => setRefundAccount(e.target.value)}
              placeholder="예: 농협 123-45-678901 홍길동"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-navy-900 outline-none focus:border-volt-400"
            />
            <p className="text-xs text-slate-400 mt-0.5">참가수 미달 취소 시 참가자에게 안내될 환불 계좌</p>
          </div>

          <div>
            <label className="text-sm font-semibold text-navy-800 block mb-1">설명</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="이벤트 설명, 규칙, 준비물 등"
              rows={3}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-navy-900 outline-none focus:border-volt-400 focus:ring-2 focus:ring-volt-100 resize-none"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-600">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-green-700 text-white font-bold hover:bg-green-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
            {editTarget ? '수정하기' : '생성하기'}
          </button>
        </div>
      </Modal>

      {/* Detail management modal */}
      <Modal
        open={!!detailEvent}
        onClose={() => setDetailEvent(null)}
        title={detailEvent?.title || ''}
        size="lg"
      >
        {detailEvent && (
          <div className="space-y-4">
            {detailLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-slate-300" />
              </div>
            ) : (
              <>
                {/* Participants management */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-navy-900 text-sm">참가 현황 ({(detailEventWithCounts?.participantCount ?? 0) + (detailEventWithCounts?.pendingCount ?? 0)}/{detailEvent.maxTeams}팀)</h4>
                    {detailEvent.status === '모집중' || detailEvent.status === '대기모집' ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCloseRecruitment(detailEvent)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-600 text-white text-xs font-bold hover:bg-slate-700 transition"
                        >
                          <XCircle size={14} />
                          모집 마감
                        </button>
                        <button
                          onClick={() => generateBracket(detailEvent)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-600 text-white text-xs font-bold hover:bg-sky-700 transition"
                        >
                          <ClipboardList size={14} />
                          대진표 생성
                        </button>
                      </div>
                    ) : null}
                    {detailEvent.status === '모집마감' && (
                      <button
                        onClick={() => generateBracket(detailEvent)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-600 text-white text-xs font-bold hover:bg-sky-700 transition"
                      >
                        <ClipboardList size={14} />
                        대진표 생성
                      </button>
                    )}
                    {detailEvent.status === '대진완료' && (
                      <button
                        onClick={() => handleFinishEvent(detailEvent)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-navy-700 text-white text-xs font-bold hover:bg-navy-800 transition"
                      >
                        <CheckCircle2 size={14} />
                        종료 처리
                      </button>
                    )}
                  </div>
                  <div className="space-y-1">
                    {participants.filter((p) => p.status === '참가').map((p, idx) => (
                      <div key={p.id} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-green-50/50">
                        <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center">{idx + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-navy-900">
                            {p.playerName}
                            {p.playerName2 && <span className="text-slate-500"> · {p.playerName2}</span>}
                          </p>
                          <p className="text-xs text-slate-400">입금자: {p.depositorName}{p.depositorPhone ? ` · ${p.depositorPhone}` : ''}</p>
                          {p.refundAccount && <p className="text-xs text-slate-400">환불계좌: {p.refundAccount}</p>}
                          <p className="text-xs text-slate-400 flex items-center gap-1"><Clock size={11} />{formatElapsed(p.createdAt, now)}</p>
                        </div>
                        {detailEvent.status === '모집중' || detailEvent.status === '대기모집' || detailEvent.status === '모집마감' ? (
                          <button onClick={() => handleRemoveParticipant(p)} className="text-xs font-semibold text-rose-500 hover:text-rose-700 transition">제외</button>
                        ) : null}
                      </div>
                    ))}
                    {participants.filter((p) => p.status === '입금대기').map((p, idx) => (
                      <div key={p.id} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-sky-50/50">
                        <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 text-xs font-bold flex items-center justify-center">입{idx + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-navy-900">
                            {p.playerName}
                            {p.playerName2 && <span className="text-slate-500"> · {p.playerName2}</span>}
                          </p>
                          <p className="text-xs text-slate-400">입금자: {p.depositorName}{p.depositorPhone ? ` · ${p.depositorPhone}` : ''}</p>
                          {p.refundAccount && <p className="text-xs text-slate-400">환불계좌: {p.refundAccount}</p>}
                          <p className="text-xs text-sky-600 flex items-center gap-1 font-semibold"><Clock size={11} />{formatElapsed(p.createdAt, now)}</p>
                        </div>
                        {detailEvent.status === '모집중' || detailEvent.status === '대기모집' || detailEvent.status === '모집마감' ? (
                          <>
                            <button onClick={() => handleConfirmDeposit(p)} className="text-xs font-semibold text-green-600 hover:text-green-800 transition">입금확정</button>
                            <button onClick={() => handleRemoveParticipant(p)} className="text-xs font-semibold text-rose-500 hover:text-rose-700 transition">제외</button>
                          </>
                        ) : null}
                      </div>
                    ))}
                    {participants.filter((p) => p.status === '대기').map((p, idx) => (
                      <div key={p.id} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-amber-50/50">
                        <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center">대{idx + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-navy-900">
                            {p.playerName}
                            {p.playerName2 && <span className="text-slate-500"> · {p.playerName2}</span>}
                          </p>
                          <p className="text-xs text-slate-400">입금자: {p.depositorName}</p>
                          {p.refundAccount && <p className="text-xs text-slate-400">환불계좌: {p.refundAccount}</p>}
                          <p className="text-xs text-slate-400 flex items-center gap-1"><Clock size={11} />{formatElapsed(p.createdAt, now)}</p>
                        </div>
                        <button onClick={() => handlePromoteParticipant(p)} className="text-xs font-semibold text-green-600 hover:text-green-800 transition">참가 승격</button>
                        <button onClick={() => handleRemoveParticipant(p)} className="text-xs font-semibold text-rose-500 hover:text-rose-700 transition">제외</button>
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
                        const pA = participants.find((p) => p.id === m.teamA[0]);
                        const pB = participants.find((p) => p.id === m.teamB[0]);
                        const nameA = pA ? (pA.playerName2 ? `${pA.playerName}·${pA.playerName2}` : pA.playerName) : '?';
                        const nameB = pB ? (pB.playerName2 ? `${pB.playerName}·${pB.playerName2}` : pB.playerName) : '?';
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
                            {detailEvent.status === '대진완료' || detailEvent.status === '진행중' ? (
                              scoreEdit === m.id ? (
                                <div className="mt-2 flex items-center gap-2">
                                  <input
                                    type="number"
                                    value={scoreA}
                                    onChange={(e) => setScoreA(e.target.value)}
                                    placeholder="A점수"
                                    className="w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-center"
                                  />
                                  <span className="text-slate-400">:</span>
                                  <input
                                    type="number"
                                    value={scoreB}
                                    onChange={(e) => setScoreB(e.target.value)}
                                    placeholder="B점수"
                                    className="w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-center"
                                  />
                                  <button onClick={() => handleSaveScore(m.id)} className="px-3 py-1.5 rounded-lg bg-navy-900 text-white text-xs font-bold">저장</button>
                                  <button onClick={() => setScoreEdit(null)} className="px-2 py-1.5 rounded-lg text-slate-400 text-xs"><X size={14} /></button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => { setScoreEdit(m.id); setScoreA(m.scoreA?.toString() || ''); setScoreB(m.scoreB?.toString() || ''); }}
                                  className="mt-2 text-xs font-semibold text-navy-600 hover:text-navy-900 transition"
                                >
                                  {m.winner ? '점수 수정' : '점수 입력'}
                                </button>
                              )
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
