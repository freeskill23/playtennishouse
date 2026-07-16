import { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { useApp } from '../store';
import { SectionTitle, EmptyState, Pill } from '../components/ui';
import { Modal } from '../components/Modal';
import type { MatchingPost, NTRP, GameType, GenderRequirement } from '../types';

const NTRP_OPTIONS: (NTRP | 'any')[] = ['any', '2.0', '2.5', '3.0', '3.5', '4.0', '4.5'];
const GAME_TYPE_LABEL: Record<GameType, string> = {
  singles: '단식',
  doubles: '복식',
  mixed: '혼성',
};
const GENDER_LABEL: Record<GenderRequirement, string> = {
  male: '남성',
  female: '여성',
  any: '무관',
};

export function MatchingScreen() {
  const { matchingPosts, getUser, currentUser, applyMatching, approveMatchingApplication } = useApp();
  const [filterNtrp, setFilterNtrp] = useState<NTRP | 'any'>('any');
  const [filterGender, setFilterGender] = useState<GenderRequirement | 'all'>('all');
  const [filterDate, setFilterDate] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPost, setSelectedPost] = useState<MatchingPost | null>(null);
  const [contactModal, setContactModal] = useState<{ name: string; phone: string } | null>(null);

  const filtered = useMemo(() => {
    return matchingPosts.filter((p) => {
      if (p.status !== '모집중' && p.status !== '모집완료') return false;
      if (filterNtrp !== 'any' && p.ntrpRequirement !== 'any' && p.ntrpRequirement !== filterNtrp) return false;
      if (filterGender !== 'all' && p.genderRequirement !== filterGender) return false;
      if (filterDate && p.date !== filterDate) return false;
      return true;
    });
  }, [matchingPosts, filterNtrp, filterGender, filterDate]);

  const handleApply = (post: MatchingPost) => {
    const res = applyMatching(post.id);
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
          <button
            onClick={() => setShowFilters((s) => !s)}
            className={`chip transition ${showFilters ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-600'}`}
          >
            <Filter size={14} /> 필터
          </button>
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
          description="필터를 조정하거나 나중에 다시 확인해보세요."
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
                      <span className={`chip ${post.status === '모집중' ? 'bg-volt-100 text-volt-800' : 'bg-navy-100 text-navy-700'}`}>
                        {post.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Calendar size={12} /> {post.date}</span>
                      <span className="flex items-center gap-1"><Clock size={12} /> {post.time}</span>
                      <span className="flex items-center gap-1"><Users size={12} /> {approvedCount + 1}/{post.maxPlayers}</span>
                      <span className="flex items-center gap-1"><Hand size={12} /> {GAME_TYPE_LABEL[post.gameType]}</span>
                      <span className="flex items-center gap-1">
                        {post.genderRequirement === 'male' ? <User size={12} /> : post.genderRequirement === 'female' ? <UserCircle size={12} /> : <UserCircle size={12} />}
                        {GENDER_LABEL[post.genderRequirement]}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-navy-800 mt-3 leading-relaxed whitespace-pre-wrap">
                  {post.description}
                </p>

                <div className="flex items-center gap-2 mt-4">
                  <span className="chip bg-slate-100 text-slate-600">
                    NTRP {post.ntrpRequirement === 'any' ? '무관' : post.ntrpRequirement}+
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
                      <MessageSquare size={16} /> 신청자 관리 ({post.applications.length})
                    </button>
                  ) : myApp ? (
                    myApp.status === '승인' ? (
                      <button
                        onClick={() => setContactModal({ name: host?.name || '', phone: host?.phone || '' })}
                        className="btn-primary flex-1"
                      >
                        <Phone size={16} /> 연락처 보기
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
                      disabled={approvedCount >= post.maxPlayers - 1}
                    >
                      <UserPlus size={16} /> 매칭 신청하기
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
        footer={
          selectedPost && selectedPost.userId !== currentUser.id ? (
            <button
              className="btn-primary"
              onClick={() => handleApply(selectedPost)}
              disabled={!!selectedPost.applications.find((a) => a.userId === currentUser.id)}
            >
              <UserPlus size={16} /> 신청하기
            </button>
          ) : undefined
        }
      >
        {selectedPost && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-navy-50 p-4">
              <p className="font-bold text-navy-900">{selectedPost.court} · {selectedPost.date} {selectedPost.time}</p>
              <p className="text-sm text-slate-600 mt-1">{selectedPost.description}</p>
            </div>

            {selectedPost.userId === currentUser.id ? (
              <div>
                <p className="text-sm font-bold text-navy-800 mb-2">신청자 ({selectedPost.applications.length})</p>
                {selectedPost.applications.length === 0 ? (
                  <p className="text-sm text-slate-400 py-4 text-center">아직 신청자가 없어요</p>
                ) : (
                  <div className="space-y-2">
                    {selectedPost.applications.map((app) => {
                      const u = getUser(app.userId);
                      return (
                        <div key={app.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                          <img src={u?.profileImg} className="w-10 h-10 rounded-lg object-cover" alt="" />
                          <div className="flex-1">
                            <p className="font-bold text-navy-900 text-sm">{u?.name}</p>
                            <p className="text-xs text-slate-500">NTRP {u?.ntrp} · {u?.career}</p>
                          </div>
                          {app.status === '승인' ? (
                            <span className="chip bg-volt-100 text-volt-800"><CheckCircle2 size={12} /> 승인됨</span>
                          ) : (
                            <button
                              onClick={() => handleApprove(selectedPost, app.id)}
                              className="btn-primary text-sm py-1.5 px-3"
                            >
                              승인
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-slate-600 space-y-2">
                <p>호스트: {getUser(selectedPost.userId)?.name}</p>
                <p>모집 인원: {selectedPost.maxPlayers}명</p>
                <p>구력 요건: NTRP {selectedPost.ntrpRequirement === 'any' ? '무관' : selectedPost.ntrpRequirement + '+'}</p>
                <p>성별 요건: {GENDER_LABEL[selectedPost.genderRequirement]}</p>
                <p className="text-xs text-slate-400 mt-2">* 호스트 승인 후 연락처가 공개됩니다.</p>
              </div>
            )}
          </div>
        )}
      </Modal>

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
