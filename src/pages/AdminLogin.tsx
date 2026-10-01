import { useState, useEffect } from "react";
import { Lock, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { BRAND } from "@/config/brand";

interface AdminLoginProps {
  onNavigate: (to: string) => void;
}

export function AdminLogin({ onNavigate }: AdminLoginProps) {
  const { signIn, session } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) onNavigate("/admin");
  }, [session, onNavigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);
    const { error: signInError } = await signIn(email.trim(), password);
    if (signInError) {
      setError(signInError);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-birch-50 px-5">
      <div className="w-full max-w-md">
        <button
          onClick={() => onNavigate("/")}
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-charcoal-muted transition-colors hover:text-charcoal"
        >
          <ArrowLeft size={16} />
          홈으로
        </button>

        <div className="rounded-3xl border border-birch-200 bg-white p-8 shadow-[0_2px_40px_rgba(184,160,126,0.08)] sm:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-charcoal">
              <Lock size={24} className="text-ivory" />
            </div>
            <h1 className="mt-6 font-serif text-2xl text-charcoal">관리자 로그인</h1>
            <p className="mt-2 text-sm text-charcoal-muted">{BRAND.nameEn} 관리자 페이지</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-charcoal">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@cocosfurniture.kr"
                required
                className="input-field"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-charcoal">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="input-field"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle size={16} className="shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-charcoal px-6 py-3.5 text-sm font-medium text-ivory transition-all hover:bg-charcoal-light active:scale-[0.98] disabled:opacity-40"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  로그인 중...
                </>
              ) : (
                "로그인"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
