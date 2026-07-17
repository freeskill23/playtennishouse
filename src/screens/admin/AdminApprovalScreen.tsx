import { useState } from 'react';
import {
  CheckCircle2,
  BedDouble,
  CalendarRange,
  Users,
  Wallet,
  Phone,
  Check,
  X,
} from 'lucide-react';
import { useApp } from '../../store';
import { SectionTitle, StatusBadge, EmptyState } from '../../components/ui';
import { Modal } from '../../components/Modal';
import type { Reservation, MatchingPost } from '../../types';

type Tab = 'reservations' | 'matchings';

export function AdminApprovalScreen() {
  const {
    reservations,
    matchingPosts,
    getUser,
    approveReservation,
    rejectReservation,
    approveMatchingApplication,
  } = useApp();
  const [tab, setTab] = useState<Tab>('reservations');
  const [depositModal, setDepositModal] = useState<Reservation | null>(null);
  const [matchingModal, setMatchingModal] = useState<MatchingPost | null>(null);

  const pendingReservations = reservations.filter(
    (r) =>
      r.status === '신청' || r.status === '입금대기' || r.status === '승인대기',
  );
  const pendingMatchings = matchingPosts.filter((m) =>
    m.applications.some((a) => a.status === '대기'),
  );

  return (
    <div className="space-y-5 pb-4">
      <SectionTitle title="승인 관리" subtitle="예약 및 매칭 신청을 처리하세요" />

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('reservations')}
          className={`chip transition ${tab === 'reservations' ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-600'}`}
        >
          예약 신청 ({pendingReservations.length})
        </button>
        <button
          onClick={() => setTab('matchings')}
          className={`chip transition ${tab === 'matchings' ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-600'}`}
        >
          매칭 신청 ({pendingMatchings.length})
        </button>
      </div>

      {tab === 'reservations' && (
        <div className="space-y-2">
          {pendingReservations.length === 0 ? (
            <EmptyState icon={<CheckCircle2 size={28} />} title="대기 중인 예약 신청이 없어요" />
          ) : (
            pendingReservations.map((r) => {
              const u = getUser(r.userId);
              return (
                <div key={r.id} className="card p-4">
                  <div className="flex items-start gap-3">
                    <img src={u?.profileImg} className="w-11 h-11 rounded-xl object-cover" alt="" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-navy-900">{u?.name}</p>
                        {r.waitingSequence && <span className="chip bg-amber-100 text-amber-700">대기 {r.waitingSequence}순위</span>}
                        {r.matchingPostId && <span className="chip bg-volt-100 text-volt-800"><Users size={12} /> 매칭</span>}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          {r.type === 'pension' ? <BedDouble size={12} /> : <CalendarRange size={12} />}
                          {r.targetLabel}
                        </span>
                        <span>·</span>
                        <span>{r.date}</span>
                        {r.timeSlot && <span>· {r.timeSlot}</span>}
                        {r.capacity && <span>· {r.capacity}명</span>}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5 text-xs">
                        <Phone size={12} className="text-slate-400" />
                        <span className="font-semibold text-navy-700">{u?.phone || '연락처 없음'}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <StatusBadge status={r.status} />
                        <span className="chip bg-slate-100 text-slate-600">
                          <Wallet size={12} /> {r.amount.toLocaleString()}원
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    {r.status === '신청' ? (
                      <button
                        onClick={() => setDepositModal(r)}
                        className="btn-navy flex-1 text-sm py-2.5"
                      >
                        입금 확인하기
                      </button>
                    ) : (
                      <button
                        onClick={() => approveReservation(r.id)}
                        className="btn-primary flex-1 text-sm py-2.5"
                      >
                        <Check size={16} /> 승인 (예약완료)
                      </button>
                    )}
                    <button
                      onClick={() => rejectReservation(r.id)}
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
      )}

      {tab === 'matchings' && (
        <div className="space-y-2">
          {pendingMatchings.length === 0 ? (
            <EmptyState icon={<Users size={28} />} title="대기 중인 매칭 신청이 없어요" />
          ) : (
            pendingMatchings.map((m) => {
              const pendingApps = m.applications.filter((a) => a.status === '대기');
              const host = getUser(m.userId);
              return (
                <div key={m.id} className="card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <img src={host?.profileImg} className="w-9 h-9 rounded-lg object-cover" alt="" />
                    <div className="flex-1">
                      <p className="font-bold text-navy-900 text-sm">{host?.name}님 매칭</p>
                      <p className="text-xs text-slate-500">{m.court} · {m.date} {m.time}</p>
                    </div>
                    <span className="chip bg-sky-100 text-sky-700">{pendingApps.length}명 대기</span>
                  </div>
                  <button
                    onClick={() => setMatchingModal(m)}
                    className="btn-outline w-full text-sm py-2.5"
                  >
                    신청자 관리하기
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

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
                if (depositModal) approveReservation(depositModal.id);
                setDepositModal(null);
              }}
            >
              <CheckCircle2 size={16} /> 입금 확인 및 승인
            </button>
          </>
        }
      >
        {depositModal && (
          <div className="space-y-3">
            <p className="text-sm text-navy-800">
              <span className="font-bold">{getUser(depositModal.userId)?.name}</span>님의{' '}
              <span className="font-bold">{depositModal.targetLabel}</span> 예약 입금을 확인하시겠습니까?
            </p>
            <div className="rounded-xl bg-slate-50 p-3 text-sm space-y-1">
              <p>날짜: {depositModal.date}</p>
              {depositModal.timeSlot && <p>시간: {depositModal.timeSlot}</p>}
              {depositModal.capacity && <p>인원: {depositModal.capacity}명</p>}
              <p>금액: {depositModal.amount.toLocaleString()}원</p>
            </div>
            <p className="text-xs text-slate-400">승인 시 예약 상태가 '예약완료'로 변경되며, 상호 배제 규칙이 적용됩니다.</p>
          </div>
        )}
      </Modal>

      {/* Matching applications modal */}
      <Modal
        open={!!matchingModal}
        onClose={() => setMatchingModal(null)}
        title="매칭 신청자 관리"
      >
        {matchingModal && (
          <div className="space-y-3">
            <div className="rounded-xl bg-navy-50 p-3">
              <p className="font-bold text-navy-900 text-sm">{matchingModal.court} · {matchingModal.date} {matchingModal.time}</p>
              <p className="text-xs text-slate-500 mt-0.5">{matchingModal.description}</p>
            </div>
            <div className="space-y-2">
              {matchingModal.applications.filter((a) => a.status === '대기').map((app) => {
                const u = getUser(app.userId);
                return (
                  <div key={app.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                    <img src={u?.profileImg} className="w-10 h-10 rounded-lg object-cover" alt="" />
                    <div className="flex-1">
                      <p className="font-bold text-navy-900 text-sm">{u?.name}</p>
                      <p className="text-xs text-slate-500">NTRP {u?.ntrp} · {u?.career} · {u?.phone}{app.gender ? ` · ${app.gender === 'male' ? '남성' : '여성'}` : ''}</p>
                    </div>
                    <button
                      onClick={() => {
                        approveMatchingApplication(matchingModal.id, app.id);
                        setMatchingModal(null);
                      }}
                      className="btn-primary text-sm py-1.5 px-3"
                    >
                      <Check size={14} /> 승인
                    </button>
                  </div>
                );
              })}
              {matchingModal.applications.filter((a) => a.status === '승인').length > 0 && (
                <div className="pt-2">
                  <p className="text-xs font-bold text-volt-700 mb-1.5">승인된 신청자</p>
                  {matchingModal.applications.filter((a) => a.status === '승인').map((app) => {
                    const u = getUser(app.userId);
                    return (
                      <div key={app.id} className="flex items-center gap-2 rounded-lg bg-volt-50 px-3 py-2 mb-1">
                        <CheckCircle2 size={14} className="text-volt-600" />
                        <span className="text-sm font-semibold text-navy-900">{u?.name}</span>
                        <Phone size={12} className="text-slate-400 ml-auto" />
                        <span className="text-xs text-slate-500">{u?.phone}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
