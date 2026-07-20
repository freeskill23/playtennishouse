import { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  BedDouble,
  CalendarRange,
  Users,
  Wallet,
  Phone,
  Check,
  X,
  Clock,
  Layers,
} from 'lucide-react';
import { useApp } from '../../store';
import { SectionTitle, EmptyState } from '../../components/ui';
import { Modal } from '../../components/Modal';
import type { Reservation } from '../../types';

interface ReservationGroup {
  key: string;
  userId: string;
  date: string;
  targetId: string;
  targetLabel: string;
  type: Reservation['type'];
  items: Reservation[];
  totalAmount: number;
  minCreatedAt: number;
}

export function AdminApprovalScreen() {
  const {
    reservations,
    getUser,
    approveReservations,
    rejectReservation,
  } = useApp();
  const [depositModal, setDepositModal] = useState<ReservationGroup | null>(null);
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  const pendingReservations = reservations.filter(
    (r) =>
      r.status === '신청' || r.status === '입금대기' || r.status === '승인대기',
  );

  // Group reservations that were submitted together: same user + date + targetId,
  // and all items share the same status (so the group can be approved in one action).
  const reservationGroups = useMemo(() => {
    const map = new Map<string, ReservationGroup>();
    for (const r of pendingReservations) {
      const key = `${r.userId}|${r.date}|${r.targetId}|${r.type}`;
      const existing = map.get(key);
      if (existing) {
        existing.items.push(r);
        existing.totalAmount += r.amount;
        existing.minCreatedAt = Math.min(existing.minCreatedAt, r.createdAt);
      } else {
        map.set(key, {
          key,
          userId: r.userId,
          date: r.date,
          targetId: r.targetId,
          targetLabel: r.targetLabel,
          type: r.type,
          items: [r],
          totalAmount: r.amount,
          minCreatedAt: r.createdAt,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? -1 : 1;
      const aMinHour = a.items
        .map((r) => parseInt(r.timeSlot?.split(':')[0] ?? '99', 10))
        .reduce((min, h) => Math.min(min, h), 99);
      const bMinHour = b.items
        .map((r) => parseInt(r.timeSlot?.split(':')[0] ?? '99', 10))
        .reduce((min, h) => Math.min(min, h), 99);
      return aMinHour - bMinHour;
    });
  }, [pendingReservations]);

  return (
    <div className="space-y-5 pb-4">
      <SectionTitle title="승인 관리" subtitle="예약 신청을 처리하세요" />

      <div className="space-y-2">
        {reservationGroups.length === 0 ? (
          <EmptyState icon={<CheckCircle2 size={28} />} title="대기 중인 예약 신청이 없어요" />
        ) : (
          reservationGroups.map((g) => {
            const u = getUser(g.userId);
            const isGroup = g.items.length > 1;
            const allNew = g.items.every((r) => r.status === '신청');
            return (
              <div key={g.key} className="card p-4">
                <div className="flex items-start gap-3">
                  <img src={u?.profileImg} className="w-11 h-11 rounded-xl object-cover" alt="" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-navy-900">{g.items[0]?.depositorName || u?.name}</p>
                      {g.type === 'pension' && <span className="chip bg-volt-100 text-volt-800"><BedDouble size={12} /> 펜션예약</span>}
                      {g.items.some((r) => r.waitingSequence) && <span className="chip bg-amber-100 text-amber-700">대기 {g.items.find((r) => r.waitingSequence)?.waitingSequence}순위</span>}
                      {g.items.some((r) => r.matchingPostId) && <span className="chip bg-sky-100 text-sky-700"><Users size={12} /> 매칭</span>}
                      {isGroup && (
                        <span className="chip bg-navy-100 text-navy-700">
                          <Layers size={12} /> {g.items.length}건 묶음
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        {g.type === 'pension' ? <BedDouble size={12} /> : <CalendarRange size={12} />}
                        {g.targetLabel}
                      </span>
                      <span>·</span>
                      <span>{g.date}</span>
                      {g.type === 'court' && (
                        <span>· {g.items.map((r) => r.timeSlot).filter(Boolean).sort((a, b) => parseInt(a.split(':')[0], 10) - parseInt(b.split(':')[0], 10)).join(', ')}</span>
                      )}
                      {g.type === 'pension' && g.items[0].capacity && (
                        <span>· {g.items[0].capacity}명</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5 text-xs">
                      <Phone size={12} className="text-slate-400" />
                      <span className="font-semibold text-navy-700">{u?.phone || '연락처 없음'}</span>
                    </div>
                    {(() => {
                      const elapsed = Date.now() - g.minCreatedAt;
                      const isOverdue = elapsed >= 2 * 60 * 60 * 1000;
                      return (
                        <div className={`flex items-center gap-1.5 mt-1.5 text-xs ${isOverdue ? 'text-red-600 font-bold' : 'text-slate-500'}`}>
                          <Clock size={12} className={isOverdue ? 'text-red-600' : 'text-slate-400'} />
                          <span>신청 시간: {new Date(g.minCreatedAt).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      );
                    })()}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="chip bg-slate-100 text-slate-600">
                        <Wallet size={12} /> {g.totalAmount.toLocaleString()}원
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  {allNew ? (
                    <button
                      onClick={() => setDepositModal(g)}
                      className="btn-navy flex-1 text-sm py-2.5"
                    >
                      입금 확인하기{isGroup ? ` (${g.items.length}건)` : ''}
                    </button>
                  ) : (
                    <button
                      onClick={() => approveReservations(g.items.map((r) => r.id))}
                      className="btn-primary flex-1 text-sm py-2.5"
                    >
                      <Check size={16} /> 승인{isGroup ? ` (${g.items.length}건)` : ''}
                    </button>
                  )}
                  <button
                    onClick={() => g.items.forEach((r) => rejectReservation(r.id))}
                    className="btn-danger text-sm py-2.5 px-4"
                  >
                    <X size={16} /> 거절
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Deposit confirm modal */}
      <Modal
        open={!!depositModal}
        onClose={() => setDepositModal(null)}
        title="입금 확인"
        size="sm"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setDepositModal(null)}>취소</button>
            <button
              className="btn-primary"
              onClick={() => {
                if (depositModal) approveReservations(depositModal.items.map((r) => r.id));
                setDepositModal(null);
              }}
            >
              <CheckCircle2 size={16} /> 입금 확인 및 승인{depositModal && depositModal.items.length > 1 ? ` (${depositModal.items.length}건)` : ''}
            </button>
          </>
        }
      >
        {depositModal && (
          <div className="space-y-3">
            <p className="text-sm text-navy-800">
              <span className="font-bold">{depositModal.items[0]?.depositorName || getUser(depositModal.userId)?.name}</span>님의{' '}
              <span className="font-bold">{depositModal.targetLabel}</span> 예약 입금을 확인하시겠습니까?
            </p>
            <div className="rounded-xl bg-slate-50 p-3 text-sm space-y-1">
              <p>날짜: {depositModal.date}</p>
              {depositModal.type === 'court' && depositModal.items.length > 1 && (
                <p>시간: {depositModal.items.map((r) => r.timeSlot).filter(Boolean).sort((a, b) => parseInt(a.split(':')[0], 10) - parseInt(b.split(':')[0], 10)).join(', ')}</p>
              )}
              {depositModal.type === 'court' && depositModal.items.length === 1 && (
                <p>시간: {depositModal.items[0].timeSlot}</p>
              )}
              {depositModal.type === 'pension' && depositModal.items[0].capacity && (
                <p>인원: {depositModal.items[0].capacity}명</p>
              )}
              <p>예약 건수: {depositModal.items.length}건</p>
              <p>총 금액: {depositModal.totalAmount.toLocaleString()}원</p>
            </div>
            <p className="text-xs text-slate-400">승인 시 예약 상태가 '예약완료'로 변경되며, 상호 배제 규칙이 적용됩니다.</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
