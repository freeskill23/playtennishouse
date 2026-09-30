import { useState } from 'react';
import { BedDouble, Users, Wallet, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
// Clock still used for waiting count indicator on room cards
import { useApp } from '../store';
import { useAuth } from '../lib/auth';
import { Calendar, todayYMD, endOfMonthPlusN } from '../components/Calendar';
import { Modal } from '../components/Modal';
import { SectionTitle } from '../components/ui';
import { GallerySlideshow } from '../components/GallerySlideshow';
import { formatWon } from '../pricing';
import { EXTRA_PERSON_FEE } from '../store';
import type { RoomName } from '../types';

export function PensionScreen() {
  const {
    rooms,
    getPensionStatusForDate,
    createPensionReservation,
    isPensionBlockedByCourt,
    currentUser,
    getPensionPrice,
    pensionWeekdayPrice,
    pensionWeekendPrice,
    bankAccount,
    galleryItems,
    pensionOpenMonths,
    pushToast,
  } = useApp();
  const { isGuest } = useAuth();
  const pensionSlides = galleryItems.filter((g) => g.showOnPension);
  const [date, setDate] = useState(todayYMD());
  const [selectedRoom, setSelectedRoom] = useState<RoomName | null>(null);
  const [capacity, setCapacity] = useState(4);
  const selectedRoomData = rooms.find((r) => r.name === selectedRoom);
  const baseCapacity = selectedRoomData?.baseCapacity ?? 4;
  const extraPersons = Math.max(0, capacity - baseCapacity);
  const extraFee = extraPersons * EXTRA_PERSON_FEE;
  const totalPrice = getPensionPrice(date) + extraFee;
  const [modalOpen, setModalOpen] = useState(false);
  const [depositorName, setDepositorName] = useState('');
  const [depositorPhone, setDepositorPhone] = useState('');

  const roomBlocked = (name: RoomName) => isPensionBlockedByCourt(date, name);
  const roomStatus = selectedRoom
    ? getPensionStatusForDate(date, selectedRoom)
    : null;
  const selectedBlocked = selectedRoom ? roomBlocked(selectedRoom) : false;

  const handleReserve = () => {
    if (!selectedRoom) return;
    if (!depositorName.trim()) {
      pushToast('입금자명을 입력해주세요.');
      return;
    }
    const room = rooms.find((r) => r.name === selectedRoom);
    if (!room) return;
    const res = createPensionReservation({ roomId: room.id, date, capacity, depositorName: depositorName.trim(), depositorPhone: (isGuest ? depositorPhone.trim() : undefined) || undefined });
    if (!res.ok) {
      return;
    }
    setModalOpen(true);
    setDepositorName('');
    setDepositorPhone('');
  };

  return (
    <div className="space-y-5 pb-4">
      {pensionSlides.length > 0 && <GallerySlideshow slides={pensionSlides} />}
      <div className="mb-3">
        <div className="flex items-baseline gap-2">
          <h2 className="text-xl font-bold text-navy-900">펜션 예약</h2>
          <span className="text-xs font-medium text-slate-500">체크인 오후 3시 · 체크아웃 익일 오전 11시</span>
        </div>
        <div className="mt-1.5 rounded-xl bg-volt-50 border border-volt-200 px-3.5 py-2 flex items-center gap-1.5">
          <BedDouble size={14} className="text-volt-700" />
          <span className="text-xs font-semibold text-volt-800">
            이용료 {formatWon(pensionWeekdayPrice)}~{formatWon(pensionWeekendPrice)}
          </span>
          <span className="text-[10px] font-semibold text-amber-600">(VAT 별도)</span>
        </div>
      </div>

      {(roomBlocked('A동') || roomBlocked('B동')) && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-800">해당 날짜 코트 예약 완료</p>
            <p className="text-sm text-amber-700 mt-0.5">
              {roomBlocked('A동') && roomBlocked('B동')
                ? 'A코트·B코트 모두 예약되어 A동·B동 펜션 모두 예약이 불가능합니다.'
                : roomBlocked('A동')
                  ? 'A코트 예약으로 A동 펜션이 불가능합니다. B동을 이용해주세요.'
                  : 'B코트 예약으로 B동 펜션이 불가능합니다. A동을 이용해주세요.'}{' '}
              다른 날짜를 선택해주세요.
            </p>
          </div>
        </div>
      )}

      <Calendar
        value={date}
        onChange={setDate}
        minDate={todayYMD()}
        maxDate={endOfMonthPlusN(pensionOpenMonths - 1)}
        dayRender={(d) => {
          const a = getPensionStatusForDate(d, 'A동');
          const b = getPensionStatusForDate(d, 'B동');
          const aBooked = a.status === 'booked' || isPensionBlockedByCourt(d, 'A동');
          const bBooked = b.status === 'booked' || isPensionBlockedByCourt(d, 'B동');
          if (aBooked && bBooked)
            return <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />;
          if (aBooked || bBooked)
            return <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />;
          if (a.status === 'available' || b.status === 'available')
            return <span className="w-1.5 h-1.5 rounded-full bg-volt-400" />;
          return null;
        }}
      />

      <div className="rounded-2xl bg-navy-50 border border-navy-200 px-4 py-3 flex items-center gap-3 animate-slide-up">
        <BedDouble size={20} className="text-navy-700 shrink-0" />
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm font-semibold text-navy-700">선택하신 예약일은</span>
          <span className="text-lg font-extrabold text-navy-900">
            {new Date(date + 'T00:00:00').toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })}
          </span>
          <span className="text-sm font-semibold text-navy-700">입니다</span>
        </div>
      </div>

      {/* Room selection */}
      <div className="grid sm:grid-cols-2 gap-3">
        {rooms.map((room) => {
          const isSel = selectedRoom === room.name;
          const st = getPensionStatusForDate(date, room.name);
          const blocked = roomBlocked(room.name);
          const unavailable = blocked || st.status === 'booked';
          return (
            <button
              key={room.id}
              onClick={() => setSelectedRoom(room.name)}
              disabled={unavailable}
              className={`card p-5 text-left transition-all ${
                isSel
                  ? 'ring-2 ring-volt-500 -translate-y-0.5'
                  : 'hover:border-navy-200'
              } ${unavailable ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-volt-100 flex items-center justify-center text-volt-700">
                      <BedDouble size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-navy-900 text-lg">{room.name}</p>
                      <p className="text-xs text-slate-500">기준 {room.baseCapacity || 4}명 (최대 {room.maxCapacity}명)</p>
                    </div>
                  </div>
                </div>
                {st.status === 'booked' && (
                  <span className="chip bg-rose-100 text-rose-600">예약완료</span>
                )}
                {st.status === 'pending' && (
                  <span className="chip bg-amber-100 text-amber-700">신청중</span>
                )}
                {st.status === 'full' && (
                  <span className="chip bg-slate-100 text-slate-600">대기마감</span>
                )}
                {st.status === 'available' && (
                  blocked ? (
                    <span className="chip bg-slate-200 text-slate-500">코트 예약 불가</span>
                  ) : (
                    <span className="chip bg-volt-100 text-volt-800">예약가능</span>
                  )
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
      {selectedRoom && !selectedBlocked && roomStatus?.status !== 'booked' && (
        <div className="card p-5 space-y-4 animate-slide-up">
          <div>
            <label className="label">이용 인원 <span className="text-xs font-normal text-slate-400">(기준 {baseCapacity}명)</span></label>
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
                onClick={() => setCapacity((c) => Math.min(selectedRoomData?.maxCapacity ?? 8, c + 1))}
                className="w-10 h-10 rounded-xl bg-slate-100 text-navy-800 font-bold hover:bg-slate-200 transition"
              >
                +
              </button>
            </div>
            {extraPersons > 0 && (
              <p className="text-xs text-amber-600 font-semibold mt-2">
                기준인원 초과 {extraPersons}명 · 추가 요금 {formatWon(extraFee)}
              </p>
            )}
          </div>

          {roomStatus?.status === 'booked' || roomStatus?.status === 'pending' ? (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 flex items-start gap-2">
              <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                {roomStatus.status === 'booked'
                  ? '이미 예약완료된 객실입니다. 다른 날짜나 다른 객실을 선택해주세요.'
                  : '신청 중인 객실입니다. 다른 날짜나 다른 객실을 선택해주세요.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {extraPersons > 0 && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-start gap-2">
                  <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 font-semibold leading-relaxed">
                    기준인원({baseCapacity}명)을 초과하여 인원 추가 시 1명당 {formatWon(EXTRA_PERSON_FEE)}의 추가 요금이 발생합니다.
                    현재 추가 인원 {extraPersons}명 · 추가 요금 {formatWon(extraFee)}
                  </p>
                </div>
              )}
              <div className="rounded-xl bg-navy-50 border border-navy-200 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-navy-600">기본 요금</span>
                  <span className="text-sm font-bold text-navy-900">{formatWon(getPensionPrice(date))}</span>
                </div>
                {extraFee > 0 && (
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs font-semibold text-amber-600">인원 추가 ({extraPersons}명)</span>
                    <span className="text-sm font-bold text-amber-600">+{formatWon(extraFee)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-navy-200">
                  <span className="text-sm font-bold text-navy-800">총 금액</span>
                  <span className="text-lg font-extrabold text-navy-900">{formatWon(totalPrice)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <input
                  type="text"
                  value={depositorName}
                  onChange={(e) => setDepositorName(e.target.value)}
                  placeholder="입금자명"
                  className={`input py-2.5 transition-all ${
                    depositorName.trim()
                      ? 'border-2 border-volt-500 ring-2 ring-volt-200 font-bold'
                      : 'input-blink'
                  }`}
                  maxLength={20}
                />
                {isGuest && (
                  <input
                    type="tel"
                    value={depositorPhone}
                    onChange={(e) => setDepositorPhone(e.target.value)}
                    placeholder="연락처 (예: 010-1234-5678)"
                    className="input py-2.5"
                    maxLength={20}
                  />
                )}
              </div>
              <button onClick={handleReserve} disabled={!depositorName.trim()} className="btn-primary w-full py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed">
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
              {formatWon(totalPrice)}
              {extraFee > 0 && (
                <span className="text-xs text-amber-600 ml-1">(기본 {formatWon(getPensionPrice(date))} + 인원추가 {formatWon(extraFee)})</span>
              )}
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
