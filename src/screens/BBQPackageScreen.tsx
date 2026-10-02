import { useState, useMemo } from 'react';
import { Flame, Clock, Users, Wallet, AlertTriangle, CheckCircle2, Calendar as CalendarIcon, Plus, Minus } from 'lucide-react';
import { useApp } from '../store';
import { useAuth } from '../lib/auth';
import { Calendar, todayYMD, addDaysYMD } from '../components/Calendar';
import { Modal } from '../components/Modal';
import { GallerySlideshow } from '../components/GallerySlideshow';
import { computeBBQPrice, getBBQSlotTier, formatWon } from '../pricing';
import type { BBQVenue, CourtName } from '../types';

const VENUES: { name: BBQVenue; court: CourtName; desc: string; color: string }[] = [
  { name: 'A동', court: 'A코트', desc: '테니스코트 + 라운지 + 바베큐장', color: 'bg-amber-500' },
  { name: 'B동', court: 'B코트', desc: '테니스코트 + 라운지 + 바베큐장', color: 'bg-navy-700' },
];

const HOURS = Array.from({ length: 20 }, (_, i) => i + 5); // 5~24

function venueToCourt(venue: BBQVenue): CourtName {
  return venue === 'A동' ? 'A코트' : 'B코트';
}

/** Returns set of hours blocked by court reservations for the given court+date */
function getCourtBlockedHours(
  reservations: { type: string; date: string; targetId: string; timeSlot?: string; waitingSequence: number | null; status: string }[],
  date: string,
  court: CourtName,
): Set<number> {
  const blocked = new Set<number>();
  for (const r of reservations) {
    if (r.type !== 'court' || r.date !== date || r.waitingSequence !== null || r.status === '취소') continue;
    if (r.targetId !== court) continue;
    if (!r.timeSlot) continue;
    const slotStart = parseInt(r.timeSlot.slice(0, 2), 10);
    const slotEnd = parseInt(r.timeSlot.slice(6, 8), 10);
    for (let h = slotStart; h < slotEnd; h++) blocked.add(h);
  }
  return blocked;
}

export function BBQPackageScreen() {
  const {
    bbqPricing,
    createBBQReservation,
    galleryItems,
    bankAccount,
    bbqOpenDays,
    reservations,
  } = useApp();
  const { isGuest } = useAuth();
  const bbqSlides = galleryItems.filter((g) => g.showOnBbq);

  const [venue, setVenue] = useState<BBQVenue>('A동');
  const [date, setDate] = useState(todayYMD());
  const [startHour, setStartHour] = useState<number | null>(null);
  const [endHour, setEndHour] = useState<number | null>(null);
  const [capacity, setCapacity] = useState(bbqPricing.baseCapacity);
  const [modalOpen, setModalOpen] = useState(false);
  const [errorReason, setErrorReason] = useState<string | null>(null);
  const [reservedAmount, setReservedAmount] = useState(0);
  const [reservedTime, setReservedTime] = useState('');
  const [reservedVenue, setReservedVenue] = useState<BBQVenue>('A동');
  const [depositorName, setDepositorName] = useState('');
  const [depositorPhone, setDepositorPhone] = useState('');

  const courtForVenue = venueToCourt(venue);

  // Per-venue checks: BBQ conflict on same venue+date
  const existingBBQSameVenue = reservations.find(
    (r) => r.type === 'bbq' && r.date === date && r.targetId === venue && r.waitingSequence === null && r.status !== '취소',
  );
  const existingBBQOtherVenue = reservations.find(
    (r) => r.type === 'bbq' && r.date === date && r.targetId !== venue && r.waitingSequence === null && r.status !== '취소',
  );

  // Pension on same venue blocks BBQ entirely (same building)
  const hasPensionSameVenue = reservations.some(
    (r) => r.type === 'pension' && r.date === date && r.targetLabel === venue && r.waitingSequence === null && r.status !== '취소',
  );
  const hasPensionOtherVenue = reservations.some(
    (r) => r.type === 'pension' && r.date === date && r.targetLabel !== venue && r.waitingSequence === null && r.status !== '취소',
  );

  // Court reservations: only block specific hours, only for the matching court
  const courtBlockedHours = useMemo(
    () => getCourtBlockedHours(reservations, date, courtForVenue),
    [reservations, date, courtForVenue],
  );
  const hasAnyCourtOnDate = courtBlockedHours.size > 0;

  // The venue is fully blocked only by BBQ conflict or pension on same building
  const isVenueFullyBlocked = !!existingBBQSameVenue || hasPensionSameVenue;

  // Check if a time range [start, end) overlaps any court-blocked hour
  const rangeHasCourtConflict = (start: number, end: number): boolean => {
    for (let h = start; h < end; h++) {
      if (courtBlockedHours.has(h)) return true;
    }
    return false;
  };

  // Check if the currently selected time range conflicts with court
  const selectedHasCourtConflict =
    startHour !== null && endHour !== null && rangeHasCourtConflict(startHour, endHour);

  const handleSelectStart = (hour: number) => {
    if (date === todayYMD() && hour <= new Date().getHours()) return;
    setStartHour(hour);
    setEndHour(Math.min(hour + bbqPricing.baseHours, 24));
    setErrorReason(null);
  };

  const handleAddHour = () => {
    if (endHour === null || endHour >= 24) return;
    setEndHour(endHour + 1);
  };

  const handleSubHour = () => {
    if (endHour === null || startHour === null || endHour <= startHour + 1) return;
    if (endHour <= startHour + bbqPricing.baseHours) return;
    setEndHour(endHour - 1);
  };

  const priceCalc = useMemo(() => {
    if (startHour === null || endHour === null) return null;
    return computeBBQPrice(startHour, endHour, capacity, bbqPricing);
  }, [startHour, endHour, capacity, bbqPricing]);

  const handleReserve = () => {
    if (startHour === null || endHour === null) {
      setErrorReason('시간을 선택해주세요.');
      return;
    }
    if (!depositorName.trim()) {
      setErrorReason('입금자명을 입력해주세요.');
      return;
    }
    if (isGuest && !depositorPhone.trim()) {
      setErrorReason('연락처를 입력해주세요.');
      return;
    }
    const res = createBBQReservation({
      venue,
      date,
      startHour,
      endHour,
      capacity,
      depositorName: depositorName.trim(),
      depositorPhone: (isGuest ? depositorPhone.trim() : undefined) || undefined,
    });
    if (res.ok) {
      setReservedVenue(venue);
      setReservedAmount(res.reservation?.amount || 0);
      setReservedTime(`${String(startHour).padStart(2, '0')}:00 ~ ${String(endHour).padStart(2, '0')}:00`);
      setModalOpen(true);
      setErrorReason(null);
      setStartHour(null);
      setEndHour(null);
      setDepositorName('');
      setDepositorPhone('');
    } else {
      setErrorReason(res.reason || '예약에 실패했습니다.');
    }
  };

  const isHourPassed = (hour: number) => {
    if (date !== todayYMD()) return false;
    return hour <= new Date().getHours();
  };

  // Format court-blocked hours for display
  const courtBlockedRanges = useMemo(() => {
    const sorted = [...courtBlockedHours].sort((a, b) => a - b);
    const ranges: string[] = [];
    let rangeStart = -1;
    let prev = -1;
    for (const h of sorted) {
      if (rangeStart === -1) {
        rangeStart = h;
      } else if (h !== prev + 1) {
        ranges.push(`${String(rangeStart).padStart(2, '0')}:00~${String(prev + 1).padStart(2, '0')}:00`);
        rangeStart = h;
      }
      prev = h;
    }
    if (rangeStart !== -1) {
      ranges.push(`${String(rangeStart).padStart(2, '0')}:00~${String(prev + 1).padStart(2, '0')}:00`);
    }
    return ranges;
  }, [courtBlockedHours]);

  return (
    <div className="space-y-5 pb-4">
      {bbqSlides.length > 0 && <GallerySlideshow slides={bbqSlides} />}

      <div className="mb-3">
        <div className="flex items-baseline gap-2 flex-wrap">
          <h2 className="text-xl font-bold text-navy-900 flex items-center gap-1.5">
            <Flame size={22} className="text-amber-500" />
            바베큐패키지 예약
          </h2>
          <span className="text-xs font-medium text-slate-500">
            테니스코트 + 라운지 + 바베큐장 · 기본 {bbqPricing.baseHours}시간 {bbqPricing.baseCapacity}인
          </span>
        </div>
        <div className="mt-1.5 rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-2 flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-amber-800">
            데이타임 {formatWon(bbqPricing.dayPrice)} / 나이트타임 {formatWon(bbqPricing.nightPrice)}
          </span>
          <span className="text-[10px] font-semibold text-slate-500">
            · 추가 인원 1인 {formatWon(bbqPricing.extraPersonFee)} · 시간 초과 1인당 {formatWon(bbqPricing.extraHourFee)}/시간
          </span>
          <span className="text-[10px] font-semibold text-amber-600">(VAT 별도)</span>
        </div>
      </div>

      <Calendar
        value={date}
        onChange={(d) => { setDate(d); setStartHour(null); setEndHour(null); setErrorReason(null); }}
        minDate={todayYMD()}
        maxDate={addDaysYMD(bbqOpenDays)}
        dayRender={(d) => {
          const bbqRes = reservations.filter(
            (r) => r.type === 'bbq' && r.date === d && r.waitingSequence === null && r.status !== '취소',
          );
          if (bbqRes.length > 0) return <span className="w-2 h-2 rounded-full bg-amber-500" />;
          const hasPensionOrCourt = reservations.some(
            (r) =>
              r.date === d &&
              r.waitingSequence === null &&
              r.status !== '취소' &&
              (r.type === 'pension' || r.type === 'court'),
          );
          if (hasPensionOrCourt) return <span className="w-2 h-2 rounded-full bg-rose-400" />;
          return null;
        }}
      />

      <div className="rounded-2xl bg-navy-50 border border-navy-200 px-4 py-3 flex items-center gap-3 animate-slide-up">
        <CalendarIcon size={20} className="text-navy-700 shrink-0" />
        <div className="flex flex-wrap items-baseline gap-1.5">
          <span className="text-sm font-semibold text-navy-700">선택하신 예약일은</span>
          <span className="text-lg font-extrabold text-navy-900">
            {new Date(date + 'T00:00:00').toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })}
          </span>
          <span className="text-sm font-semibold text-navy-700">입니다</span>
        </div>
      </div>

      {/* Venue selector */}
      <div className="grid sm:grid-cols-2 gap-3">
        {VENUES.map((v) => {
          const isSel = venue === v.name;
          const bbqTaken = reservations.some(
            (r) => r.type === 'bbq' && r.date === date && r.targetId === v.name && r.waitingSequence === null && r.status !== '취소',
          );
          const pensionTaken = reservations.some(
            (r) => r.type === 'pension' && r.date === date && r.targetLabel === v.name && r.waitingSequence === null && r.status !== '취소',
          );
          const unavailable = bbqTaken || pensionTaken;
          return (
            <button
              key={v.name}
              onClick={() => { setVenue(v.name); setStartHour(null); setEndHour(null); setErrorReason(null); }}
              disabled={unavailable}
              className={`card p-4 text-left transition-all relative ${
                isSel ? 'ring-2 ring-amber-500 -translate-y-0.5' : unavailable ? 'opacity-40 cursor-not-allowed' : 'hover:border-navy-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${v.color} flex items-center justify-center text-white`}>
                  <Flame size={20} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-navy-900 text-lg">{v.name} 바베큐패키지</p>
                  <p className="text-xs text-slate-500">{v.desc}</p>
                </div>
                {unavailable && (
                  <span className="chip bg-rose-100 text-rose-600 text-xs">예약불가</span>
                )}
                {isSel && !unavailable && (
                  <span className="chip bg-amber-100 text-amber-700 text-xs">선택됨</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Conflict warnings */}
      {existingBBQSameVenue && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-rose-800">{venue} 바베큐패키지 예약 불가</p>
            <p className="text-sm text-rose-700 mt-0.5">
              {venue}에 이미 바베큐패키지 예약이 있습니다. 다른 동을 선택하거나 다른 날짜를 선택해주세요.
            </p>
          </div>
        </div>
      )}
      {!existingBBQSameVenue && hasPensionSameVenue && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-rose-800">{venue} 펜션 예약으로 인해 예약 불가</p>
            <p className="text-sm text-rose-700 mt-0.5">
              {venue}에 펜션 예약이 있어 바베큐패키지 예약이 불가합니다. 다른 동을 선택하거나 다른 날짜를 선택해주세요.
            </p>
          </div>
        </div>
      )}
      {!existingBBQSameVenue && !hasPensionSameVenue && hasAnyCourtOnDate && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-800">{courtForVenue} 대관 시간이 있습니다</p>
            <p className="text-sm text-amber-700 mt-0.5">
              {courtForVenue} 대관 시간({courtBlockedRanges.join(', ')})은 피해서 예약해주세요. 해당 시간이 포함되지 않으면 예약 가능합니다.
            </p>
          </div>
        </div>
      )}
      {existingBBQOtherVenue && !isVenueFullyBlocked && (
        <div className="rounded-2xl bg-sky-50 border border-sky-200 p-4 flex items-start gap-3">
          <CheckCircle2 size={20} className="text-sky-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sky-800">다른 동에 바베큐패키지 예약이 있습니다</p>
            <p className="text-sm text-sky-700 mt-0.5">
              {venue}은(는) 예약 가능합니다.
            </p>
          </div>
        </div>
      )}
      {hasPensionOtherVenue && !isVenueFullyBlocked && !hasAnyCourtOnDate && (
        <div className="rounded-2xl bg-sky-50 border border-sky-200 p-4 flex items-start gap-3">
          <CheckCircle2 size={20} className="text-sky-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sky-800">다른 동 펜션 예약이 있습니다</p>
            <p className="text-sm text-sky-700 mt-0.5">
              {venue}은(는) 예약 가능합니다.
            </p>
          </div>
        </div>
      )}

      {/* Time selection */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-navy-900">시작 시간 선택</h3>
          <span className="text-xs text-slate-500">
            {bbqPricing.dayStartHour}:00~{bbqPricing.nightStartHour}:00 데이 / {bbqPricing.nightStartHour}:00~24:00 나이트
          </span>
        </div>
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
          {HOURS.filter((h) => h < 24).map((hour) => {
            const isSel = startHour === hour;
            const tier = getBBQSlotTier(hour, bbqPricing);
            const passed = isHourPassed(hour);
            const courtBlocked = courtBlockedHours.has(hour);
            const disabled = passed || isVenueFullyBlocked || courtBlocked;
            return (
              <button
                key={hour}
                disabled={disabled}
                onClick={() => handleSelectStart(hour)}
                className={`relative rounded-xl p-2 text-sm font-bold transition-all border ${
                  isSel
                    ? 'bg-navy-900 text-white border-navy-900 shadow-navy'
                    : disabled
                      ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                      : tier === 'night'
                        ? 'bg-white text-navy-800 border-navy-200 hover:border-navy-400'
                        : 'bg-white text-amber-700 border-amber-200 hover:border-amber-400'
                }`}
              >
                <span>{String(hour).padStart(2, '0')}:00</span>
                <p className="text-[9px] font-medium mt-0.5 opacity-70">
                  {isSel ? '선택됨' : courtBlocked ? '코트' : passed ? '지남' : tier === 'night' ? '나이트' : '데이'}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Duration & capacity */}
      {startHour !== null && endHour !== null && (
        <div className="card p-5 space-y-4 animate-slide-up">
          {/* Duration */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-navy-900 flex items-center gap-1.5">
                <Clock size={16} /> 이용 시간
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSubHour}
                  disabled={endHour <= startHour + bbqPricing.baseHours || endHour >= 25}
                  className="w-8 h-8 rounded-lg bg-slate-100 text-navy-700 flex items-center justify-center hover:bg-slate-200 transition disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Minus size={14} />
                </button>
                <span className="text-lg font-extrabold text-navy-900 min-w-[120px] text-center">
                  {String(startHour).padStart(2, '0')}:00 ~ {String(endHour).padStart(2, '0')}:00
                </span>
                <button
                  onClick={handleAddHour}
                  disabled={endHour >= 24}
                  className="w-8 h-8 rounded-lg bg-slate-100 text-navy-700 flex items-center justify-center hover:bg-slate-200 transition disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              기본 {bbqPricing.baseHours}시간 · {endHour - startHour > bbqPricing.baseHours ? `초과 ${endHour - startHour - bbqPricing.baseHours}시간` : '기본 시간'}
            </p>
          </div>

          {/* Court conflict warning for selected range */}
          {selectedHasCourtConflict && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 flex items-start gap-2">
              <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
              <p className="text-sm text-rose-800">
                선택하신 시간에 {courtForVenue} 대관이 포함되어 있습니다. 코트 대관 시간({courtBlockedRanges.join(', ')})을 피해서 다시 선택해주세요.
              </p>
            </div>
          )}

          {/* Capacity */}
          <div className="border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-navy-900 flex items-center gap-1.5">
                <Users size={16} /> 인원
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCapacity((c) => Math.max(1, c - 1))}
                  className="w-8 h-8 rounded-lg bg-slate-100 text-navy-700 flex items-center justify-center hover:bg-slate-200 transition"
                >
                  <Minus size={14} />
                </button>
                <span className="text-lg font-extrabold text-navy-900 min-w-[40px] text-center">{capacity}명</span>
                <button
                  onClick={() => setCapacity((c) => Math.min(50, c + 1))}
                  className="w-8 h-8 rounded-lg bg-slate-100 text-navy-700 flex items-center justify-center hover:bg-slate-200 transition"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              기본 {bbqPricing.baseCapacity}인 · {capacity > bbqPricing.baseCapacity ? `추가 ${capacity - bbqPricing.baseCapacity}명` : '기본 인원'}
            </p>
          </div>

          {/* Price breakdown */}
          {priceCalc && !selectedHasCourtConflict && (
            <div className="border-t border-slate-100 pt-4">
              <div className="rounded-xl bg-amber-50 border border-amber-100 p-3.5 space-y-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <Wallet size={14} className="text-amber-700" />
                  <p className="text-xs font-bold text-amber-800">{venue} 요금 안내</p>
                </div>
                {priceCalc.baseHoursDay > 0 && priceCalc.baseHoursNight > 0 ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">기본 데이 {priceCalc.baseHoursDay}시간</span>
                      <span className="font-bold text-navy-900">{formatWon(priceCalc.dayBaseAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">기본 나이트 {priceCalc.baseHoursNight}시간</span>
                      <span className="font-bold text-navy-900">{formatWon(priceCalc.nightBaseAmount)}</span>
                    </div>
                  </>
                ) : priceCalc.baseHoursNight > 0 ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">기본 이용료 (나이트 {priceCalc.baseHoursNight}시간)</span>
                    <span className="font-bold text-navy-900">{formatWon(priceCalc.nightBaseAmount)}</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">기본 이용료 (데이 {priceCalc.baseHoursDay}시간)</span>
                    <span className="font-bold text-navy-900">{formatWon(priceCalc.dayBaseAmount)}</span>
                  </div>
                )}
                {priceCalc.extraHoursDay > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">데이 시간 초과 {priceCalc.extraHoursDay}시간 × {capacity}명</span>
                    <span className="font-bold text-navy-900">{formatWon(priceCalc.extraHoursDay * bbqPricing.extraHourFee * capacity)}</span>
                  </div>
                )}
                {priceCalc.extraHoursNight > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">나이트 시간 초과 {priceCalc.extraHoursNight}시간 × {capacity}명</span>
                    <span className="font-bold text-navy-900">{formatWon(priceCalc.extraHoursNight * bbqPricing.extraHourFee * capacity)}</span>
                  </div>
                )}
                {priceCalc.extraPersonAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">추가 인원</span>
                    <span className="font-bold text-navy-900">{formatWon(priceCalc.extraPersonAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-extrabold pt-2 border-t border-amber-200">
                  <span className="text-navy-900">총 금액</span>
                  <span className="text-amber-700">{formatWon(priceCalc.total)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Depositor info */}
          <div className="border-t border-slate-100 pt-4 space-y-3">
            <label className="block">
              <span className="text-xs font-semibold text-navy-600 mb-1 block">입금자명</span>
              <input
                type="text"
                value={depositorName}
                onChange={(e) => setDepositorName(e.target.value)}
                placeholder="입금자명을 입력하세요"
                maxLength={20}
                className="input py-2.5"
              />
            </label>
            {isGuest && (
              <label className="block">
                <span className="text-xs font-semibold text-navy-600 mb-1 block">연락처</span>
                <input
                  type="tel"
                  value={depositorPhone}
                  onChange={(e) => setDepositorPhone(e.target.value)}
                  placeholder="010-0000-0000"
                  className="input py-2.5"
                />
              </label>
            )}
          </div>

          {errorReason && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 flex items-start gap-2">
              <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
              <p className="text-sm text-rose-800">{errorReason}</p>
            </div>
          )}

          <button
            onClick={handleReserve}
            disabled={isVenueFullyBlocked || selectedHasCourtConflict}
            className="w-full py-3.5 rounded-xl bg-amber-500 text-white font-bold text-lg hover:bg-amber-400 transition shadow-amber disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Flame size={20} /> {venue} 바베큐패키지 예약 신청
          </button>
        </div>
      )}

      {/* Info section */}
      <div className="card p-5">
        <h3 className="font-bold text-navy-900 mb-3 flex items-center gap-1.5">
          <Flame size={18} className="text-amber-500" /> 바베큐패키지 안내
        </h3>
        <ul className="space-y-2 text-sm text-slate-600">
          <li className="flex items-start gap-2">
            <CheckCircle2 size={15} className="text-amber-500 shrink-0 mt-0.5" />
            테니스코트, 라운지, 바베큐장을 모두 이용할 수 있는 패키지 상품입니다.
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 size={15} className="text-amber-500 shrink-0 mt-0.5" />
            기본 {bbqPricing.baseHours}시간 / {bbqPricing.baseCapacity}인 기준이며, 1시간 초과 시 1인당 {formatWon(bbqPricing.extraHourFee)}이 추가됩니다.
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 size={15} className="text-amber-500 shrink-0 mt-0.5" />
            추가 인원은 1인당 {formatWon(bbqPricing.extraPersonFee)}이 추가됩니다.
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 size={15} className="text-amber-500 shrink-0 mt-0.5" />
            A동과 B동 중 선택 가능하며, 같은 동에 펜션 예약이 있으면 바베큐패키지 예약이 불가합니다.
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 size={15} className="text-amber-500 shrink-0 mt-0.5" />
            코트 대관 시간은 해당 코트와 같은 동의 바베큐패키지만 제한됩니다. 대관 시간을 피해 예약하면 가능합니다.
          </li>
        </ul>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="예약 신청 완료">
        <div className="text-center py-2">
          <div className="mx-auto w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mb-4">
            <CheckCircle2 size={28} className="text-amber-500" />
          </div>
          <p className="font-bold text-navy-900 text-lg">{reservedVenue} 바베큐패키지 예약 신청 완료</p>
          <p className="text-sm text-slate-500 mt-2">
            {date} · {reservedTime}
          </p>
          <p className="text-sm text-slate-500">{capacity}명</p>
          <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-3">
            <p className="text-xs text-slate-500">예약 금액</p>
            <p className="text-2xl font-extrabold text-amber-700">{formatWon(reservedAmount)}</p>
          </div>
          <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-3 text-left">
            <p className="text-xs font-bold text-navy-500 mb-1">입금 계좌</p>
            <p className="text-sm font-bold text-navy-900">{bankAccount.bank} {bankAccount.number}</p>
            <p className="text-sm text-navy-600">예금주: {bankAccount.holder}</p>
            <p className="text-xs text-amber-600 mt-2 font-semibold">
              입금 후 관리자 승인 시 예약이 확정됩니다.
            </p>
          </div>
          <button
            onClick={() => setModalOpen(false)}
            className="w-full mt-5 py-3 rounded-xl bg-navy-900 text-white font-bold hover:bg-navy-800 transition"
          >
            확인
          </button>
        </div>
      </Modal>
    </div>
  );
}
