import { useState, useMemo } from 'react';
import {
  Users,
  Calendar,
  Clock,
  MapPin,
  Hand,
  User,
  UserCircle,
  CheckCircle2,
  X,
  Search,
  MessageSquare,
} from 'lucide-react';
import { useApp } from '../../store';
import { SectionTitle, EmptyState, Pill } from '../../components/ui';
import { Modal } from '../../components/Modal';
import type { MatchingPost, GameType, GenderRequirement } from '../../types';

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

export function AdminMatchingScreen() {
  const { matchingPosts, getUser } = useApp();
  const [search, setSearch] = useState('');
  const [detailPost, setDetailPost] = useState<MatchingPost | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return matchingPosts;
    const q = search.toLowerCase();
    return matchingPosts.filter((p) => {
      const host = getUser(p.userId);
      return (
        p.court.toLowerCase().includes(q) ||
        p.date.includes(q) ||
        p.time.includes(q) ||
        (host?.name || '').toLowerCase().includes(q)
      );
    });
  }, [matchingPosts, search, getUser]);

  return (
    <div className="space-y-5 pb-4">
      <SectionTitle
        title="매칭 관리"
        subtitle={`${matchingPosts.length}개 매칭글 · 호스트 및 참여 회원 조회`}
        right={
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="검색"
              className="input pl-9 py-2 text-sm w-44"
            />
          </div>
        }
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users size={28} />}
          title="매칭글이 없어요"
          description="아직 등록된 매칭글이 없습니다."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((post) => {
            const host = getUser(post.userId);
            const approvedCount = post.applications.filter((a) => a.status === '승인').length;
            const pendingCount = post.applications.filter((a) => a.status === '대기').length;
            return (
              <button
                key={post.id}
                onClick={() => setDetailPost(post)}
                className="card p-4 text-left hover:border-navy-200 transition w-full"
              >
                <div className="flex items-start gap-3">
                  <img src={host?.profileImg} className="w-11 h-11 rounded-xl object-cover" alt="" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-navy-900">{host?.name}</p>
                      <span className={`chip ${post.status === '모집중' ? 'bg-volt-100 text-volt-800' : post.status === '모집완료' ? 'bg-navy-100 text-navy-700' : 'bg-slate-100 text-slate-500'}`}>
                        {post.status}
                      </span>
                      {!post.courtApproved && (
                        <span className="chip bg-amber-100 text-amber-700">
                          <Clock size={11} /> 대관 승인 대기
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Calendar size={12} /> {post.date}</span>
                      <span className="flex items-center gap-1"><Clock size={12} /> {post.time}</span>
                      <span className="flex items-center gap-1"><MapPin size={12} /> {post.court}</span>
                      <span className="flex items-center gap-1"><Users size={12} /> {approvedCount + 1}/{post.maxPlayers}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="chip bg-slate-100 text-slate-600">
                        <Hand size={11} /> {GAME_TYPE_LABEL[post.gameType]}
                      </span>
                      <span className="chip bg-slate-100 text-slate-600">
                        {post.genderRequirement === 'male' ? <User size={11} /> : <UserCircle size={11} />}
                        {GENDER_LABEL[post.genderRequirement]}
                      </span>
                      <span className="chip bg-slate-100 text-slate-600">
                        NTRP {post.ntrpRequirement === 'any' ? '무관' : `${post.ntrpRequirement}+`}
                      </span>
                      {pendingCount > 0 && (
                        <span className="chip bg-amber-100 text-amber-700">대기 {pendingCount}</span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <Modal
        open={!!detailPost}
        onClose={() => setDetailPost(null)}
        title="매칭 상세"
        size="md"
        footer={
          <button className="btn-ghost" onClick={() => setDetailPost(null)}>닫기</button>
        }
      >
        {detailPost && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-navy-50 p-4">
              <p className="font-bold text-navy-900">{detailPost.court} · {detailPost.date} {detailPost.time}</p>
              <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{detailPost.description}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="chip bg-white text-navy-700"><Hand size={11} /> {GAME_TYPE_LABEL[detailPost.gameType]}</span>
                <span className="chip bg-white text-navy-700">
                  {detailPost.genderRequirement === 'male' ? <User size={11} /> : <UserCircle size={11} />}
                  {GENDER_LABEL[detailPost.genderRequirement]}
                </span>
                <span className="chip bg-white text-navy-700">NTRP {detailPost.ntrpRequirement === 'any' ? '무관' : `${detailPost.ntrpRequirement}+`}</span>
                <span className="chip bg-white text-navy-700"><Users size={11} /> {detailPost.maxPlayers}명</span>
              </div>
            </div>

            <div>
              <p className="text-sm font-bold text-navy-800 mb-2">호스트</p>
              <HostInfo userId={detailPost.userId} getUser={getUser} />
            </div>

            <div>
              <p className="text-sm font-bold text-navy-800 mb-2">
                참여 신청자 ({detailPost.applications.length})
              </p>
              {detailPost.applications.length === 0 ? (
                <p className="text-sm text-slate-400 py-3 text-center">신청자가 없습니다</p>
              ) : (
                <div className="space-y-2">
                  {detailPost.applications.map((app) => {
                    const u = getUser(app.userId);
                    return (
                      <div key={app.id} className="rounded-xl border border-slate-100 p-3">
                        <div className="flex items-center gap-3">
                          <img src={u?.profileImg} className="w-10 h-10 rounded-lg object-cover" alt="" />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-navy-900 text-sm">{u?.name}</p>
                            <p className="text-xs text-slate-500">
                              NTRP {u?.ntrp} · {u?.career} · {u?.phone}{app.gender ? ` · ${app.gender === 'male' ? '남성' : '여성'}` : ''}
                            </p>
                          </div>
                          {app.status === '승인' ? (
                            <span className="chip bg-volt-100 text-volt-800"><CheckCircle2 size={12} /> 승인</span>
                          ) : app.status === '거절' ? (
                            <span className="chip bg-rose-100 text-rose-700"><X size={12} /> 거절</span>
                          ) : (
                            <span className="chip bg-amber-100 text-amber-700"><Clock size={12} /> 대기</span>
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
          </div>
        )}
      </Modal>
    </div>
  );
}

function HostInfo({
  userId,
  getUser,
}: {
  userId: string;
  getUser: (id: string) => { name: string; profileImg: string; ntrp: string; career: string; phone: string } | undefined;
}) {
  const u = getUser(userId);
  if (!u) return <p className="text-sm text-slate-400">사용자 정보 없음</p>;
  return (
    <div className="rounded-xl border border-slate-100 p-3 flex items-center gap-3">
      <img src={u.profileImg} className="w-10 h-10 rounded-lg object-cover" alt="" />
      <div>
        <p className="font-bold text-navy-900 text-sm">{u.name}</p>
        <p className="text-xs text-slate-500">NTRP {u.ntrp} · {u.career} · {u.phone}</p>
      </div>
    </div>
  );
}
