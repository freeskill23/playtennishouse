import { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Calendar,
  Clock,
  MapPin,
  Filter,
  Phone,
  CheckCircle2,
  UserPlus,
  MessageSquare,
  Hand,
  UserCircle,
  User,
  Plus,
  X,
  Wallet,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../store';
import { SectionTitle, EmptyState, Pill } from '../components/ui';
import { Modal } from '../components/Modal';
import { Calendar as CalendarPicker, todayYMD } from '../components/Calendar';
import { BANK_ACCOUNT } from '../mockData';
import { COURT_TIME_SLOTS, MATCHING_MAX_PLAYERS } from '../types';
import { COURT_SLOT_PRICE, COURT_SLOT_PRICE_PEAK, getCourtSlotPrice, formatWon } from '../pricing';
import type { MatchingPost, CourtName, NTRP, GameType, GenderRequirement, ApplicantGender } from '../types';

const NTRP_OPTIONS: (NTRP | 'any')[] = ['any', '2.0', '2.5', '3.0', '3.5', '4.0', '4.5'];
const GAME_TYPE_LABEL: Record<GameType, string> = {
  singles: '단식',
  doubles: '복식',
  mixed: '혼복',
  women_doubles: '여복',
  men_doubles: '남복',
  any: '무관',
};
const GENDER_LABEL: Record<GenderRequirement, string> = {
  male: '남성',
  female: '여성',
  any: '무관',
};

const COURTS: CourtName[] = ['A코트', 'B코트'];

export function MatchingScreen() {
  const {
    matchingPosts,
    getUser,
    currentUser,
    applyMatching,
    approveMatchingApplication,
    rejectMatchingApplication,
    createMatchingPost,
    closeMatching,
    deleteMatchingPost,
    getCourtSlotStatus,
    isCourtBlockedByPension,
    tempHolidays,
  } = useApp();
  const [filterNtrp, setFilterNtrp] = useState<NTRP | 'any'>('any');
  const [filterGender, setFilterGender] = useState<GenderRequirement | 'all'>('all');
  const [filterDate, setFilterDate] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPost, setSelectedPost] = useState<MatchingPost | null>(null);
  const [contactModal, setContactModal] = useState<{ name: string; phone: string } | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    matchingPosts.forEach((p) => {
      if (new Date(p.date) < twoDaysAgo) {
        deleteMatchingPost(p.id);
      }
    });
  }, []);

  const filtered = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    return matchingPosts
      .filter((p) => {
        if (p.status !== '대관대기' && p.status !== '모집중' && p.status !== '모집완료') return false;
        if (filterNtrp !== 'any' && p.ntrpRequirement !== 'any' && p.ntrpRequirement !== filterNtrp) return false;
        if (filterGender !== 'all' && p.genderRequirement !== filterGender) return false;
        if (filterDate && p.date !== filterDate) return false;
        const postDate = new Date(p.date);
        if (postDate < twoDaysAgo) return false;
        return true;
      })
      .sort((a, b) => {
        const da = a.date + ' ' + a.time.split('-')[0];
        const db = b.date + ' ' + b.time.split('-')[0];
        return da.localeCompare(db);
      });
  }, [matchingPosts, filterNtrp, filterGender, filterDate]);

  const handleApply = (post: MatchingPost, intro: string, gender?: ApplicantGender) => {
    const res = applyMatching(post.id, intro, gender);
    if (res.ok) setSelectedPost(null);
  };

  const handleApprove = (post: MatchingPost, appId: string) => {
    approveMatchingApplication(post.id, appId);
    const app = post.applications.find((a) => a.id === appId);
    const applicant = app ? getUser(app.userId) : null;
    if (applicant) {
      setContactModal({ name: applicant.name, phone: applicant.phone });
    }
  };

  return (
    <div className="space-y-5 pb-4">
      <SectionTitle
        title="매칭 피드"
        subtitle="함께 테니스를 즐길 메이트를 찾아보세요"
        right={
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters((s) => !s)}
              className={`chip transition ${showFilters ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              <Filter size={14} /> 필터
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="chip bg-volt-500 text-navy-950 hover:bg-volt-400 transition"
            >
              <Plus size={14} /> 매칭 만들기
            </button>
          </div>
        }
      />

      {showFilters && (
        <div className="card p-4 space-y-3 animate-slide-up">
          <div>
            <p className="text-xs font-bold text-slate-500 mb-1.5">구력 (NTRP)</p>
            <div className="flex flex-wrap gap-1.5">
              <Pill active={filterNtrp === 'any'} onClick={() => setFilterNtrp('any')}>전체</Pill>
              {NTRP_OPTIONS.filter((n) => n !== 'any').map((n) => (
                <Pill key={n} active={filterNtrp === n} onClick={() => setFilterNtrp(n)}>{n}</Pill>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 mb-1.5">성별</p>
            <div className="flex flex-wrap gap-1.5">
              <Pill active={filterGender === 'all'} onClick={() => setFilterGender('all')}>전체</Pill>
              <Pill active={filterGender === 'male'} onClick={() => setFilterGender('male')}><User size={12} /> 남성</Pill>
              <Pill active={filterGender === 'female'} onClick={() => setFilterGender('female')}><UserCircle size={12} /> 여성</Pill>
              <Pill active={filterGender === 'any'} onClick={() => setFilterGender('any')}>무관</Pill>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 mb-1.5">날짜</p>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="input"
            />
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users size={28} />}
          title="모집 중인 매칭이 없어요"
          description="매칭 만들기로 새 모집글을 올려보세요."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((post) => {
            const host = getUser(post.userId);
            const isHost = post.userId === currentUser.id;
            const myApp = post.applications.find((a) => a.userId === currentUser.id);
            const approvedCount = post.applications.filter((a) => a.status === '승인').length;
            return (
              <div key={post.id} className="card p-5">
                <div className="flex items-start gap-3">
                  <img
                    src={host?.profileImg}
                    alt={host?.name}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-navy-900">{host?.name}</p>
                      <span className="chip bg-navy-50 text-navy-700">NTRP {host?.ntrp}</span>
                      <span className="chip bg-slate-100 text-slate-600">{post.court}</span>
                      <span className={`chip ${post.status === '모집중' ? 'bg-volt-100 text-volt-800' : post.status === '대관대기' ? 'bg-amber-100 text-amber-700' : 'bg-navy-100 text-navy-700'}`}>
                        {post.status}
                      </span>
                      {!post.courtApproved && (
                        <span className="chip bg-amber-100 text-amber-700">
                          <Clock size={12} /> 대관 승인 대기
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Calendar size={12} /> {post.date}</span>
                      <span className="flex items-center gap-1"><Clock size={12} /> {post.time}</span>
                      <span className="flex items-center gap-1"><Users size={12} /> {approvedCount + 1}/{post.maxPlayers}</span>
                      <span className="flex items-center gap-1"><Hand size={12} /> {GAME_TYPE_LABEL[post.gameType]}</span>
                      <span className="flex items-center gap-1">
                        {post.genderRequirement === 'male' ? <User size={12} /> : <UserCircle size={12} />}
                        {GENDER_LABEL[post.genderRequirement]}
                      </span>
                    </div>
                  </div>
                </div>

                {post.description && (
                  <p className="text-sm text-navy-800 mt-3 leading-relaxed whitespace-pre-wrap">
                    {post.description}
                  </p>
                )}

                <div className="flex items-center gap-2 mt-4">
                  <span className="chip bg-slate-100 text-slate-600">
                    NTRP {post.ntrpRequirement === 'any' ? '무관' : `${post.ntrpRequirement}+`}
                  </span>
                  <span className="chip bg-slate-100 text-slate-600">
                    <MapPin size={12} /> {post.court}
                  </span>
                </div>

                <div className="mt-4 flex gap-2">
                  {isHost ? (
                    <button
                      onClick={() => setSelectedPost(post)}
                      className="btn-navy flex-1"
                    >
                      <MessageSquare size={16} /> 신청자 관리 ({post.applications.filter(a => a.status === '대기').length})
                    </button>
                  ) : myApp ? (
                    myApp.status === '승인' ? (
                      <button
                        onClick={() => setContactModal({ name: host?.name || '', phone: host?.phone || '' })}
                        className="btn-primary flex-1"
                      >
                        <Phone size={16} /> 연락처 보기
                      </button>
                    ) : myApp.status === '거절' ? (
                      <button disabled className="btn-ghost flex-1">
                        <X size={16} /> 거절됨
                      </button>
                    ) : (
                      <button disabled className="btn-ghost flex-1">
                        <Clock size={16} /> 승인 대기 중
                      </button>
                    )
                  ) : (
                    <button
                      onClick={() => setSelectedPost(post)}
                      className="btn-primary flex-1"
                      disabled={post.status === '모집완료' || approvedCount >= post.maxPlayers - 1 || !post.courtApproved}
                    >
                      <UserPlus size={16} /> {post.status === '모집완료' ? '모집 완료' : post.courtApproved ? '매칭 신청하기' : '대관 승인 대기 중'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail / apply modal */}
      <Modal
        open={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        title={selectedPost && selectedPost.userId === currentUser.id ? '신청자 관리' : '매칭 신청'}
        size={selectedPost && selectedPost.userId === currentUser.id ? 'md' : 'sm'}
      >
        {selectedPost && (
          <ApplyOrManageModal
            post={selectedPost}
            isHost={selectedPost.userId === currentUser.id}
            getUser={getUser}
            onApply={handleApply}
            onApprove={handleApprove}
            onReject={rejectMatchingApplication}
            onCloseMatching={(postId) => {
              closeMatching(postId);
              setSelectedPost(null);
            }}
          />
        )}
      </Modal>

      {/* Create matching modal */}
      <CreateMatchingModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={createMatchingPost}
        getCourtSlotStatus={getCourtSlotStatus}
        isCourtBlockedByPension={isCourtBlockedByPension}
        bankAccount={BANK_ACCOUNT}
        userName={currentUser.name}
        userPhone={currentUser.phone}
      />

      {/* Contact modal */}
      <Modal
        open={!!contactModal}
        onClose={() => setContactModal(null)}
        title="연락처 공개"
        size="sm"
        footer={
          <button className="btn-primary" onClick={() => setContactModal(null)}>
            <CheckCircle2 size={18} /> 확인
          </button>
        }
      >
        {contactModal && (
          <div className="text-center py-2">
            <div className="w-16 h-16 rounded-full bg-volt-100 flex items-center justify-center mx-auto mb-3">
              <Phone size={28} className="text-volt-700" />
            </div>
            <p className="font-bold text-navy-900 text-lg">{contactModal.name}</p>
            <p className="text-xl font-extrabold text-navy-900 mt-1 tracking-wider">{contactModal.phone}</p>
            <p className="text-xs text-slate-400 mt-2">매칭이 승인되어 연락처가 공개되었습니다.</p>
          </div>
        )}
      </Modal>
    </div>
  );
}

function ApplyOrManageModal({
  post,
  isHost,
  getUser,
  onApply,
  onApprove,
  onReject,
  onCloseMatching,
}: {
  post: MatchingPost;
  isHost: boolean;
  getUser: (id: string) => { name: string; profileImg: string; ntrp: string; career: string; phone: string } | undefined;
  onApply: (post: MatchingPost, intro: string, gender?: ApplicantGender) => void;
  onApprove: (post: MatchingPost, appId: string) => void;
  onReject: (postId: string, appId: string) => void;
  onCloseMatching: (postId: string) => void;
}) {
  const [intro, setIntro] = useState('');
  const [gender, setGender] = useState<ApplicantGender | ''>('');
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  if (isHost) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-navy-50 p-4">
          <p className="font-bold text-navy-900">{post.court} · {post.date} {post.time}</p>
          <p className="text-sm text-slate-600 mt-1">{post.description}</p>
        </div>

        <div>
          <p className="text-sm font-bold text-navy-800 mb-2">신청자 ({post.applications.length})</p>
          {post.applications.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">아직 신청자가 없어요</p>
          ) : (
            <div className="space-y-2">
              {post.applications.map((app) => {
                const u = getUser(app.userId);
                return (
                  <div key={app.id} className="rounded-xl border border-slate-100 p-3">
                    <div className="flex items-center gap-3">
                      <img src={u?.profileImg} className="w-10 h-10 rounded-lg object-cover" alt="" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-navy-900 text-sm">{u?.name}</p>
                        <p className="text-xs text-slate-500">
                          NTRP {u?.ntrp} · {u?.career}{app.gender ? ` · ${app.gender === 'male' ? '남성' : '여성'}` : ''}
                        </p>
                      </div>
                      {app.status === '승인' ? (
                        <span className="chip bg-volt-100 text-volt-800"><CheckCircle2 size={12} /> 승인됨</span>
                      ) : app.status === '거절' ? (
                        <span className="chip bg-rose-100 text-rose-700"><X size={12} /> 거절됨</span>
                      ) : (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => onApprove(post, app.id)}
                            className="btn-primary text-sm py-1.5 px-3"
                          >
                            승인
                          </button>
                          <button
                            onClick={() => onReject(post.id, app.id)}
                            className="btn-ghost text-sm py-1.5 px-3 text-rose-600 hover:bg-rose-50"
                          >
                            거절
                          </button>
                        </div>
                      )}
                    </div>
                    {app.intro && (
                      <p className="text-xs text-slate-600 mt-2 pl-13 border-l-2 border-slate-100 ml-13">
                        "{app.intro}"
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {post.status === '모집중' && (
          <>
            <button
              onClick={() => setShowCloseConfirm(true)}
              className="btn-navy w-full text-sm py-2.5"
            >
              <CheckCircle2 size={16} /> 매칭 완료하기
            </button>
            {showCloseConfirm && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
                <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
                  <p className="text-sm text-gray-700">
                    매칭 완료를 하면 더 이상 신청을 받지 못합니다. 그래도 완료하시겠습니까?
                  </p>
                  <div className="mt-5 flex gap-2">
                    <button
                      onClick={() => setShowCloseConfirm(false)}
                      className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      취소
                    </button>
                    <button
                      onClick={() => {
                        setShowCloseConfirm(false);
                        onCloseMatching(post.id);
                      }}
                      className="flex-1 rounded-lg bg-[#1e3a5f] py-2.5 text-sm font-medium text-white hover:bg-[#15294a]"
                    >
                      완료하기
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-navy-50 p-4">
        <p className="font-bold text-navy-900">{post.court} · {post.date} {post.time}</p>
        <p className="text-sm text-slate-600 mt-1">{post.description}</p>
      </div>
      <div className="text-sm text-slate-600 space-y-2">
        <p>호스트: {getUser(post.userId)?.name}</p>
        <p>모집 인원: {post.maxPlayers}명</p>
        <p>구력 요건: NTRP {post.ntrpRequirement === 'any' ? '무관' : `${post.ntrpRequirement}+`}</p>
        <p>성별 요건: {GENDER_LABEL[post.genderRequirement]}</p>
        <p>게임 유형: {GAME_TYPE_LABEL[post.gameType]}</p>
      </div>
      <div>
        <p className="text-sm font-bold text-navy-800 mb-1.5">성별</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setGender('male')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition ${gender === 'male' ? 'bg-navy-900 text-white border-navy-900' : 'bg-white text-slate-600 border-slate-200 hover:border-navy-300'}`}
          >
            남성
          </button>
          <button
            type="button"
            onClick={() => setGender('female')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition ${gender === 'female' ? 'bg-navy-900 text-white border-navy-900' : 'bg-white text-slate-600 border-slate-200 hover:border-navy-300'}`}
          >
            여성
          </button>
        </div>
      </div>
      <div>
        <p className="text-sm font-bold text-navy-800 mb-1.5">한줄 소개</p>
        <textarea
          value={intro}
          onChange={(e) => setIntro(e.target.value.slice(0, 100))}
          placeholder="간단한 소개를 남겨주세요 (최대 100자)"
          rows={2}
          className="input resize-none"
        />
        <p className="text-xs text-slate-400 mt-1 text-right">{intro.length}/100</p>
      </div>
      <p className="text-xs text-slate-400">* 호스트 승인 후 연락처가 공개됩니다.</p>
      <button
        className="btn-primary w-full"
        onClick={() => onApply(post, intro, gender || undefined)}
        disabled={!intro.trim() || !gender || !!post.applications.find((a) => a.userId === post.userId)}
      >
        <UserPlus size={16} /> 신청하기
      </button>
    </div>
  );
}

function CreateMatchingModal({
  open,
  onClose,
  onCreate,
  getCourtSlotStatus,
  isCourtBlockedByPension,
  bankAccount,
  userName,
  userPhone,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (input: {
    court: CourtName;
    date: string;
    timeSlots: string[];
    ntrpRequirement: NTRP | 'any';
    genderRequirement: GenderRequirement;
    maxPlayers: number;
    gameType: GameType;
    description: string;
  }) => { ok: boolean; reason?: string; post?: MatchingPost };
  getCourtSlotStatus: (date: string, court: CourtName, slot: string) => string;
  isCourtBlockedByPension: (date: string, court: CourtName) => boolean;
  bankAccount: { bank: string; number: string; holder: string };
  userName: string;
  userPhone: string;
}) {
  const [date, setDate] = useState(todayYMD());
  const [court, setCourt] = useState<CourtName>('A코트');
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [ntrpReq, setNtrpReq] = useState<NTRP | 'any'>('any');
  const [genderReq, setGenderReq] = useState<GenderRequirement>('any');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [gameType, setGameType] = useState<GameType>('doubles');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successModal, setSuccessModal] = useState(false);

  const blockedByPension = isCourtBlockedByPension(date, court);

  const toggleSlot = (s: string) => {
    setSelectedSlots((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
    setError(null);
  };

  const sortedSlots = [...selectedSlots].sort();
  const totalAmount = selectedSlots.reduce((sum, slot) => sum + getCourtSlotPrice(date, slot, tempHolidays), 0);

  const handleSubmit = () => {
    const res = onCreate({
      court,
      date,
      timeSlots: selectedSlots,
      ntrpRequirement: ntrpReq,
      genderRequirement: genderReq,
      maxPlayers,
      gameType,
      description: description.slice(0, 500),
    });
    if (res.ok) {
      setSuccessModal(true);
    } else {
      setError(res.reason || '매칭글 등록에 실패했습니다.');
    }
  };

  const resetAndClose = () => {
    setSelectedSlots([]);
    setDescription('');
    setError(null);
    setSuccessModal(false);
    onClose();
  };

  return (
    <>
      <Modal
        open={open && !successModal}
        onClose={onClose}
        title="매칭 만들기"
        size="md"
        footer={
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={selectedSlots.length === 0 || !description.trim()}
          >
            <Wallet size={16} /> 매칭글 등록 + 입금 신청
          </button>
        }
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-volt-50 border border-volt-200 p-3 text-xs text-volt-800">
            매칭 만들기는 코트 대관과 동일한 시간대·요금이 적용되며, 등록 시 코트 예약 신청도 함께 접수됩니다. 대관이나 펜션 예약이 있는 날짜/시간대는 선택할 수 없습니다.
          </div>

          {/* Court selector */}
          <div>
            <p className="text-xs font-bold text-slate-500 mb-1.5">코트 선택</p>
            <div className="grid grid-cols-2 gap-2">
              {COURTS.map((c) => (
                <button
                  key={c}
                  onClick={() => { setCourt(c); setSelectedSlots([]); setError(null); }}
                  className={`rounded-xl p-3 text-sm font-bold transition border ${
                    court === c
                      ? 'bg-navy-900 text-white border-navy-900'
                      : 'bg-white text-navy-800 border-slate-200 hover:border-volt-400'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div>
            <p className="text-xs font-bold text-slate-500 mb-1.5">날짜 선택</p>
            <CalendarPicker
              value={date}
              onChange={setDate}
              minDate={todayYMD()}
            />
          </div>

          {blockedByPension && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-start gap-2">
              <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">해당 날짜는 펜션 예약 완료로 코트 이용이 불가합니다.</p>
            </div>
          )}

          {/* Time slots */}
          {!blockedByPension && (
            <div>
              <p className="text-xs font-bold text-slate-500 mb-1.5">시간대 선택 (1시간 단위 · 복수 선택)</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {COURT_TIME_SLOTS.map((s) => {
                  const status = getCourtSlotStatus(date, court, s);
                  const isSel = selectedSlots.includes(s);
                  const disabled = status !== 'available';
                  return (
                    <button
                      key={s}
                      disabled={disabled}
                      onClick={() => toggleSlot(s)}
                      className={`rounded-xl p-2.5 text-sm font-bold transition border ${
                        isSel
                          ? 'bg-navy-900 text-white border-navy-900'
                          : status === 'available'
                            ? 'bg-white text-navy-800 border-slate-200 hover:border-volt-400'
                            : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* NTRP */}
          <div>
            <p className="text-xs font-bold text-slate-500 mb-1.5">희망 NTRP</p>
            <div className="flex flex-wrap gap-1.5">
              <Pill active={ntrpReq === 'any'} onClick={() => setNtrpReq('any')}>무관</Pill>
              {NTRP_OPTIONS.filter((n) => n !== 'any').map((n) => (
                <Pill key={n} active={ntrpReq === n} onClick={() => setNtrpReq(n)}>{n}+</Pill>
              ))}
            </div>
          </div>

          {/* Game type */}
          <div>
            <p className="text-xs font-bold text-slate-500 mb-1.5">게임 유형</p>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(GAME_TYPE_LABEL) as GameType[]).map((g) => (
                <Pill key={g} active={gameType === g} onClick={() => setGameType(g)}>
                  {GAME_TYPE_LABEL[g]}
                </Pill>
              ))}
            </div>
          </div>

          {/* Gender */}
          <div>
            <p className="text-xs font-bold text-slate-500 mb-1.5">모집 성별</p>
            <div className="flex flex-wrap gap-1.5">
              <Pill active={genderReq === 'any'} onClick={() => setGenderReq('any')}>무관</Pill>
              <Pill active={genderReq === 'male'} onClick={() => setGenderReq('male')}><User size={12} /> 남성</Pill>
              <Pill active={genderReq === 'female'} onClick={() => setGenderReq('female')}><UserCircle size={12} /> 여성</Pill>
            </div>
          </div>

          {/* Max players */}
          <div>
            <p className="text-xs font-bold text-slate-500 mb-1.5">모집 인원 (본인 포함, 최대 {MATCHING_MAX_PLAYERS}명)</p>
            <div className="flex flex-wrap gap-1.5">
              {[2, 3, 4, 5, 6].map((n) => (
                <Pill key={n} active={maxPlayers === n} onClick={() => setMaxPlayers(n)}>{n}명</Pill>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-xs font-bold text-slate-500 mb-1.5">소개글 (최대 5줄)</p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 500))}
              placeholder="매칭에 대한 간단한 소개를 남겨주세요"
              rows={5}
              className="input resize-none"
            />
            <p className="text-xs text-slate-400 mt-1 text-right">{description.length}/500</p>
          </div>

          {/* Summary */}
          {sortedSlots.length > 0 && !blockedByPension && (
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
          )}

          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 flex items-start gap-2">
              <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
              <p className="text-sm text-rose-800">{error}</p>
            </div>
          )}
        </div>
      </Modal>

      {/* Success modal */}
      <Modal
        open={successModal}
        onClose={resetAndClose}
        title="입금 안내"
        size="sm"
        footer={
          <button className="btn-primary" onClick={resetAndClose}>
            <CheckCircle2 size={18} /> 확인
          </button>
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
            <p><span className="font-bold text-navy-800">예약자:</span> {userName} ({userPhone})</p>
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
          <p className="text-xs text-slate-400">입금 후 관리자 승인을 기다려주세요. 승인 완료 시 매칭 모집이 활성화됩니다.</p>
        </div>
      </Modal>
    </>
  );
}
