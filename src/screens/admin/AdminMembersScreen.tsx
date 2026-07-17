import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Phone,
  KeyRound,
  AlertTriangle,
  Check,
  Search,
  Loader2,
  ShieldAlert,
  Megaphone,
  Download,
  BellRing,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { SectionTitle, EmptyState } from '../../components/ui';
import { Modal } from '../../components/Modal';

interface MemberRow {
  id: string;
  email: string;
  name: string;
  nickname: string | null;
  phone: string | null;
  career: string | null;
  ntrp: string | null;
  is_bad_member: boolean;
  bad_member_reason: string | null;
  marketing_consent: boolean | null;
  created_at: string;
}

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL || 'https://rmjqdogzumxqrhhiiley.supabase.co'}/functions/v1/admin-users`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export function AdminMembersScreen() {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [pwModal, setPwModal] = useState<MemberRow | null>(null);
  const [newPw, setNewPw] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [badModal, setBadModal] = useState<MemberRow | null>(null);
  const [badReason, setBadReason] = useState('');
  const [badBusy, setBadBusy] = useState(false);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${FUNCTION_URL}?action=list`, {
        headers: { Authorization: `Bearer ${ANON_KEY}`, apikey: ANON_KEY },
      });
      if (!res.ok) throw new Error(`목록 조회 실패 (${res.status})`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMembers(data.users || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const filtered = members.filter((m) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      m.email.toLowerCase().includes(q) ||
      m.name.toLowerCase().includes(q) ||
      (m.phone || '').includes(q)
    );
  });

  const handleChangePassword = async () => {
    if (!pwModal || newPw.length < 6) return;
    setPwBusy(true);
    setPwMsg(null);
    try {
      const res = await fetch(`${FUNCTION_URL}?action=change_password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ANON_KEY}`,
          apikey: ANON_KEY,
        },
        body: JSON.stringify({ userId: pwModal.id, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || '변경 실패');
      setPwMsg({ ok: true, text: '비밀번호가 변경되었습니다.' });
      setNewPw('');
      setTimeout(() => {
        setPwModal(null);
        setPwMsg(null);
      }, 1200);
    } catch (e) {
      setPwMsg({ ok: false, text: e instanceof Error ? e.message : '오류' });
    } finally {
      setPwBusy(false);
    }
  };

  const handleSetBadMember = async () => {
    if (!badModal) return;
    setBadBusy(true);
    try {
      const res = await fetch(`${FUNCTION_URL}?action=set_bad_member`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ANON_KEY}`,
          apikey: ANON_KEY,
        },
        body: JSON.stringify({
          userId: badModal.id,
          isBad: !badModal.is_bad_member,
          reason: badReason,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || '실패');
      setMembers((prev) =>
        prev.map((m) =>
          m.id === badModal.id
            ? {
                ...m,
                is_bad_member: !badModal.is_bad_member,
                bad_member_reason: !badModal.is_bad_member ? badReason : null,
              }
            : m,
        ),
      );
      setBadModal(null);
      setBadReason('');
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류');
    } finally {
      setBadBusy(false);
    }
  };

  const handleExportSmsList = () => {
    const consented = members.filter(
      (m) => m.marketing_consent && m.phone && !m.is_bad_member,
    );
    if (consented.length === 0) {
      alert('동의한 회원이 없습니다.');
      return;
    }
    const content = consented.map((m) => m.phone).join('\n') + '\n';
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `플테하_광고문자발송목록_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 pb-4">
      <SectionTitle
        title="회원 목록"
        subtitle="회원 정보 조회 · 비밀번호 변경 · 불량회원 관리"
        right={
          <div className="flex items-center gap-2">
            <span className="chip bg-navy-50 text-navy-700">
              <Users size={14} /> {members.length}명
            </span>
            <button
              onClick={handleExportSmsList}
              className="btn-primary text-sm py-1.5 px-3 flex items-center gap-1.5"
            >
              <Megaphone size={14} /> 광고문자 발송목록 만들기
            </button>
          </div>
        }
      />

      {/* Search */}
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
        <Search size={16} className="text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="이름 · 이메일 · 연락처 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-sm text-navy-900 outline-none"
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12 text-slate-400">
          <Loader2 size={24} className="animate-spin" />
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-100 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <EmptyState icon={<Users size={28} />} title="회원이 없습니다" />
      )}

      {/* Member list */}
      {!loading && !error && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((m) => (
            <div
              key={m.id}
              className={`card p-4 ${m.is_bad_member ? 'border-rose-200 bg-rose-50/40' : ''}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-navy-900">{m.name}</p>
                    {m.nickname && m.nickname !== m.name && (
                      <span className="text-xs text-slate-400">({m.nickname})</span>
                    )}
                    {m.is_bad_member && (
                      <span className="chip bg-rose-100 text-rose-700">
                        <ShieldAlert size={12} /> 불량회원
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
                    <span className="font-mono">{m.email}</span>
                    <span className="flex items-center gap-1">
                      <Phone size={11} /> {m.phone || '연락처 없음'}
                    </span>
                    {m.marketing_consent && (
                      <span className="flex items-center gap-0.5 text-volt-700">
                        <BellRing size={11} /> 동의
                      </span>
                    )}
                    <span>구력 {m.career || '0년'}</span>
                    <span>NTRP {m.ntrp || '2.0'}</span>
                  </div>
                  {m.is_bad_member && m.bad_member_reason && (
                    <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-rose-100/60 px-2.5 py-1.5 text-xs text-rose-700">
                      <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                      <span>{m.bad_member_reason}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => {
                    setPwModal(m);
                    setNewPw('');
                    setPwMsg(null);
                  }}
                  className="btn-outline text-sm py-2 px-3 flex items-center gap-1.5"
                >
                  <KeyRound size={14} /> 비밀번호 변경
                </button>
                <button
                  onClick={() => {
                    setBadModal(m);
                    setBadReason(m.bad_member_reason || '');
                  }}
                  className={`text-sm py-2 px-3 rounded-xl font-bold transition flex items-center gap-1.5 ${
                    m.is_bad_member
                      ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                  }`}
                >
                  <ShieldAlert size={14} />
                  {m.is_bad_member ? '해제' : '불량회원 지정'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Password change modal */}
      <Modal
        open={!!pwModal}
        onClose={() => setPwModal(null)}
        title="비밀번호 변경"
        size="sm"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setPwModal(null)}>
              취소
            </button>
            <button
              className="btn-primary"
              onClick={handleChangePassword}
              disabled={pwBusy || newPw.length < 6}
            >
              {pwBusy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              변경
            </button>
          </>
        }
      >
        {pwModal && (
          <div className="space-y-3">
            <p className="text-sm text-navy-800">
              <span className="font-bold">{pwModal.name}</span>님 ({pwModal.email})의 비밀번호를
              새로 설정합니다.
            </p>
            <label className="block">
              <span className="text-xs font-semibold text-navy-600 mb-1 block">새 비밀번호</span>
              <input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="6자 이상"
                autoFocus
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-navy-900 focus:border-volt-400 focus:ring-2 focus:ring-volt-100 outline-none"
              />
            </label>
            {pwMsg && (
              <p
                className={`text-xs ${pwMsg.ok ? 'text-volt-700' : 'text-rose-600'}`}
              >
                {pwMsg.text}
              </p>
            )}
            <p className="text-xs text-slate-400">
              관리자가 임의로 비밀번호를 재설정합니다. 사용자에게 새 비밀번호를 전달해 주세요.
            </p>
          </div>
        )}
      </Modal>

      {/* Bad member modal */}
      <Modal
        open={!!badModal}
        onClose={() => setBadModal(null)}
        title={badModal?.is_bad_member ? '불량회원 해제' : '불량회원 지정'}
        size="sm"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setBadModal(null)}>
              취소
            </button>
            <button
              className={badModal?.is_bad_member ? 'btn-primary' : 'btn-danger'}
              onClick={handleSetBadMember}
              disabled={badBusy}
            >
              {badBusy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              {badModal?.is_bad_member ? '해제' : '지정'}
            </button>
          </>
        }
      >
        {badModal && (
          <div className="space-y-3">
            <p className="text-sm text-navy-800">
              <span className="font-bold">{badModal.name}</span>님을{' '}
              {badModal.is_bad_member ? '불량회원에서 해제' : '불량회원으로 지정'}합니다.
            </p>
            {!badModal.is_bad_member && (
              <label className="block">
                <span className="text-xs font-semibold text-navy-600 mb-1 block">
                  사유 (한 줄)
                </span>
                <input
                  type="text"
                  value={badReason}
                  onChange={(e) => setBadReason(e.target.value)}
                  placeholder="예: 무단 노쇼, 입금 지연 반복 등"
                  autoFocus
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-navy-900 focus:border-volt-400 focus:ring-2 focus:ring-volt-100 outline-none"
                />
              </label>
            )}
            {badModal.is_bad_member && (
              <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700">
                현재 사유: {badModal.bad_member_reason || '사유 없음'}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
