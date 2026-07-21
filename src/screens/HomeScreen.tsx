import { useState, useEffect } from 'react';
import {
  BedDouble,
  CalendarRange,
  Users,
  Megaphone,
  Ticket,
  Images,
  Hand,
  CheckCircle2,
  Clock,
  MapPin,
  User,
  Phone,
  MessageSquare,
  Send,
  Trash2,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../store';
import { useAuth } from '../lib/auth';
import { Logo } from '../components/Logo';
import { StatusBadge, SectionTitle, EmptyState } from '../components/ui';
import { Modal } from '../components/Modal';
import type { Reservation, MatchingPost, GameType, GenderRequirement, ReservationStatus, Notice } from '../types';
import { mergeTimeSlots } from '../types';

const QUICK_MENUS = [
  { key: 'pension', label: '펜션예약', icon: BedDouble, color: 'bg-volt-500', desc: 'A·B동 숙박' },
  { key: 'court', label: '코트예약', icon: CalendarRange, color: 'bg-navy-700', desc: '1시간 단위' },
  { key: 'matching', label: '매칭', icon: Users, color: 'bg-sky-500', desc: '메이트 모집' },
  { key: 'notices', label: '공지', icon: Megaphone, color: 'bg-clay-400', desc: '이벤트·안내' },
  { key: 'gallery', label: '갤러리', icon: Images, color: 'bg-amber-500', desc: '플테하 순간' },
  { key: 'mypage', label: '내예약', icon: Ticket, color: 'bg-rose-500', desc: '예약·매칭 내역' },
] as const;

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

type DetailKind = 'myMatching' | 'joinedMatching' | 'court' | 'pension' | null;

export function HomeScreen({ go }: { go: (k: string) => void }) {
  const { reservations, matchingPosts, notices, currentUser, getUser, bannerImageUrl, logoImageUrl, setFocusMatchingPostId, noticeComments, loadNoticeComments, addNoticeComment, deleteNoticeComment } = useApp();
  const { user, isGuest } = useAuth();
  const [detail, setDetail] = useState<DetailKind>(null);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (selectedNotice) {
      setCommentText('');
      void loadNoticeComments(selectedNotice.id);
    }
  }, [selectedNotice, loadNoticeComments]);

  const handleAddComment = async () => {
    if (!selectedNotice || !commentText.trim()) return;
    setSubmitting(true);
    const res = await addNoticeComment(selectedNotice.id, commentText);
    setSubmitting(false);
    if (res.ok) {
      setCommentText('');
    } else {
      alert(res.error || '댓글 작성에 실패했습니다.');
    }
  };

  const today = new Date().toISOString().slice(0, 10);
  const isUpcoming = (date: string) => date >= today;

  const myMatchingPosts = matchingPosts.filter((m) => m.userId === currentUser.id && isUpcoming(m.date));
  const joinedMatchings = matchingPosts.filter(
    (m) =>
      m.applications.some((a) => a.userId === currentUser.id) &&
      isUpcoming(m.date),
  );
  const myApprovedMatchings = matchingPosts.filter(
    (m) =>
      m.applications.some((a) => a.userId === currentUser.id && a.status === '승인') &&
      isUpcoming(m.date),
  );
  // 새 신청자 = 내가 만든 매칭 전체의 대기 상태 신청자 수
  const newApplicantCount = myMatchingPosts.reduce(
    (sum, m) => sum + m.applications.filter((a) => a.status === '대기').length,
    0,
  );
  // 내가 참여한 매칭의 내 신청 상태별 집계
  const joinedStatusCount = joinedMatchings.reduce(
    (acc, m) => {
      const mine = m.applications.find((a) => a.userId === currentUser.id);
      if (!mine) return acc;
      acc[mine.status] = (acc[mine.status] || 0) + 1;
      return acc;
    },
    { '승인': 0, '거절': 0, '대기': 0 } as Record<'승인' | '거절' | '대기', number>,
  );
  const myCourtReservations = reservations.filter(
    (r) =>
      r.userId === currentUser.id &&
      r.type === 'court' &&
      !r.matchingPostId &&
      isUpcoming(r.date),
  );
  const myPensionReservations = reservations.filter(
    (r) => r.userId === currentUser.id && r.type === 'pension' && r.status !== '취소' && isUpcoming(r.date),
  );

  // Group court reservations by date + targetLabel to collapse consecutive slots into one row
  const courtBatchGroups = (() => {
    const map = new Map<string, Reservation[]>();
    for (const r of myCourtReservations) {
      const key = `${r.date}|${r.targetLabel}`;
      const arr = map.get(key) || [];
      arr.push(r);
      map.set(key, arr);
    }
    for (const arr of map.values()) arr.sort((a, b) => (a.timeSlot || '').localeCompare(b.timeSlot || ''));
    return Array.from(map.entries()).sort(([, a], [, b]) => {
      return a[0].date < b[0].date ? -1 : a[0].date > b[0].date ? 1 : 0;
    });
  })();

  const cards = [
    {
      key: 'myMatching' as const,
      label: '내가 만든 매칭',
      count: myMatchingPosts.length,
      icon: <Users size={20} />,
      tone: 'bg-sky-50 text-sky-700',
      badge: newApplicantCount > 0 ? `새 신청자(${newApplicantCount})` : undefined,
      hasAlert: newApplicantCount > 0,
    },
    {
      key: 'joinedMatching' as const,
      label: '내가 참여한 매칭',
      count: myApprovedMatchings.length,
      icon: <CheckCircle2 size={20} />,
      tone: 'bg-volt-100 text-volt-700',
      hasAlert: joinedStatusCount['승인'] + joinedStatusCount['거절'] + joinedStatusCount['대기'] > 0,
      sub: (
        <div className="flex gap-1.5 mt-1">
          <span className="chip bg-volt-100 text-volt-800 !px-1.5 !py-0.5 !text-[10px]">승인 {joinedStatusCount['승인']}</span>
          <span className="chip bg-rose-100 text-rose-600 !px-1.5 !py-0.5 !text-[10px]">거절 {joinedStatusCount['거절']}</span>
          <span className="chip bg-slate-100 text-slate-600 !px-1.5 !py-0.5 !text-[10px]">대기 {joinedStatusCount['대기']}</span>
        </div>
      ),
    },
    {
      key: 'court' as const,
      label: '나의 코트 대관',
      count: courtBatchGroups.length,
      icon: <CalendarRange size={20} />,
      tone: 'bg-navy-50 text-navy-700',
    },
    {
      key: 'pension' as const,
      label: '나의 펜션 예약',
      count: myPensionReservations.length,
      icon: <BedDouble size={20} />,
      tone: 'bg-rose-50 text-rose-700',
    },
  ];

  return (
    <div className="space-y-6 pb-4">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 shadow-navy">
        {bannerImageUrl ? (
          <>
            <img
              src={bannerImageUrl}
              alt="배너"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-navy-950/85 via-navy-900/60 to-transparent" />
          </>
        ) : (
          <>
            <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-volt-500/20 blur-2xl" />
            <div className="absolute bottom-0 right-6 w-24 h-24 rounded-full bg-volt-400/30 blur-xl animate-bounce-ball" />
          </>
        )}
        <div className="relative p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <img
              src={isGuest ? (logoImageUrl || `${import.meta.env.BASE_URL}logo_png.png`) : currentUser.profileImg}
              alt={currentUser.name}
              className="w-11 h-11 rounded-xl object-cover ring-2 ring-white/20"
            />
          </div>
          <p className="mt-3 text-lg font-bold text-white">{isGuest ? '플테하에 오신 것을 환영합니다!' : `${currentUser.name}님 플테하에서 오늘도 즐테하세요!`}</p>
        </div>
      </div>

      {/* My activity summary */}
      <div>
        <SectionTitle title="내 주요 활동내역" subtitle="각 항목을 누르면 상세 목록을 볼 수 있어요" />
        <div className="grid grid-cols-2 gap-3">
          {cards.map((c) => (
            <button
              key={c.key}
              onClick={() => setDetail(c.key)}
              className="card p-4 text-left hover:-translate-y-0.5 hover:shadow-navy transition-all duration-200 group flex flex-col"
            >
              <div className="flex items-center gap-3">
                <div className={`relative w-11 h-11 rounded-2xl ${c.tone} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  {c.icon}
                  {c.hasAlert && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-2xl font-extrabold text-navy-900">{c.count}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{c.label}</p>
                  {c.badge && (
                    <span className="inline-flex items-center gap-1 mt-1 chip bg-rose-100 text-rose-600 !px-2 !py-0.5 !text-[11px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> {c.badge}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex justify-center mt-2 min-h-[20px]">
                {c.sub}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Quick menus */}
      <div>
        <SectionTitle title="퀵 메뉴" subtitle="원하는 서비스를 바로 이용하세요" />
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {QUICK_MENUS.map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.key}
                onClick={() => go(m.key)}
                className="card p-4 flex flex-col items-center text-center hover:-translate-y-1 hover:shadow-navy transition-all duration-200 group"
              >
                <div
                  className={`w-12 h-12 rounded-2xl ${m.color} flex items-center justify-center text-white mb-2.5 group-hover:scale-110 transition-transform`}
                >
                  <Icon size={22} />
                </div>
                <p className="font-bold text-navy-900 text-sm">{m.label}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{m.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent notices */}
      <div>
        <SectionTitle
          title="최근 공지"
          subtitle="새로운 안내를 확인하세요"
          right={
            <button onClick={() => go('notices')} className="text-sm font-semibold text-navy-600 hover:text-navy-900">
              전체보기
            </button>
          }
        />
        <div className="space-y-2">
          {notices.slice(0, 3).map((n) => (
            <button
              key={n.id}
              onClick={() => setSelectedNotice(n)}
              className="card w-full p-4 flex items-center gap-3 text-left hover:border-navy-200 transition"
            >
              <div className="w-10 h-10 rounded-xl bg-navy-50 flex items-center justify-center text-navy-700">
                <Megaphone size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-navy-900 truncate">{n.title}</p>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{n.content}</p>
              </div>
              <span className="chip bg-slate-100 text-slate-600 shrink-0">{n.type}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Detail modals */}
      <Modal
        open={detail === 'myMatching'}
        onClose={() => setDetail(null)}
        title="내가 만든 매칭"
        size="md"
        footer={<button className="btn-ghost" onClick={() => setDetail(null)}>닫기</button>}
      >
        <MatchingList posts={myMatchingPosts} getUser={getUser} emptyText="내가 만든 매칭이 없습니다" showApplicantBadge onItemClick={(postId) => { setFocusMatchingPostId(postId); setDetail(null); go('matching'); }} />
      </Modal>

      <Modal
        open={detail === 'joinedMatching'}
        onClose={() => setDetail(null)}
        title="내가 참여한 매칭"
        size="md"
        footer={<button className="btn-ghost" onClick={() => setDetail(null)}>닫기</button>}
      >
        <MatchingList posts={joinedMatchings} getUser={getUser} emptyText="참여 중인 매칭이 없습니다" showMyStatus currentUserId={currentUser.id} />
      </Modal>

      <Modal
        open={detail === 'court'}
        onClose={() => setDetail(null)}
        title="나의 코트 대관 현황"
        size="md"
        footer={<button className="btn-ghost" onClick={() => setDetail(null)}>닫기</button>}
      >
        <CourtReservationList groups={courtBatchGroups} emptyText="코트 대관 내역이 없습니다" />
      </Modal>

      <Modal
        open={detail === 'pension'}
        onClose={() => setDetail(null)}
        title="나의 펜션 예약 현황"
        size="md"
        footer={<button className="btn-ghost" onClick={() => setDetail(null)}>닫기</button>}
      >
        <ReservationList items={myPensionReservations} emptyText="펜션 예약 내역이 없습니다" />
      </Modal>

      {/* Notice detail modal */}
      <Modal
        open={selectedNotice !== null}
        onClose={() => setSelectedNotice(null)}
        title={selectedNotice?.title || ''}
        size="md"
        footer={
          <div className="flex justify-between items-center w-full">
            <span className="text-xs text-slate-400">
              {selectedNotice && new Date(selectedNotice.createdAt).toLocaleDateString('ko-KR')}
            </span>
            <button className="btn-ghost" onClick={() => { setSelectedNotice(null); go('notices'); }}>
              전체 공지 보기
            </button>
          </div>
        }
      >
        {selectedNotice && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-navy-50 flex items-center justify-center text-navy-700">
                <Megaphone size={18} />
              </div>
              <span className="chip bg-slate-100 text-slate-600">{selectedNotice.type}</span>
            </div>
            {selectedNotice.imageUrl && (
              <img
                src={selectedNotice.imageUrl}
                alt={selectedNotice.title}
                className="w-full rounded-xl border border-slate-200 max-h-80 object-cover"
              />
            )}
            <p className="text-navy-800 whitespace-pre-wrap leading-relaxed">{selectedNotice.content}</p>

            <div className="border-t border-slate-100 pt-3">
              <div className="flex items-center gap-1.5 mb-2">
                <MessageSquare size={14} className="text-slate-400" />
                <span className="text-sm font-bold text-navy-900">댓글</span>
                <span className="text-xs text-slate-400">({noticeComments.length})</span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {noticeComments.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-3">댓글이 없습니다.</p>
                ) : (
                  noticeComments
                    .filter((c) => !c.parentId)
                    .map((c) => {
                      const replies = noticeComments
                        .filter((r) => r.parentId === c.id)
                        .sort((a, b) => a.createdAt - b.createdAt);
                      return (
                        <div key={c.id} className="space-y-1.5">
                          <div
                            className={`flex items-start gap-2 rounded-lg p-2.5 ${
                              c.isAdmin ? 'bg-volt-50 ring-1 ring-volt-200' : 'bg-slate-50'
                            }`}
                          >
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                                c.isAdmin ? 'bg-navy-900 text-volt-400' : 'bg-navy-100 text-navy-700'
                              }`}
                            >
                              {c.isAdmin ? <ShieldAlert size={14} /> : c.userName.slice(0, 1)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-navy-900">{c.userName}</span>
                                {c.isAdmin && (
                                  <span className="chip bg-navy-900 text-volt-400 text-[10px] py-0 px-1.5">
                                    관리자
                                  </span>
                                )}
                                <span className="text-[10px] text-slate-400">
                                  {new Date(c.createdAt).toLocaleString('ko-KR')}
                                </span>
                              </div>
                              <p className="text-sm text-navy-800 break-words mt-0.5">{c.content}</p>
                            </div>
                            {user && c.userId === user.id && (
                              <button
                                onClick={() => deleteNoticeComment(c.id)}
                                className="text-rose-400 hover:text-rose-600 p-1 shrink-0"
                                aria-label="삭제"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                          {replies.map((r) => (
                            <div
                              key={r.id}
                              className={`flex items-start gap-2 rounded-lg p-2 ml-6 ${
                                r.isAdmin ? 'bg-volt-50 ring-1 ring-volt-200' : 'bg-slate-50'
                              }`}
                            >
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                                  r.isAdmin ? 'bg-navy-900 text-volt-400' : 'bg-navy-100 text-navy-700'
                                }`}
                              >
                                {r.isAdmin ? <ShieldAlert size={12} /> : r.userName.slice(0, 1)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-navy-900">{r.userName}</span>
                                  {r.isAdmin && (
                                    <span className="chip bg-navy-900 text-volt-400 text-[10px] py-0 px-1.5">
                                      관리자
                                    </span>
                                  )}
                                  <span className="text-[10px] text-slate-400">
                                    {new Date(r.createdAt).toLocaleString('ko-KR')}
                                  </span>
                                </div>
                                <p className="text-sm text-navy-800 break-words mt-0.5">{r.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })
                )}
              </div>

              {isGuest ? (
                <p className="text-xs text-slate-400 text-center py-2 mt-2">
                  댓글은 회원만 작성할 수 있습니다.
                </p>
              ) : user ? (
                <div className="flex gap-2 mt-2">
                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        void handleAddComment();
                      }
                    }}
                    placeholder="한줄 댓글을 입력하세요"
                    maxLength={100}
                    className="input flex-1 py-2"
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={submitting || !commentText.trim()}
                    className="btn-primary px-3 disabled:opacity-50"
                    aria-label="댓글 등록"
                  >
                    <Send size={16} />
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function MatchingList({
  posts,
  getUser,
  emptyText,
  onItemClick,
  showApplicantBadge = false,
  showMyStatus = false,
  currentUserId,
}: {
  posts: MatchingPost[];
  getUser: (id: string) => { name: string; profileImg: string; phone: string } | undefined;
  emptyText: string;
  onItemClick?: (postId: string) => void;
  showApplicantBadge?: boolean;
  showMyStatus?: boolean;
  currentUserId?: string;
}) {
  if (posts.length === 0) {
    return <EmptyState icon={<Users size={28} />} title={emptyText} />;
  }
  return (
    <div className="space-y-3">
      {posts.map((p) => {
        const host = getUser(p.userId);
        const approved = p.applications.filter((a) => a.status === '승인').length;
        const pending = p.applications.filter((a) => a.status === '대기').length;
        const mine = showMyStatus && currentUserId ? p.applications.find((a) => a.userId === currentUserId) : undefined;
        const myStatusCls = mine
          ? mine.status === '승인'
            ? 'bg-volt-100 text-volt-800'
            : mine.status === '거절'
              ? 'bg-rose-100 text-rose-600'
              : 'bg-slate-100 text-slate-600'
          : '';
        return (
          <button
            key={p.id}
            onClick={() => onItemClick?.(p.id)}
            className="rounded-2xl border border-slate-100 p-4 w-full text-left hover:border-navy-200 hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-2.5">
              <img src={host?.profileImg} className="w-10 h-10 rounded-xl object-cover" alt="" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-navy-900">
                  {host?.name}
                  {host?.phone && (
                    <span className="ml-2 text-xs font-normal text-slate-500 flex items-center gap-0.5">
                      <Phone size={11} /> {host.phone}
                    </span>
                  )}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><CalendarRange size={11} /> {p.date}</span>
                  <span className="flex items-center gap-1"><Clock size={11} /> {p.time}</span>
                  <span className="flex items-center gap-1"><MapPin size={11} /> {p.court}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className={`chip ${p.status === '모집중' ? 'bg-volt-100 text-volt-800' : p.status === '모집완료' ? 'bg-navy-100 text-navy-700' : 'bg-slate-100 text-slate-500'}`}>
                  {p.status}
                </span>
                {showApplicantBadge && pending > 0 && (
                  <span className="chip bg-rose-100 text-rose-600 !px-2 !py-0.5 !text-[11px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> 새 신청자({pending})
                  </span>
                )}
                {mine && (
                  <span className={`chip ${myStatusCls} !px-2 !py-0.5 !text-[11px] font-bold flex items-center gap-1`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" /> {mine.status}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              <span className="chip bg-slate-100 text-slate-600"><Hand size={11} /> {GAME_TYPE_LABEL[p.gameType]}</span>
              <span className="chip bg-slate-100 text-slate-600"><User size={11} /> {GENDER_LABEL[p.genderRequirement]}</span>
              <span className="chip bg-slate-100 text-slate-600">NTRP {p.ntrpRequirement === 'any' ? '무관' : `${p.ntrpRequirement}+`}</span>
              <span className="chip bg-slate-100 text-slate-600"><Users size={11} /> {approved + 1}/{p.maxPlayers}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function timeWithDuration(timeStr: string): string {
  if (!timeStr) return '';
  const slots = timeStr.split(',').map((s) => s.trim()).filter(Boolean);
  const merged = mergeTimeSlots(slots);
  if (!merged) return '';
  const [s, e] = merged.split('-');
  const [sh, sm] = s.split(':').map(Number);
  const [eh, em] = e.split(':').map(Number);
  const hours = (eh * 60 + em - sh * 60 - sm) / 60;
  const hInt = Math.floor(hours);
  const dur = hours === hInt ? `${hInt}시간` : `${hours}시간`;
  return `${dur} ${merged}`;
}

function CourtReservationList({
  groups,
  emptyText,
}: {
  groups: [string, Reservation[]][];
  emptyText: string;
}) {
  if (groups.length === 0) {
    return <EmptyState icon={<CalendarRange size={28} />} title={emptyText} />;
  }
  return (
    <div className="space-y-2">
      {groups.map(([key, items]) => {
        const activeItems = items.filter((r) => r.status !== '취소');
        const cancelledItems = items.filter((r) => r.status === '취소');
        const hasPartialCancel = cancelledItems.length > 0 && activeItems.length > 0;
        const allCancelled = cancelledItems.length === items.length;
        const activeTimeRange = mergeTimeSlots(activeItems.map((r) => r.timeSlot || '').filter(Boolean));
        const fullTimeRange = mergeTimeSlots(items.map((r) => r.timeSlot || '').filter(Boolean));
        const displayTimeRange = hasPartialCancel ? activeTimeRange : fullTimeRange;
        const activeHours = activeItems.length;
        const statuses = Array.from(new Set(activeItems.map((r) => r.status)));
        const totalAmount = items.reduce((sum, r) => sum + r.amount, 0);
        return (
          <div key={key} className="rounded-2xl border border-slate-100 p-3.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-navy-50 text-navy-700">
                <CalendarRange size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-navy-900 text-sm">
                  {items[0].targetLabel}
                  {displayTimeRange && ` · ${timeWithDuration(displayTimeRange)}`}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {items[0].date} · {allCancelled ? `${items.length}시간` : `${activeHours}시간`} · {totalAmount.toLocaleString()}원
                </p>
              </div>
              {allCancelled ? (
                <StatusBadge status="취소" />
              ) : hasPartialCancel ? (
                <span className="chip bg-rose-100 text-rose-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  일부취소
                </span>
              ) : (
                statuses.map((s) => <StatusBadge key={s} status={s} />)
              )}
            </div>
            {hasPartialCancel && (
              <p className="text-xs text-rose-500 mt-1.5 pl-13">
                {cancelledItems.length}시간 취소됨
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ReservationList({
  items,
  emptyText,
}: {
  items: Reservation[];
  emptyText: string;
}) {
  if (items.length === 0) {
    return <EmptyState icon={<CalendarRange size={28} />} title={emptyText} />;
  }
  return (
    <div className="space-y-2">
      {items.map((r) => (
        <div key={r.id} className="rounded-2xl border border-slate-100 p-3.5 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${r.type === 'pension' ? 'bg-volt-100 text-volt-700' : 'bg-navy-50 text-navy-700'}`}>
            {r.type === 'pension' ? <BedDouble size={18} /> : <CalendarRange size={18} />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-navy-900 text-sm">
              {r.targetLabel}
              {r.type === 'court' && r.timeSlot && ` · ${r.timeSlot}`}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {r.date}
              {r.waitingSequence && ` · 대기 ${r.waitingSequence}순위`}
              {r.capacity && ` · ${r.capacity}명`}
            </p>
          </div>
          <StatusBadge status={r.status} />
        </div>
      ))}
    </div>
  );
}
