import { useState } from 'react';
import { CalendarRange, Wallet, Clock, AlertTriangle, CheckCircle2, Lock, Plus, Minus } from 'lucide-react';
import { useApp } from '../store';
import { Calendar, todayYMD } from '../components/Calendar';
import { Modal } from '../components/Modal';
import { SectionTitle } from '../components/ui';
import { BANK_ACCOUNT } from '../mockData';
import { COURT_SLOT_PRICE, COURT_SLOT_PRICE_PEAK, getCourtSlotPrice, formatWon } from '../pricing';
import { COURT_TIME_SLOTS } from '../types';
import type { CourtName } from '../types';

const COURTS: { name: CourtName; desc: string; color: string }[] = [
  { name: 'A코트', desc: '인조잔디, 야간조명, 락커룸, 샤워실, 정식규격사이즈', color: 'bg-volt-500' },
  { name: 'B코트', desc: '인조잔디, 야간조명, 락커룸, 샤워실, 정식규격사이즈', color: 'bg-navy-700' },
];

export function CourtScreen() {
  const {
    createCourtReservation,
    getCourtSlotStatus,
    isCourtBlockedByPension,
    currentUser,
    reservations,
    requestWaiting,
    tempHolidays,
  } = useApp();
  const [date, setDate] = useState(todayYMD());
  const [court, setCourt] = useState<CourtName>('A코트');
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [errorReason, setErrorReason] = useState<string | null>(null);

  const blockedByPension = isCourtBlockedByPension(date, court);

  const toggleSlot = (s: string) => {
    setSelectedSlots((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
    setErrorReason(null);
  };

  const handleReserve = () => {
    if (selectedSlots.length === 0) return;
    const res = createCourtReservation({ court, date, timeSlots: selectedSlots });
    if (res.ok) {
      setModalOpen(true);
      setSelectedSlots([]);
      setErrorReason(null);
    } else {
      setErrorReason(res.reason || '예약에 실패했습니다.');
    }
  };

  const handleWaiting = () => {
    const existing = reservations.find(
      (r) =>
        r.type === 'court' &&
        r.date === date &&
        r.targetId === court &&
        r.timeSlot === selectedSlots[0] &&
        r.waitingSequence === null &&
        r.status !== '취소',
    );
    if (existing) {
      requestWaiting(existing.id);
    }
  };

  const sortedSlots = [...selectedSlots].sort();
  const totalAmount = selectedSlots.reduce((sum, slot) => sum + getCourtSlotPrice(date, slot, tempHolidays), 0);

  return (
    <div className="space-y-5 pb-4">
      <SectionTitle
        title="코트 예약"
        subtitle="1시간 단위 · 05:00 ~ 24:00 · 여러 시간대 선택 가능"
        right={
          <div className="flex flex-col items-end gap-1">
            <span className="chip bg-navy-50 text-navy-700">
              <CalendarRange size={14} /> 평일 주간 {formatWon(COURT_SLOT_PRICE)}
            </span>
            <span className="chip bg-amber-50 text-amber-700">
              <Clock size={14} /> 야간·주말·공휴일 {formatWon(COURT_SLOT_PRICE_PEAK)}
            </span>
          </div>
        }
      />

      <Calendar
        value={date}
        onChange={setDate}
        minDate={todayYMD()}
        dayRender={(d) => {
          const aBooked = COURT_TIME_SLOTS.some((s) => getCourtSlotStatus(d, 'A코트', s) === 'booked');
          const bBooked = COURT_TIME_SLOTS.some((s) => getCourtSlotStatus(d, 'B코트', s) === 'booked');
          if (aBooked || bBooked) return <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />;
          const aPending = COURT_TIME_SLOTS.some((s) => getCourtSlotStatus(d, 'A코트', s) === 'pending');
          if (aPending) return <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />;
          return <span className="w-1.5 h-1.5 rounded-full bg-volt-400" />;
        }}
      />

      {/* Court selector */}
      <div className="grid sm:grid-cols-2 gap-3">
        {COURTS.map((c) => {
          const isSel = court === c.name;
          return (
            <button
              key={c.name}
              onClick={() => { setCourt(c.name); setSelectedSlots([]); setErrorReason(null); }}
              className={`card p-4 text-left transition-all ${
                isSel ? 'ring-2 ring-volt-500 -translate-y-0.5' : 'hover:border-navy-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${c.color} flex items-center justify-center text-white`}>
                  <CalendarRange size={20} />
                </div>
                <div>
                  <p className="font-bold text-navy-900 text-lg">{c.name}</p>
                  <p className="text-xs text-slate-500">{c.desc}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {blockedByPension && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-800">해당 날짜 펜션 예약 완료</p>
            <p className="text-sm text-amber-700 mt-0.5">
              이 날짜에는 펜션 예약이 완료되어 모든 코트 시간대 이용이 불가합니다.
            </p>
          </div>
        </div>
      )}

      {/* Time slots */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <SectionTitle title="시간대 선택" subtitle={`${court} · 1시간 단위 · 복수 선택`} />
          {selectedSlots.length > 0 && (
            <button
              onClick={() => setSelectedSlots([])}
              className="text-xs font-bold text-slate-400 hover:text-rose-500 transition"
            >
              선택 해제
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {COURT_TIME_SLOTS.map((s) => {
            const status = getCourtSlotStatus(date, court, s);
            const isSel = selectedSlots.includes(s);
            const disabled = status !== 'available';
            return (
              <button
                key={s}
                disabled={disabled}
                onClick={() => toggleSlot(s)}
                className={`relative rounded-xl p-3 text-sm font-bold transition-all border ${
                  isSel
                    ? 'bg-navy-900 text-white border-navy-900 shadow-navy'
                    : status === 'available'
                      ? 'bg-white text-navy-800 border-slate-200 hover:border-volt-400 hover:bg-volt-50'
                      : status === 'blocked'
                        ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{s}</span>
                  {isSel ? (
                    <Minus size={13} />
                  ) : status === 'booked' ? (
                    <Lock size={13} />
                  ) : status === 'pending' ? (
                    <Clock size={13} />
                  ) : (
                    <Plus size={13} className="opacity-40" />
                  )}
                </div>
                <p className="text-[10px] font-medium mt-0.5 opacity-70">
                  {isSel
                    ? '선택됨'
                    : status === 'available'
                      ? '예약가능'
                      : status === 'booked'
                        ? '예약완료'
                        : status === 'pending'
                          ? '신청중'
                          : '펜션전용'}
                </p>
              </button>
            );
          })}
        </div>

        {errorReason && (
          <div className="mt-4 rounded-xl bg-rose-50 border border-rose-200 p-3.5 flex items-start gap-2 animate-slide-up">
            <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
            <p className="text-sm text-rose-800">{errorReason}</p>
          </div>
        )}

        {sortedSlots.length > 0 && !blockedByPension && (
          <div className="mt-4 space-y-2 animate-slide-up">
            <div className="rounded-xl bg-navy-50 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-bold text-navy-900">{court}</p>
                <p className="text-xs text-slate-500">{date}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {sortedSlots.map((s) => (
                  <span key={s} className="chip bg-white text-navy-800 border border-navy-100">
                    <Clock size={11} /> {s}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-navy-100">
                <p className="text-xs text-slate-500">총 {selectedSlots.length}시간대</p>
                <p className="font-extrabold text-navy-900">{formatWon(totalAmount)}</p>
              </div>
            </div>
            <button onClick={handleReserve} className="btn-primary w-full py-3 text-base">
              <Wallet size={18} /> 입금 신청하기 ({formatWon(totalAmount)})
            </button>
          </div>
        )}

        {/* Waiting for booked/pending slot */}
        {selectedSlots.length === 1 && (getCourtSlotStatus(date, court, selectedSlots[0]) === 'booked' || getCourtSlotStatus(date, court, selectedSlots[0]) === 'pending') && !blockedByPension && (
          <div className="mt-4 space-y-2 animate-slide-up">
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 flex items-start gap-2">
              <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                이미 예약된 시간대입니다. 대기 신청을 통해 취소 시 우선권을 받을 수 있습니다.
              </p>
            </div>
            <button onClick={handleWaiting} className="btn-navy w-full">
              <Clock size={18} /> 예약 대기 신청하기
            </button>
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="입금 안내"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setModalOpen(false)}>
              닫기
            </button>
            <button className="btn-primary" onClick={() => setModalOpen(false)}>
              <CheckCircle2 size={18} /> 확인
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-2xl bg-volt-50 border border-volt-200 p-4">
            <p className="text-sm text-volt-800 font-semibold mb-2">입금 계좌</p>
            <p className="text-lg font-bold text-navy-900">{BANK_ACCOUNT.bank}</p>
            <p className="text-xl font-extrabold text-navy-900 tracking-wider">{BANK_ACCOUNT.number}</p>
            <p className="text-sm text-slate-500 mt-1">예금주: {BANK_ACCOUNT.holder}</p>
          </div>
          <div className="text-sm text-slate-600 space-y-2">
            <p><span className="font-bold text-navy-800">예약자:</span> {currentUser.name} ({currentUser.phone})</p>
            <p><span className="font-bold text-navy-800">코트:</span> {court}</p>
            <div>
              <p className="font-bold text-navy-800">시간대:</p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {sortedSlots.map((s) => (
                  <span key={s} className="chip bg-navy-50 text-navy-700">{s}</span>
                ))}
              </div>
            </div>
            <p><span className="font-bold text-navy-800">날짜:</span> {date}</p>
            <p><span className="font-bold text-navy-800">금액:</span> {formatWon(totalAmount)}</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
