import { useState } from "react";
import { Loader2, Mail, Lock, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { BRAND } from "@/config/brand";

interface AuthPageProps {
  onNavigate: (to: string) => void;
}

export function AuthPage({ onNavigate }: AuthPageProps) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = mode === "login"
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password);
      if (result.error) {
        setError(result.error);
      } else {
        onNavigate("/");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-ivory pt-20 md:pt-24 flex items-center justify-center px-5 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-xs font-semibold tracking-[0.25em] text-charcoal-muted">{BRAND.nameEn}</p>
          <h1 className="mt-3 font-serif text-3xl text-charcoal">
            {mode === "login" ? "로그인" : "회원가입"}
          </h1>
        </div>

        <div className="rounded-3xl border border-birch-200 bg-white p-6 sm:p-8">
          <div className="flex gap-2 mb-6 rounded-xl bg-birch-50 p-1">
            <button
              onClick={() => { setMode("login"); setError(null); }}
              className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors ${mode === "login" ? "bg-charcoal text-ivory" : "text-charcoal-muted"}`}
            >
              로그인
            </button>
            <button
              onClick={() => { setMode("signup"); setError(null); }}
              className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors ${mode === "signup" ? "bg-charcoal text-ivory" : "text-charcoal-muted"}`}
            >
              회원가입
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-charcoal">이메일</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="example@email.com"
                  className="w-full rounded-xl border border-birch-200 bg-white py-3 pl-10 pr-4 text-sm text-charcoal focus:border-birch-400 focus:outline-none focus:ring-2 focus:ring-birch-200"
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-charcoal">비밀번호</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-muted" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="6자 이상"
                  className="w-full rounded-xl border border-birch-200 bg-white py-3 pl-10 pr-4 text-sm text-charcoal focus:border-birch-400 focus:outline-none focus:ring-2 focus:ring-birch-200"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-charcoal py-3.5 text-sm font-medium text-ivory transition-all hover:bg-charcoal-light active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <User size={18} />
              )}
              {mode === "login" ? "로그인" : "가입하기"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-charcoal-muted">
            비회원으로도 상품 구매가 가능합니다.
          </p>
        </div>
      </div>
    </main>
  );
}
