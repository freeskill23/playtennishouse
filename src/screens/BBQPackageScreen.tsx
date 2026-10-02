import { useState, useMemo } from 'react';
import { Flame, Clock, Users, Wallet, AlertTriangle, CheckCircle2, Calendar as CalendarIcon, Plus, Minus } from 'lucide-react';
import { useApp } from '../store';
import { useAuth } from '../lib/auth';
import { Calendar, todayYMD, addDaysYMD } from '../components/Calendar';
import { Modal } from '../components/Modal';
import { GallerySlideshow } from '../components/GallerySlideshow';
import { computeBBQPrice, getBBQSlotTier, formatWon } from '../pricing';
import type { BBQPricing } from '../pricing';

const HOURS = Array.from({ length: 20 }, (_, i) => i + 5); // 5~24

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

  const [date, setDate] = useState(todayYMD());
  const [startHour, setStartHour] = useState<number | null>(null);
  const [endHour, setEndHour] = useState<number | null>(null);
  const [capacity, setCapacity] = useState(bbqPricing.baseCapacity);
  const [modalOpen, setModalOpen] = useState(false);
  const [errorReason, setErrorReason] = useState<string | null>(null);
  const [reservedAmount, setReservedAmount] = useState(0);
  const [reservedTime, setReservedTime] = useState('');
  const [depositorName, setDepositorName] = useState('');
  const [depositorPhone, setDepositorPhone] = useState('');

  const existingBBQ = reservations.find(
    (r) => r.type === 'bbq' && r.date === date && r.waitingSequence === null && r.status !== '취소',
  );

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
    if (existingBBQ) {
      setErrorReason('해당 날짜에 이미 바베큐패키지 예약이 있습니다.');
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
      date,
      startHour,
      endHour,
      capacity,
      depositorName: depositorName.trim(),
      depositorPhone: (isGuest ? depositorPhone.trim() : undefined) || undefined,
    });
    if (res.ok) {
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
          const hasBBQ = reservations.some(
            (r) => r.type === 'bbq' && r.date === d && r.waitingSequence === null && r.status !== '취소',
          );
          if (hasBBQ) return <span className="w-2 h-2 rounded-full bg-amber-500" />;
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

      {existingBBQ && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-rose-800">이 날짜는 예약 불가</p>
            <p className="text-sm text-rose-700 mt-0.5">
              이미 바베큐패키지 예약이 있습니다. 다른 날짜를 선택해주세요.
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
            return (
              <button
                key={hour}
                disabled={passed}
                onClick={() => handleSelectStart(hour)}
                className={`relative rounded-xl p-2 text-sm font-bold transition-all border ${
                  isSel
                    ? 'bg-navy-900 text-white border-navy-900 shadow-navy'
                    : passed
                      ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                      : tier === 'night'
                        ? 'bg-white text-navy-800 border-navy-200 hover:border-navy-400'
                        : 'bg-white text-amber-700 border-amber-200 hover:border-amber-400'
                }`}
              >
                <span>{String(hour).padStart(2, '0')}:00</span>
                <p className="text-[9px] font-medium mt-0.5 opacity-70">
                  {isSel ? '선택됨' : passed ? '지남' : tier === 'night' ? '나이트' : '데이'}
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
          {priceCalc && (
            <div className="border-t border-slate-100 pt-4">
              <div className="rounded-xl bg-amber-50 border border-amber-100 p-3.5 space-y-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <Wallet size={14} className="text-amber-700" />
                  <p className="text-xs font-bold text-amber-800">요금 안내</p>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">기본 이용료</span>
                  <span className="font-bold text-navy-900">{formatWon(priceCalc.baseAmount)}</span>
                </div>
                {priceCalc.extraHourAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">시간 초과 추가</span>
                    <span className="font-bold text-navy-900">{formatWon(priceCalc.extraHourAmount)}</span>
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
            disabled={!!existingBBQ}
            className="w-full py-3.5 rounded-xl bg-amber-500 text-white font-bold text-lg hover:bg-amber-400 transition shadow-amber disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Flame size={20} /> 바베큐패키지 예약 신청
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
            조명을 켜는 기준에 따라 데이타임과 나이트타임으로 구분됩니다. (계절에 따라 변경 가능)
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 size={15} className="text-amber-500 shrink-0 mt-0.5" />
            데이타임과 나이트타임이 겹치는 구간은 각각의 요금이 자동 계산됩니다.
          </li>
        </ul>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="예약 신청 완료">
        <div className="text-center py-2">
          <div className="mx-auto w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mb-4">
            <CheckCircle2 size={28} className="text-amber-500" />
          </div>
          <p className="font-bold text-navy-900 text-lg">바베큐패키지 예약 신청 완료</p>
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
