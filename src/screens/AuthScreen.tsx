import { useState } from 'react';
import { LogIn, UserPlus, Mail, Lock, User as UserIcon, Phone, Loader2, Check } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { Logo } from '../components/Logo';

type Mode = 'login' | 'signup';

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);

    if (mode === 'login') {
      const res = await signIn(email.trim(), password);
      if (!res.ok) setError(res.error || '로그인에 실패했습니다.');
    } else {
      if (name.trim().length < 2) {
        setError('이름은 2자 이상 입력하세요.');
        setBusy(false);
        return;
      }
      if (password.length < 6) {
        setError('비밀번호는 6자 이상 입력하세요.');
        setBusy(false);
        return;
      }
      const res = await signUp({
        email: email.trim(),
        password,
        name: name.trim(),
        phone: phone.trim(),
        marketingConsent,
      });
      if (!res.ok) setError(res.error || '회원가입에 실패했습니다.');
    }
    setBusy(false);
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError('');
    setPassword('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-950 px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <Logo size={96} />
          <h1 className="mt-4 text-2xl font-extrabold text-white tracking-tight">PLAY TENNIS HOUSE</h1>
          <p className="text-xs text-white/50 mt-1">테니스 펜션 예약 &amp; 매칭 서비스</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-2xl animate-slide-up">
          <div className="flex gap-1 mb-5 rounded-xl bg-slate-100 p-1">
            <button
              onClick={() => switchMode('login')}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${
                mode === 'login' ? 'bg-navy-900 text-white shadow' : 'text-slate-500'
              }`}
            >
              로그인
            </button>
            <button
              onClick={() => switchMode('signup')}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${
                mode === 'signup' ? 'bg-navy-900 text-white shadow' : 'text-slate-500'
              }`}
            >
              회원가입
            </button>
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === 'signup' && (
              <>
                <Field icon={<UserIcon size={16} />}>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="이름"
                    className="w-full bg-transparent outline-none text-sm text-navy-900 placeholder:text-slate-400"
                  />
                </Field>
                <Field icon={<Phone size={16} />}>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="전화번호 (010-0000-0000)"
                    className="w-full bg-transparent outline-none text-sm text-navy-900 placeholder:text-slate-400"
                  />
                </Field>
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={marketingConsent}
                    onClick={() => setMarketingConsent((v) => !v)}
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                      marketingConsent
                        ? 'bg-volt-500 border-volt-500 text-navy-950'
                        : 'bg-white border-slate-300'
                    }`}
                  >
                    {marketingConsent && <Check size={14} strokeWidth={3} />}
                  </button>
                  <span className="text-xs text-slate-600 leading-relaxed">
                    플테하 이벤트 및 프로모션 발송 동의함
                  </span>
                </label>
              </>
            )}
            <Field icon={<Mail size={16} />}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일"
                autoComplete="email"
                required
                className="w-full bg-transparent outline-none text-sm text-navy-900 placeholder:text-slate-400"
              />
            </Field>
            <Field icon={<Lock size={16} />}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호 (6자 이상)"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
                className="w-full bg-transparent outline-none text-sm text-navy-900 placeholder:text-slate-400"
              />
            </Field>

            {error && (
              <p className="text-rose-500 text-xs font-medium animate-fade-in">{error}</p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full py-3 rounded-xl bg-volt-500 text-navy-950 font-bold hover:bg-volt-400 active:scale-[0.98] transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {busy ? (
                <Loader2 size={18} className="animate-spin" />
              ) : mode === 'login' ? (
                <>
                  <LogIn size={18} /> 로그인
                </>
              ) : (
                <>
                  <UserPlus size={18} /> 회원가입
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-4">
            {mode === 'login' ? (
              <>
                계정이 없으신가요?{' '}
                <button
                  onClick={() => switchMode('signup')}
                  className="text-navy-700 font-bold hover:underline"
                >
                  회원가입
                </button>
              </>
            ) : (
              <>
                이미 계정이 있으신가요?{' '}
                <button
                  onClick={() => switchMode('login')}
                  className="text-navy-700 font-bold hover:underline"
                >
                  로그인
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-3 transition focus-within:border-volt-400 focus-within:ring-2 focus-within:ring-volt-100">
      <span className="text-slate-400 shrink-0">{icon}</span>
      {children}
    </div>
  );
}
