import { useState, useEffect, useCallback } from 'react';
import {
  BedDouble,
  CalendarRange,
  Users,
  Clock,
  CheckCircle2,
  RefreshCw,
  Calendar as CalendarIcon,
  AlertCircle,
} from 'lucide-react';
import { Calendar, todayYMD } from '../components/Calendar';
import { StatusBadge } from '../components/ui';
import { Logo } from '../components/Logo';
import { COURT_TIME_SLOTS } from '../types';
import type { CourtName, RoomName, Reservation } from '../types';
import { supabase, supabaseConfigured } from '../lib/supabase';

interface Room {
  id: string;
  name: string;
  max_capacity: number;
  base_capacity: number;
  description: string;
  price_per_night: number;
}

interface RawReservationRow {
  id: string;
  type: string;
  user_id: string;
  target_id: string;
  target_label: string;
  date: string;
  time_slot: string | null;
  capacity: number | null;
  status: string;
  waiting_sequence: number | null;
  depositor_name: string | null;
  depositor_phone: string | null;
}

interface ProfileRow {
  id: string;
  name: string;
  nickname: string | null;
}

function rowToReservation(r: RawReservationRow): Reservation {
  return {
    id: r.id,
    type: r.type as 'pension' | 'court',
    userId: r.user_id,
    targetId: r.target_id,
    targetLabel: r.target_label,
    date: typeof r.date === 'string' ? r.date : new Date(r.date).toISOString().slice(0, 10),
    timeSlot: r.time_slot || undefined,
    capacity: r.capacity || undefined,
    status: r.status as Reservation['status'],
    waitingSequence: r.waiting_sequence,
    depositTimeoutUntil: null,
    amount: 0,
    createdAt: 0,
    depositorName: r.depositor_name || undefined,
    depositorPhone: r.depositor_phone || undefined,
  };
}

function isWeekendOrHoliday(dateStr: string): boolean {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  return day === 0 || day === 6;
}

const PENSION_BLOCK_START_HOUR = 15;
const PENSION_BLOCK_END_HOUR = 11;

function isCourtSlotBlockedByPension(
  date: string,
  slot: string,
  pensionReservations: Reservation[],
): boolean {
  const slotStart = parseInt(slot.split('-')[0]);
  const slotEnd = parseInt(slot.split('-')[1]);

  // Check if there's a pension reservation for this date that blocks evening slots
  const sameDayPension = pensionReservations.some(
    (r) => r.date === date && r.status !== '취소' && r.waitingSequence === null,
  );
  if (sameDayPension && slotStart >= PENSION_BLOCK_START_HOUR) return true;

  // Check if there's a pension reservation for the previous day that blocks morning slots
  const prevDate = new Date(date + 'T00:00:00');
  prevDate.setDate(prevDate.getDate() - 1);
  const prevDateStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(prevDate.getDate()).padStart(2, '0')}`;
  const prevDayPension = pensionReservations.some(
    (r) => r.date === prevDateStr && r.status !== '취소' && r.waitingSequence === null,
  );
  if (prevDayPension && slotEnd <= PENSION_BLOCK_END_HOUR) return true;

  return false;
}

export function SharedReservationScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState(todayYMD());
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [profiles, setProfiles] = useState<Map<string, ProfileRow>>(new Map());
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!supabaseConfigured) {
      setError('데이터베이스 연결이 설정되지 않았습니다.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const [
        { data: resData, error: resErr },
        { data: roomData, error: roomErr },
        { data: profileData, error: profileErr },
        { data: settingsData, error: settingsErr },
      ] = await Promise.all([
        supabase.from('reservations').select('*').neq('status', '취소'),
        supabase.from('rooms').select('*'),
        supabase.from('profiles').select('id, name, nickname'),
        supabase.from('settings').select('key, value'),
      ]);

      if (resErr) throw new Error(resErr.message);
      if (roomErr) throw new Error(roomErr.message);

      const mapped = (resData as RawReservationRow[])?.map(rowToReservation) || [];
      setReservations(mapped);
      setRooms((roomData as Room[]) || []);

      const profileMap = new Map<string, ProfileRow>();
      for (const p of (profileData as ProfileRow[]) || []) {
        profileMap.set(p.id, p);
      }
      setProfiles(profileMap);

      if (settingsData) {
        for (const s of settingsData as { key: string; value: string }[]) {
          if (s.key === 'logo_image_url') setLogoUrl(s.value);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getUserName = (userId: string): string => {
    const p = profiles.get(userId);
    return p?.nickname || p?.name || '비회원';
  };

  const dayReservations = reservations.filter((r) => r.date === date);
  const pensionReservations = dayReservations.filter((r) => r.type === 'pension');
  const courtReservations = dayReservations.filter((r) => r.type === 'court');

  const getCourtSlotStatus = (
    d: string,
    court: CourtName,
    slot: string,
  ): 'available' | 'booked' | 'pending' | 'blocked' => {
    if (isCourtSlotBlockedByPension(d, slot, pensionReservations)) return 'blocked';
    const res = courtReservations.find(
      (r) => r.targetId === court && r.timeSlot === slot && r.waitingSequence === null && r.status !== '취소',
    );
    if (res?.status === '예약완료') return 'booked';
    if (res?.status === '신청' || res?.status === '입금대기' || res?.status === '승인대기') return 'pending';
    return 'available';
  };

  const getPensionStatus = (roomName: RoomName): {
    status: 'available' | 'full' | 'booked' | 'pending';
    reservation?: Reservation;
    waitings: Reservation[];
  } => {
    const room = rooms.find((r) => r.name === roomName);
    const roomRes = pensionReservations.filter(
      (r) => r.targetLabel === roomName && r.waitingSequence === null && r.status !== '취소',
    );
    const waitings = pensionReservations.filter(
      (r) => r.targetLabel === roomName && r.waitingSequence !== null && r.status !== '취소',
    );
    if (roomRes.length === 0) return { status: 'available', waitings };
    const completed = roomRes.find((r) => r.status === '예약완료');
    if (completed) return { status: 'booked', reservation: completed, waitings };
    const pending = roomRes.find((r) => r.status === '신청' || r.status === '입금대기' || r.status === '승인대기');
    if (pending) return { status: 'pending', reservation: pending, waitings };
    return { status: 'available', waitings };
  };

  const todayLabel = new Date().toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-emerald-50 via-green-50 to-lime-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <Logo size={36} imageUrl={logoUrl} />
            <div className="hidden sm:block">
              <span className="text-lg font-extrabold tracking-tight text-navy-900">PLAY TENNIS HOUSE</span>
              <p className="text-[10px] text-slate-400 font-semibold">예약 현황 공유 페이지</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="chip bg-green-50 text-green-700 text-xs">
              <Users size={12} /> 직원 공유용
            </span>
            <button
              onClick={fetchData}
              disabled={loading}
              className="rounded-lg p-2 bg-white border border-slate-200 text-navy-700 hover:bg-slate-50 transition"
              aria-label="새로고침"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        {error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center mb-4">
              <AlertCircle size={28} className="text-rose-500" />
            </div>
            <p className="font-bold text-navy-900 mb-1">데이터를 불러올 수 없습니다</p>
            <p className="text-sm text-slate-500">{error}</p>
            <button
              onClick={fetchData}
              className="mt-4 px-4 py-2 rounded-xl bg-navy-900 text-white font-bold text-sm hover:bg-navy-800 transition"
            >
              다시 시도
            </button>
          </div>
        ) : (
          <>
            {/* Title */}
            <div className="flex items-end justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold text-navy-900 flex items-center gap-2">
                  <CalendarIcon size={22} className="text-navy-600" />
                  예약 현황
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">{todayLabel}</p>
              </div>
              <span className="chip bg-navy-50 text-navy-700 text-sm font-bold">{date}</span>
            </div>

            {/* Calendar */}
            <Calendar
              value={date}
              onChange={setDate}
              compact
              dayRender={(d) => {
                const res = reservations.filter((r) => r.date === d && r.status !== '취소');
                if (res.length === 0) return null;
                const pensionRes = res.filter((r) => r.type === 'pension');
                if (pensionRes.length > 0) {
                  const hasA = pensionRes.some((r) => r.targetLabel === 'A동');
                  const hasB = pensionRes.some((r) => r.targetLabel === 'B동');
                  let label = '';
                  if (hasA && hasB) label = 'AB동';
                  else if (hasA) label = 'A동';
                  else if (hasB) label = 'B동';
                  return (
                    <span className="text-[8px] font-bold leading-none text-volt-700 bg-volt-100 rounded px-1 py-0.5">
                      {label}예약
                    </span>
                  );
                }
                const courtRes = res.filter((r) => r.type === 'court');
                if (courtRes.length > 0) {
                  return <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />;
                }
                return null;
              }}
            />

            {/* Pension Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
              {(rooms.length > 0 ? rooms : [
                { id: 'roomA', name: 'A동', max_capacity: 8, base_capacity: 4, description: '', price_per_night: 0 },
                { id: 'roomB', name: 'B동', max_capacity: 8, base_capacity: 4, description: '', price_per_night: 0 },
              ]).map((room) => {
                const st = getPensionStatus(room.name as RoomName);
                const roomRes = pensionReservations.filter(
                  (r) => r.targetLabel === room.name && r.waitingSequence === null && r.status !== '취소',
                );
                const waitings = pensionReservations.filter(
                  (r) => r.targetLabel === room.name && r.waitingSequence !== null && r.status !== '취소',
                );
                return (
                  <div key={room.id} className="card p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-volt-100 flex items-center justify-center text-volt-700">
                          <BedDouble size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-navy-900">{room.name}</p>
                          <p className="text-xs text-slate-500">
                            펜션 {room.max_capacity > 0 ? `· 최대 ${room.max_capacity}인` : ''}
                          </p>
                        </div>
                      </div>
                      {st.status === 'booked' && (
                        <span className="chip bg-volt-100 text-volt-800">
                          <CheckCircle2 size={12} /> 예약완료
                        </span>
                      )}
                      {st.status === 'pending' && (
                        <span className="chip bg-amber-100 text-amber-700">신청중</span>
                      )}
                      {st.status === 'available' && (
                        <span className="chip bg-slate-100 text-slate-600">예약가능</span>
                      )}
                      {st.status === 'full' && (
                        <span className="chip bg-rose-100 text-rose-600">만석(대기)</span>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      {roomRes.length === 0 && waitings.length === 0 ? (
                        <p className="text-sm text-slate-400 py-2">예약 내역 없음</p>
                      ) : (
                        <>
                          {roomRes.map((r) => {
                            const name = r.depositorName || getUserName(r.userId);
                            return (
                              <div
                                key={r.id}
                                className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-navy-900 truncate">
                                    {name}
                                    {r.capacity ? ` · ${r.capacity}명` : ''}
                                  </p>
                                  {r.depositorPhone && (
                                    <p className="text-xs text-slate-400 truncate">{r.depositorPhone}</p>
                                  )}
                                </div>
                                <StatusBadge status={r.status} />
                              </div>
                            );
                          })}
                          {waitings.length > 0 && (
                            <p className="text-xs text-amber-600 px-1 pt-1 flex items-center gap-1">
                              <Clock size={12} /> 대기 {waitings.length}건
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Court Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-5">
              {(['A코트', 'B코트'] as CourtName[]).map((court) => {
                const courtRes = courtReservations.filter(
                  (r) => r.targetId === court && r.status !== '취소',
                );
                const bookedCount = courtRes.filter(
                  (r) => r.status === '예약완료' && r.waitingSequence === null,
                ).length;
                return (
                  <div key={court} className="card p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-navy-50 flex items-center justify-center text-navy-700">
                          <CalendarRange size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-navy-900">{court}</p>
                          <p className="text-xs text-slate-500">코트 타임라인</p>
                        </div>
                      </div>
                      <span className="text-xs text-slate-400">
                        {courtRes.length}건{bookedCount > 0 ? ` · 예약완료 ${bookedCount}건` : ''}
                      </span>
                    </div>
                    <div className="space-y-1 max-h-[400px] overflow-y-auto">
                      {COURT_TIME_SLOTS.map((slot) => {
                        const status = getCourtSlotStatus(date, court, slot);
                        const res = courtReservations.find(
                          (r) =>
                            r.targetId === court &&
                            r.timeSlot === slot &&
                            r.waitingSequence === null &&
                            r.status !== '취소',
                        );
                        const name = res
                          ? res.depositorName || getUserName(res.userId)
                          : null;
                        return (
                          <div
                            key={slot}
                            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                              status === 'booked'
                                ? 'bg-volt-50 text-navy-900'
                                : status === 'pending'
                                  ? 'bg-amber-50 text-navy-900'
                                  : status === 'blocked'
                                    ? 'bg-slate-100 text-slate-400'
                                    : 'bg-slate-50 text-slate-500'
                            }`}
                          >
                            <Clock size={13} className="shrink-0" />
                            <span className="font-semibold w-28 shrink-0">{slot}</span>
                            {status === 'available' && <span className="text-xs">예약가능</span>}
                            {status === 'blocked' && (
                              <span className="text-xs flex items-center gap-1">
                                <BedDouble size={11} /> 펜션전용
                              </span>
                            )}
                            {res && name && (
                              <span className="flex-1 min-w-0 truncate text-xs">
                                {name}
                                {res.capacity ? ` · ${res.capacity}명` : ''}
                                {res.depositorPhone ? ` · ${res.depositorPhone}` : ''}
                              </span>
                            )}
                            {res && <StatusBadge status={res.status} />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-5 card p-4">
              <p className="text-xs font-bold text-navy-500 mb-2">범례</p>
              <div className="flex flex-wrap gap-3 text-xs text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-volt-50 border border-volt-200" /> 예약완료
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-amber-50 border border-amber-200" /> 신청/대기중
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-slate-100 border border-slate-200" /> 예약가능
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-slate-200 border border-slate-300" /> 펜션전용(예약불가)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-400" /> 코트 예약 있음
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-[8px] font-bold text-volt-700 bg-volt-100 rounded px-1 py-0.5">A동예약</span> 펜션 예약 있음
                </span>
              </div>
            </div>
          </>
        )}
      </main>

      <footer className="border-t border-slate-100 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <Logo size={24} imageUrl={logoUrl} />
          <p className="text-xs text-slate-400">
            PLAY TENNIS HOUSE · 예약 현황 공유 페이지
          </p>
        </div>
      </footer>
    </div>
  );
}
