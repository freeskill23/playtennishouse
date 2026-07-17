import {
  Ticket,
  BedDouble,
  CalendarRange,
  Users,
  Clock,
  Phone,
  Plus,
  Hand,
  CheckCircle2,
  LogOut,
  Pencil,
  KeyRound,
  Camera,
  Loader2,
} from 'lucide-react';
import { useApp } from '../store';
import { useAuth } from '../lib/auth';
import { SectionTitle, StatusBadge, EmptyState } from '../components/ui';
import { Modal } from '../components/Modal';
import { useState, useRef } from 'react';
import type { NTRP, GameType, GenderRequirement, Hand as HandType } from '../types';

const NTRP_OPTIONS: NTRP[] = ['1.5', '2.0', '2.5', '3.0', '3.5', '4.0', '4.5', '5.0', '5.5'];
const HAND_OPTIONS: { value: HandType; label: string }[] = [
  { value: 'right', label: '오른손' },
  { value: 'left', label: '왼손' },
  { value: 'both', label: '양손' },
];
const CAREER_OPTIONS = ['0년', '1년', '2년', '3년', '5년', '7년', '10년', '15년+'];

export function MyPageScreen({ go }: { go: (k: string) => void }) {
  const {
    currentUser,
    reservations,
    matchingPosts,
    createMatchingPostFromReservation,
    getUser,
    updateCurrentUser,
  } = useApp();
  const { signOut, updateProfile, changePassword, uploadProfileImage } = useAuth();
  const [matchingTarget, setMatchingTarget] = useState<string[] | null>(null);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [pwChangeOpen, setPwChangeOpen] = useState(false);

  const myReservations = reservations.filter((r) => r.userId === currentUser.id);
  const myMatchings = matchingPosts.filter((m) => m.userId === currentUser.id);
  const myAppliedMatchings = matchingPosts.filter((m) =>
    m.applications.some((a) => a.userId === currentUser.id),
  );

  // Group reservations by batchId (or individual id as fallback)
  const batchGroups = (() => {
    const map = new Map<string, typeof myReservations>();
    for (const r of myReservations) {
      const key = r.batchId || r.id;
      const arr = map.get(key) || [];
      arr.push(r);
      map.set(key, arr);
    }
    return Array.from(map.entries()).sort(([, a], [, b]) => (a[0].createdAt < b[0].createdAt ? 1 : -1));
  })();

  // Group eligible reservations by batchId
  const eligibleReservations = myReservations.filter(
    (r) => r.status === '예약완료' && r.waitingSequence === null && r.type === 'court',
  );
  const eligibleBatchGroups = (() => {
    const map = new Map<string, typeof eligibleReservations>();
    for (const r of eligibleReservations) {
      const key = r.batchId || r.id;
      const arr = map.get(key) || [];
      arr.push(r);
      map.set(key, arr);
    }
    return Array.from(map.entries()).sort(([, a], [, b]) => (a[0].createdAt < b[0].createdAt ? 1 : -1));
  })();

  // matching form state
  const [form, setForm] = useState<{
    ntrpRequirement: NTRP | 'any';
    genderRequirement: GenderRequirement;
    maxPlayers: number;
    gameType: GameType;
    description: string;
  }>({
    ntrpRequirement: 'any',
    genderRequirement: 'any',
    maxPlayers: 4,
    gameType: 'doubles',
    description: '',
  });

  const handleCreateMatching = () => {
    if (!matchingTarget) return;
    const res = createMatchingPostFromReservation({ reservationIds: matchingTarget, ...form });
    if (res.ok) {
      setMatchingTarget(null);
      setForm({
        ntrpRequirement: 'any',
        genderRequirement: 'any',
        maxPlayers: 4,
        gameType: 'doubles',
        description: '',
      });
    }
  };

  return (
    <div className="space-y-6 pb-4">
      {/* Profile */}
      <div className="card p-5">
        <div className="flex items-center gap-4">
          <img
            src={currentUser.profileImg}
            alt={currentUser.name}
            className="w-16 h-16 rounded-2xl object-cover"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-lg font-extrabold text-navy-900">{currentUser.name}</p>
              {currentUser.nickname && (
                <span className="text-sm font-semibold text-volt-700">({currentUser.nickname})</span>
              )}
            </div>
            <p className="text-sm text-slate-500">{currentUser.phone}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="chip bg-volt-100 text-volt-800">NTRP {currentUser.ntrp}</span>
              <span className="chip bg-navy-50 text-navy-700">구력 {currentUser.career}</span>
              <span className="chip bg-slate-100 text-slate-600">
                {currentUser.hand === 'right' ? '오른손' : currentUser.hand === 'left' ? '왼손' : '양손'}
              </span>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="shrink-0 rounded-xl px-3 py-2 text-sm font-semibold text-rose-500 hover:bg-rose-50 transition flex items-center gap-1.5"
          >
            <LogOut size={16} /> 로그아웃
          </button>
        </div>
        {currentUser.bio && (
          <p className="text-sm text-slate-600 mt-3 pt-3 border-t border-slate-100">{currentUser.bio}</p>
        )}
        <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
          <button
            onClick={() => setEditProfileOpen(true)}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold text-navy-800 bg-slate-100 hover:bg-slate-200 transition"
          >
            <Pencil size={15} /> 프로필 수정
          </button>
          <button
            onClick={() => setPwChangeOpen(true)}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold text-navy-800 bg-slate-100 hover:bg-slate-200 transition"
          >
            <KeyRound size={15} /> 비밀번호 변경
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatBox label="예약" value={myReservations.filter((r) => r.status !== '취소').length} icon={<Ticket size={16} />} tone="navy" />
        <StatBox label="모집 매칭" value={myMatchings.length} icon={<Users size={16} />} tone="volt" />
        <StatBox label="신청 매칭" value={myAppliedMatchings.length} icon={<Hand size={16} />} tone="sky" />
      </div>

      {/* My reservations - grouped by batch */}
      <div>
        <SectionTitle title="내 예약" subtitle="예약 및 대기 내역" />
        {myReservations.length === 0 ? (
          <EmptyState
            icon={<Ticket size={28} />}
            title="예약 내역이 없어요"
            action={<button className="btn-primary" onClick={() => go('pension')}>펜션 예약하러 가기</button>}
          />
        ) : (
          <div className="space-y-3">
            {batchGroups.map(([batchKey, items]) => {
              const date = items[0].date;
              const totalAmount = items.reduce((sum, r) => sum + r.amount, 0);
              return (
                <div key={batchKey}>
                  <div className="flex items-center gap-2 px-1 mb-1.5">
                    <CalendarRange size={14} className="text-volt-600" />
                    <span className="text-sm font-bold text-navy-900">{date}</span>
                    <span className="text-xs text-slate-400">({items.length}건 · {totalAmount.toLocaleString()}원)</span>
                  </div>
                  <div className="space-y-2">
                    {items.map((r) => (
                      <div key={r.id} className="card p-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${r.type === 'pension' ? 'bg-volt-100 text-volt-700' : 'bg-navy-50 text-navy-700'}`}>
                            {r.type === 'pension' ? <BedDouble size={18} /> : <CalendarRange size={18} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-navy-900">{r.targetLabel}</p>
                              {r.type === 'court' && r.timeSlot && <span className="chip bg-slate-100 text-slate-600">{r.timeSlot}</span>}
                              {r.waitingSequence && <span className="chip bg-amber-100 text-amber-700">대기 {r.waitingSequence}순위</span>}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {r.capacity && `${r.capacity}명`} · {r.amount.toLocaleString()}원
                            </p>
                            <div className="mt-2">
                              <StatusBadge status={r.status} />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create matching - grouped by batch */}
      {eligibleBatchGroups.length > 0 && (
        <div>
          <SectionTitle title="매칭글 작성" subtitle="예약완료 건으로 메이트를 모집하세요" />
          <div className="space-y-3">
            {eligibleBatchGroups.map(([batchKey, items]) => {
              const date = items[0].date;
              const timeLabel = items.map((r) => r.timeSlot).filter(Boolean).join(', ');
              const ids = items.map((r) => r.id);
              return (
                <div key={batchKey}>
                  <div className="flex items-center gap-2 px-1 mb-1.5">
                    <CalendarRange size={14} className="text-volt-600" />
                    <span className="text-sm font-bold text-navy-900">{date}</span>
                    <span className="text-xs text-slate-400">({items.length}건)</span>
                  </div>
                  <div className="space-y-2">
                    <div className="card p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-navy-50 text-navy-700">
                        <CalendarRange size={18} />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-navy-900">{items[0].targetLabel} {timeLabel}</p>
                        <p className="text-xs text-slate-500">총 {items.length}개 코트</p>
                      </div>
                      <button onClick={() => setMatchingTarget(ids)} className="btn-primary text-sm py-2 px-3">
                        <Plus size={16} /> 매칭 모집
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* My matchings */}
      <div>
        <SectionTitle title="내 매칭" subtitle="내가 모집한 / 신청한 매칭" />
        {myMatchings.length === 0 && myAppliedMatchings.length === 0 ? (
          <EmptyState icon={<Users size={28} />} title="매칭 내역이 없어요" />
        ) : (
          <div className="space-y-2">
            {myMatchings.map((m) => (
              <div key={m.id} className="card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-navy-900">{m.court} · {m.time}</p>
                    <p className="text-xs text-slate-500">{m.date} · {m.applications.length}명 신청</p>
                  </div>
                  <span className={`chip ${m.status === '모집중' ? 'bg-volt-100 text-volt-800' : 'bg-slate-100 text-slate-600'}`}>{m.status}</span>
                </div>
              </div>
            ))}
            {myAppliedMatchings.filter((m) => m.userId !== currentUser.id).map((m) => {
              const myApp = m.applications.find((a) => a.userId === currentUser.id);
              const host = getUser(m.userId);
              return (
                <div key={m.id} className="card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-navy-900">{host?.name}님 매칭 · {m.court}</p>
                      <p className="text-xs text-slate-500">{m.date} {m.time}</p>
                    </div>
                    {myApp?.status === '승인' ? (
                      <span className="chip bg-volt-100 text-volt-800"><CheckCircle2 size={12} /> 승인</span>
                    ) : (
                      <span className="chip bg-amber-100 text-amber-700"><Clock size={12} /> 대기</span>
                    )}
                  </div>
                  {myApp?.status === '승인' && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-sm">
                      <Phone size={14} className="text-volt-700" />
                      <span className="font-bold text-navy-900">{host?.phone}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Matching form */}
      <Modal
        open={!!matchingTarget}
        onClose={() => setMatchingTarget(null)}
        title="매칭 모집글 작성"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setMatchingTarget(null)}>취소</button>
            <button className="btn-primary" onClick={handleCreateMatching}>등록하기</button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">구력 요건 (NTRP)</label>
            <div className="flex flex-wrap gap-1.5">
              {(['any', '2.5', '3.0', '3.5', '4.0', '4.5'] as const).map((n) => (
                <button
                  key={n}
                  onClick={() => setForm((f) => ({ ...f, ntrpRequirement: n }))}
                  className={`chip ${form.ntrpRequirement === n ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                  {n === 'any' ? '무관' : n + '+'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">성별 요건</label>
            <div className="flex gap-1.5">
              {(['any', 'male', 'female'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setForm((f) => ({ ...f, genderRequirement: g }))}
                  className={`chip ${form.genderRequirement === g ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                  {g === 'any' ? '무관' : g === 'male' ? '남성' : '여성'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">게임 유형</label>
            <div className="flex gap-1.5 flex-wrap">
              {(['singles', 'doubles', 'mixed', 'women_doubles', 'men_doubles', 'any'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setForm((f) => ({ ...f, gameType: g }))}
                  className={`chip ${form.gameType === g ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                  {g === 'singles' ? '단식' : g === 'doubles' ? '복식' : g === 'mixed' ? '혼복' : g === 'women_doubles' ? '여복' : g === 'men_doubles' ? '남복' : '무관'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">모집 인원</label>
            <input
              type="number"
              min={2}
              max={8}
              value={form.maxPlayers}
              onChange={(e) => setForm((f) => ({ ...f, maxPlayers: Number(e.target.value) }))}
              className="input"
            />
          </div>
          <div>
            <label className="label">설명</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="예: 편하게 복식 한 게임 어때요! NTRP 3.0 이상 환영합니다."
              className="input min-h-[80px]"
            />
          </div>
        </div>
      </Modal>

      {/* Profile edit modal */}
      <EditProfileModal
        open={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
        currentUser={currentUser}
        updateProfile={updateProfile}
        uploadProfileImage={uploadProfileImage}
        onUpdated={(patch) => updateCurrentUser(patch)}
      />

      {/* Password change modal */}
      <PasswordChangeModal
        open={pwChangeOpen}
        onClose={() => setPwChangeOpen(false)}
        changePassword={changePassword}
      />
    </div>
  );
}

/* ---------- Edit Profile Modal ---------- */

function EditProfileModal({
  open,
  onClose,
  currentUser,
  updateProfile,
  uploadProfileImage,
  onUpdated,
}: {
  open: boolean;
  onClose: () => void;
  currentUser: ReturnType<typeof useApp>['currentUser'];
  updateProfile: ReturnType<typeof useAuth>['updateProfile'];
  uploadProfileImage: ReturnType<typeof useAuth>['uploadProfileImage'];
  onUpdated: (patch: Partial<ReturnType<typeof useApp>['currentUser']>) => void;
}) {
  const [name, setName] = useState(currentUser.name);
  const [nickname, setNickname] = useState(currentUser.nickname || '');
  const [phone, setPhone] = useState(currentUser.phone);
  const [ntrp, setNtrp] = useState<string>(currentUser.ntrp);
  const [career, setCareer] = useState(currentUser.career);
  const [hand, setHand] = useState<HandType>(currentUser.hand);
  const [bio, setBio] = useState(currentUser.bio || '');
  const [profileImg, setProfileImg] = useState(currentUser.profileImg);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    const res = await uploadProfileImage(file);
    setUploading(false);
    if (res.ok && res.url) {
      setProfileImg(res.url);
    } else {
      setError(res.error || '이미지 업로드에 실패했습니다.');
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }
    setSaving(true);
    setError('');
    const patch = { name, nickname, phone, ntrp: ntrp as NTRP, career, hand, bio, profileImg };
    const res = await updateProfile(patch);
    setSaving(false);
    if (res.ok) {
      onUpdated(patch);
      onClose();
    } else {
      setError(res.error || '저장에 실패했습니다.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="프로필 수정"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>취소</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving || uploading}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : null}
            {saving ? '저장 중...' : '저장하기'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Profile image */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            <img
              src={profileImg}
              alt="프로필"
              className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-200"
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-navy-900 text-white flex items-center justify-center shadow-lg hover:bg-navy-800 transition disabled:opacity-50"
              aria-label="사진 변경"
            >
              {uploading ? <Loader2 size={13} className="animate-spin" /> : <Camera size={14} />}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>
          <p className="text-xs text-slate-400">사진을 눌러 프로필 이미지 변경</p>
        </div>

        {/* Name */}
        <div>
          <label className="label">이름</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder="이름"
          />
        </div>

        {/* Nickname */}
        <div>
          <label className="label">닉네임</label>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="input"
            placeholder="닉네임"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="label">연락처</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input"
            placeholder="010-0000-0000"
          />
        </div>

        {/* NTRP */}
        <div>
          <label className="label">NTRP</label>
          <div className="flex flex-wrap gap-1.5">
            {NTRP_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => setNtrp(n)}
                className={`chip ${ntrp === n ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-600'}`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Career */}
        <div>
          <label className="label">구력</label>
          <div className="flex flex-wrap gap-1.5">
            {CAREER_OPTIONS.map((c) => (
              <button
                key={c}
                onClick={() => setCareer(c)}
                className={`chip ${career === c ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-600'}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Hand */}
        <div>
          <label className="label">주사용 손</label>
          <div className="flex gap-1.5">
            {HAND_OPTIONS.map((h) => (
              <button
                key={h.value}
                onClick={() => setHand(h.value)}
                className={`chip ${hand === h.value ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-600'}`}
              >
                {h.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="label">소개</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="input min-h-[70px]"
            placeholder="간단한 소개를 작성해주세요"
          />
        </div>

        {error && <p className="text-sm text-rose-500 font-semibold">{error}</p>}
      </div>
    </Modal>
  );
}

/* ---------- Password Change Modal ---------- */

function PasswordChangeModal({
  open,
  onClose,
  changePassword,
}: {
  open: boolean;
  onClose: () => void;
  changePassword: ReturnType<typeof useAuth>['changePassword'];
}) {
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (!currentPw || !newPw || !confirmPw) {
      setError('모든 필드를 입력해주세요.');
      return;
    }
    if (newPw.length < 6) {
      setError('새 비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    if (newPw !== confirmPw) {
      setError('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    setSaving(true);
    const res = await changePassword(currentPw, newPw);
    setSaving(false);
    if (res.ok) {
      setSuccess(true);
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } else {
      setError(res.error || '비밀번호 변경에 실패했습니다.');
    }
  };

  const handleClose = () => {
    setCurrentPw('');
    setNewPw('');
    setConfirmPw('');
    setError('');
    setSuccess(false);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="비밀번호 변경"
      size="sm"
      footer={
        <>
          <button className="btn-ghost" onClick={handleClose}>취소</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : null}
            {saving ? '변경 중...' : '변경하기'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {success ? (
          <div className="flex flex-col items-center py-6 text-center">
            <CheckCircle2 size={40} className="text-volt-500 mb-3" />
            <p className="font-bold text-navy-900">비밀번호가 변경되었습니다.</p>
          </div>
        ) : (
          <>
            <div>
              <label className="label">현재 비밀번호</label>
              <input
                type="password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                className="input"
                placeholder="현재 비밀번호"
                autoComplete="current-password"
              />
            </div>
            <div>
              <label className="label">새 비밀번호</label>
              <input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                className="input"
                placeholder="새 비밀번호 (6자 이상)"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="label">새 비밀번호 확인</label>
              <input
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                className="input"
                placeholder="새 비밀번호 재입력"
                autoComplete="new-password"
              />
            </div>
            {error && <p className="text-sm text-rose-500 font-semibold">{error}</p>}
          </>
        )}
      </div>
    </Modal>
  );
}

function StatBox({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: 'navy' | 'volt' | 'sky';
}) {
  const toneCls =
    tone === 'navy' ? 'bg-navy-50 text-navy-700' : tone === 'volt' ? 'bg-volt-100 text-volt-700' : 'bg-sky-50 text-sky-700';
  return (
    <div className="card p-3.5">
      <div className={`w-8 h-8 rounded-lg ${toneCls} flex items-center justify-center mb-1.5`}>{icon}</div>
      <p className="text-xl font-extrabold text-navy-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
