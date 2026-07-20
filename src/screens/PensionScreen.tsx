import { useState } from 'react';
import { BedDouble, Users, Wallet, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useApp } from '../store';
import { useAuth } from '../lib/auth';
import { Calendar, todayYMD, addMonthsYMD } from '../components/Calendar';
import { Modal } from '../components/Modal';
import { SectionTitle } from '../components/ui';
import { formatWon } from '../pricing';
import type { RoomName } from '../types';

export function PensionScreen() {
  const {
    rooms,
    getPensionStatusForDate,
    createPensionReservation,
    requestWaiting,
    isPensionBlockedByCourt,
    currentUser,
    getPensionPrice,
    pensionWeekdayPrice,
    pensionWeekendPrice,
    bankAccount,
  } = useApp();
  const { isGuest } = useAuth();
  const [date, setDate] = useState(todayYMD());
  const [selectedRoom, setSelectedRoom] = useState<RoomName | null>(null);
  const [capacity, setCapacity] = useState(4);
  const [modalOpen, setModalOpen] = useState(false);
  const [waitingTarget, setWaitingTarget] = useState<string | null>(null);
  const [depositorName, setDepositorName] = useState('');
  const [depositorPhone, setDepositorPhone] = useState('');

  const blockedByCourt = isPensionBlockedByCourt(date);
  const roomStatus = selectedRoom
    ? getPensionStatusForDate(date, selectedRoom)
    : null;

  const handleReserve = () => {
    if (!selectedRoom) return;
    if (isGuest && !depositorName.trim()) {
      pushToast('예약자(입금자명)를 입력해주세요.');
      return;
    }
    if (isGuest && !depositorPhone.trim()) {
      pushToast('연락처를 입력해주세요.');
      return;
    }
    const room = rooms.find((r) => r.name === selectedRoom);
    if (!room) return;
    const res = createPensionReservation({ roomId: room.id, date, capacity, depositorName: depositorName.trim() || undefined, depositorPhone: depositorPhone.trim() || undefined });
    if (!res.ok) {
      return;
    }
    setModalOpen(true);
    setDepositorName('');
    setDepositorPhone('');
  };

  const handleWaiting = () => {
    if (!waitingTarget) return;
    requestWaiting(waitingTarget);
    setWaitingTarget(null);
  };

  return (
    <div className="space-y-5 pb-4">
      <SectionTitle
        title="펜션 예약"
        subtitle="A동 · B동 중 원하는 객실을 선택하세요"
        right={
          <span className="chip bg-volt-100 text-volt-800">
            <BedDouble size={14} /> 평일 {formatWon(pensionWeekdayPrice)} / 주말·공휴일 {formatWon(pensionWeekendPrice)}
          </span>
        }
      />

      {blockedByCourt && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-800">해당 날짜 코트 예약 완료</p>
            <p className="text-sm text-amber-700 mt-0.5">
              이 날짜에는 코트 예약이 이미 완료되어 펜션 예약이 불가능합니다. 다른 날짜를 선택해주세요.
            </p>
          </div>
        </div>
      )}

      <Calendar
        value={date}
        onChange={setDate}
        minDate={todayYMD()}
        maxDate={addMonthsYMD(5)}
        dayRender={(d) => {
          const a = getPensionStatusForDate(d, 'A동');
          const b = getPensionStatusForDate(d, 'B동');
          const aBooked = a.status === 'booked';
          const bBooked = b.status === 'booked';
          if (aBooked && bBooked)
            return <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />;
          if (aBooked || bBooked)
            return <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />;
          if (a.status === 'available' || b.status === 'available')
            return <span className="w-1.5 h-1.5 rounded-full bg-volt-400" />;
          return null;
        }}
      />

      {/* Room selection */}
      <div className="grid sm:grid-cols-2 gap-3">
        {rooms.map((room) => {
          const isSel = selectedRoom === room.name;
          const st = getPensionStatusForDate(date, room.name);
          return (
            <button
              key={room.id}
              onClick={() => setSelectedRoom(room.name)}
              disabled={blockedByCourt}
              className={`card p-5 text-left transition-all ${
                isSel
                  ? 'ring-2 ring-volt-500 -translate-y-0.5'
                  : 'hover:border-navy-200'
              } ${blockedByCourt ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-volt-100 flex items-center justify-center text-volt-700">
                      <BedDouble size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-navy-900 text-lg">{room.name}</p>
                      <p className="text-xs text-slate-500">최대 {room.maxCapacity}명</p>
                    </div>
                  </div>
                </div>
                {st.status === 'booked' && (
                  <span className="chip bg-rose-100 text-rose-600">예약완료</span>
                )}
                {st.status === 'pending' && (
                  <span className="chip bg-amber-100 text-amber-700">신청중</span>
                )}
                {st.status === 'available' && (
                  <span className="chip bg-volt-100 text-volt-800">예약가능</span>
                )}
              </div>
              <p className="text-sm text-slate-600 mt-3">{room.description}</p>
              <p className="mt-3 font-bold text-navy-900">
                {formatWon(getPensionPrice(date))}
                <span className="text-xs font-normal text-slate-400"> / 1박</span>
              </p>
              {st.waitingCount > 0 && (
                <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                  <Clock size={12} /> 대기 {st.waitingCount}명
                </p>
              )}
            </button>
          );
        })}
      </div>

      {/* Capacity + action */}
      {selectedRoom && !blockedByCourt && (
        <div className="card p-5 space-y-4 animate-slide-up">
          <div>
            <label className="label">이용 인원</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCapacity((c) => Math.max(1, c - 1))}
                className="w-10 h-10 rounded-xl bg-slate-100 text-navy-800 font-bold hover:bg-slate-200 transition"
              >
                -
              </button>
              <div className="flex items-center gap-2 flex-1 justify-center">
                <Users size={18} className="text-navy-600" />
                <span className="text-2xl font-extrabold text-navy-900">{capacity}</span>
                <span className="text-sm text-slate-400">명</span>
              </div>
              <button
                onClick={() => setCapacity((c) => Math.min(8, c + 1))}
                className="w-10 h-10 rounded-xl bg-slate-100 text-navy-800 font-bold hover:bg-slate-200 transition"
              >
                +
              </button>
            </div>
          </div>

          {roomStatus?.status === 'booked' || roomStatus?.status === 'pending' ? (
            <div className="space-y-3">
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 flex items-start gap-2">
                <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  {roomStatus.status === 'booked'
                    ? '이미 예약완료된 객실입니다. 대기 신청을 통해 취소 시 우선권을 받을 수 있습니다.'
                    : '신청 중인 객실입니다. 대기 신청을 통해 대기자 명단에 등록됩니다.'}
                </p>
              </div>
              <button
                onClick={() => {
                  if (roomStatus?.reservation) {
                    setWaitingTarget(roomStatus.reservation.id);
                    handleWaiting();
                  }
                }}
                className="btn-navy w-full"
              >
                <Clock size={18} /> 예약 대기 신청하기
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {isGuest && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={depositorName}
                    onChange={(e) => setDepositorName(e.target.value)}
                    placeholder="예약자(입금자명)"
                    className="input py-2.5"
                    maxLength={20}
                  />
                  <input
                    type="tel"
                    value={depositorPhone}
                    onChange={(e) => setDepositorPhone(e.target.value)}
                    placeholder="연락처 (예: 010-1234-5678)"
                    className="input py-2.5"
                    maxLength={20}
                  />
                </div>
              )}
              <button onClick={handleReserve} className="btn-primary w-full py-3 text-base">
                <Wallet size={18} /> 입금 신청하기
              </button>
            </div>
          )}
        </div>
      )}

      {/* Account info modal */}
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
            <p className="text-lg font-bold text-navy-900">{bankAccount.bank}</p>
            <p className="text-xl font-extrabold text-navy-900 tracking-wider">{bankAccount.number}</p>
            <p className="text-sm text-slate-500 mt-1">예금주: {bankAccount.holder}</p>
          </div>
          <div className="text-sm text-slate-600 space-y-2">
            <p>
              <span className="font-bold text-navy-800">예약자:</span> {depositorName || currentUser.name}{(depositorPhone || currentUser.phone) ? ` (${depositorPhone || currentUser.phone})` : ''}
            </p>
            <p>
              <span className="font-bold text-navy-800">객실:</span> {selectedRoom} · {capacity}명
            </p>
            <p>
              <span className="font-bold text-navy-800">날짜:</span> {date}
            </p>
            <p>
              <span className="font-bold text-navy-800">금액:</span>{' '}
              {formatWon(getPensionPrice(date))}
            </p>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            * 입금 후 관리자 확인이 완료되면 '예약완료' 상태로 변경됩니다. 입금 확인은 1시간 내 처리됩니다.
          </p>
        </div>
      </Modal>
    </div>
  );
}
