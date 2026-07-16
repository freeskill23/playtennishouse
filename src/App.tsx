import { useState, useEffect } from 'react';
import {
  Home as HomeIcon,
  BedDouble,
  CalendarRange,
  Users,
  Megaphone,
  Ticket,
  LayoutDashboard,
  CheckSquare,
  Bell,
  Menu,
  X,
  Lock,
  LogOut,
  Loader2,
} from 'lucide-react';
import { AppProvider, useApp } from './store';
import { AuthProvider, useAuth } from './lib/auth';
import type { LucideIcon } from 'lucide-react';
import { Logo } from './components/Logo';
import { ToastStack } from './components/Toast';
import { HomeScreen } from './screens/HomeScreen';
import { PensionScreen } from './screens/PensionScreen';
import { CourtScreen } from './screens/CourtScreen';
import { MatchingScreen } from './screens/MatchingScreen';
import { MyPageScreen } from './screens/MyPageScreen';
import { NoticesScreen } from './screens/NoticesScreen';
import { AdminDashboardScreen } from './screens/admin/AdminDashboardScreen';
import { AdminApprovalScreen } from './screens/admin/AdminApprovalScreen';
import { AdminNoticeScreen } from './screens/admin/AdminNoticeScreen';
import { AdminNotificationScreen } from './screens/admin/AdminNotificationScreen';
import { AuthScreen } from './screens/AuthScreen';

type UserTab = 'home' | 'pension' | 'court' | 'matching' | 'notices' | 'mypage';
type AdminTab = 'dashboard' | 'approval' | 'notice' | 'notification';

const USER_NAV: { key: UserTab; label: string; icon: LucideIcon }[] = [
  { key: 'home', label: '홈', icon: HomeIcon },
  { key: 'pension', label: '펜션예약', icon: BedDouble },
  { key: 'court', label: '코트예약', icon: CalendarRange },
  { key: 'matching', label: '매칭', icon: Users },
  { key: 'notices', label: '공지', icon: Megaphone },
  { key: 'mypage', label: '내예약', icon: Ticket },
];

const ADMIN_NAV: { key: AdminTab; label: string; icon: LucideIcon }[] = [
  { key: 'dashboard', label: '캘린더', icon: LayoutDashboard },
  { key: 'approval', label: '승인관리', icon: CheckSquare },
  { key: 'notice', label: '공지관리', icon: Megaphone },
  { key: 'notification', label: '알림로그', icon: Bell },
];

const ADMIN_PASSWORD = 'admin123';
const AUTH_KEY = 'pth-admin-authed';

function useAdminRoute(): boolean {
  const [isAdmin, setIsAdmin] = useState(() => window.location.hash.replace('#', '') === 'admin');
  useEffect(() => {
    const onHash = () => setIsAdmin(window.location.hash.replace('#', '') === 'admin');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  return isAdmin;
}

function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const { logoImageUrl } = useApp();
  const [pw, setPw] = useState('');
  const [err, setErr] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) {
      sessionStorage.setItem(AUTH_KEY, '1');
      onSuccess();
    } else {
      setErr(true);
      setPw('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-950 px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Logo size={56} imageUrl={logoImageUrl} />
        </div>
        <form onSubmit={submit} className="rounded-2xl bg-white p-6 shadow-2xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-navy-900 flex items-center justify-center">
              <Lock size={18} className="text-volt-400" />
            </div>
            <div>
              <h1 className="font-bold text-navy-900">관리자 로그인</h1>
              <p className="text-xs text-slate-400">비밀번호를 입력하세요</p>
            </div>
          </div>
          <input
            type="password"
            value={pw}
            onChange={(e) => {
              setPw(e.target.value);
              setErr(false);
            }}
            placeholder="관리자 비밀번호"
            autoFocus
            className={`w-full rounded-xl border px-4 py-3 text-navy-900 outline-none transition ${
              err ? 'border-rose-400 ring-2 ring-rose-100' : 'border-slate-200 focus:border-volt-400 focus:ring-2 focus:ring-volt-100'
            }`}
          />
          {err && <p className="text-rose-500 text-xs mt-2">비밀번호가 올바르지 않습니다.</p>}
          <button
            type="submit"
            className="w-full mt-4 py-3 rounded-xl bg-navy-900 text-white font-bold hover:bg-navy-800 transition"
          >
            로그인
          </button>
          <a
            href={window.location.pathname}
            className="block text-center mt-3 text-xs text-slate-400 hover:text-navy-600"
          >
            ← 일반 화면으로
          </a>
        </form>
      </div>
    </div>
  );
}

function UserShell() {
  const { currentUser, logoImageUrl } = useApp();
  const { signOut } = useAuth();
  const [tab, setTab] = useState<UserTab>('home');
  const [mobileMenu, setMobileMenu] = useState(false);

  const go = (k: string) => {
    setTab(k as UserTab);
    setMobileMenu(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <button onClick={() => go('home')} className="shrink-0">
            <Logo size={36} imageUrl={logoImageUrl} />
          </button>
          <nav className="hidden md:flex items-center gap-1">
            {USER_NAV.map((n) => {
              const Icon = n.icon;
              const active = tab === n.key;
              return (
                <button
                  key={n.key}
                  onClick={() => go(n.key)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition ${
                    active ? 'bg-navy-900 text-white' : 'text-navy-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon size={16} />
                  {n.label}
                </button>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <img
              src={currentUser.profileImg}
              alt={currentUser.name}
              className="w-9 h-9 rounded-full object-cover border-2 border-volt-300 hidden sm:block"
            />
            <button
              onClick={() => signOut()}
              className="rounded-lg p-2 text-navy-800 hover:bg-slate-100 transition"
              aria-label="로그아웃"
              title="로그아웃"
            >
              <LogOut size={18} />
            </button>
            <button
              onClick={() => setMobileMenu((s) => !s)}
              className="md:hidden rounded-lg p-2 text-navy-800 hover:bg-slate-100"
              aria-label="메뉴"
            >
              {mobileMenu ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        {mobileMenu && (
          <nav className="md:hidden border-t border-slate-100 bg-white animate-slide-up">
            <div className="max-w-6xl mx-auto px-4 py-2 grid grid-cols-3 gap-1">
              {USER_NAV.map((n) => {
                const Icon = n.icon;
                const active = tab === n.key;
                return (
                  <button
                    key={n.key}
                    onClick={() => go(n.key)}
                    className={`flex flex-col items-center gap-1 py-3 rounded-xl text-xs font-semibold transition ${
                      active ? 'bg-navy-900 text-white' : 'text-navy-700 hover:bg-slate-100'
                    }`}
                  >
                    <Icon size={18} />
                    {n.label}
                  </button>
                );
              })}
            </div>
          </nav>
        )}
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {tab === 'home' && <HomeScreen go={go} />}
        {tab === 'pension' && <PensionScreen />}
        {tab === 'court' && <CourtScreen />}
        {tab === 'matching' && <MatchingScreen />}
        {tab === 'notices' && <NoticesScreen />}
        {tab === 'mypage' && <MyPageScreen go={go} />}
      </main>

      <footer className="border-t border-slate-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <Logo size={28} imageUrl={logoImageUrl} />
          <p className="text-xs text-slate-400">
            © 2026 PLAY TENNIS HOUSE · 테니스 펜션 예약 & 매칭 서비스
          </p>
        </div>
      </footer>

      <ToastStack />
    </div>
  );
}

function AdminShell() {
  const { notifications, logoImageUrl } = useApp();
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(AUTH_KEY) === '1');
  const [tab, setTab] = useState<AdminTab>('dashboard');
  const [mobileMenu, setMobileMenu] = useState(false);

  if (!authed) return <AdminLogin onSuccess={() => setAuthed(true)} />;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const go = (k: string) => {
    setTab(k as AdminTab);
    setMobileMenu(false);
  };

  const logout = () => {
    sessionStorage.removeItem(AUTH_KEY);
    setAuthed(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="sticky top-0 z-40 bg-navy-950 text-white">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <button onClick={() => go('dashboard')} className="shrink-0">
            <Logo size={36} imageUrl={logoImageUrl} />
          </button>
          <span className="hidden sm:inline text-xs font-bold text-volt-400 tracking-widest">
            ADMIN
          </span>
          <nav className="hidden md:flex items-center gap-1">
            {ADMIN_NAV.map((n) => {
              const Icon = n.icon;
              const active = tab === n.key;
              return (
                <button
                  key={n.key}
                  onClick={() => go(n.key)}
                  className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition ${
                    active ? 'bg-volt-500 text-navy-950' : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  <Icon size={16} />
                  {n.label}
                  {n.key === 'notification' && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <button
              onClick={logout}
              className="text-xs font-bold text-white/60 hover:text-white transition px-3 py-1.5"
            >
              로그아웃
            </button>
            <button
              onClick={() => setMobileMenu((s) => !s)}
              className="md:hidden rounded-lg p-2 text-white hover:bg-white/10"
              aria-label="메뉴"
            >
              {mobileMenu ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        {mobileMenu && (
          <nav className="md:hidden border-t border-white/10 bg-navy-950 animate-slide-up">
            <div className="max-w-6xl mx-auto px-4 py-2 grid grid-cols-2 gap-1">
              {ADMIN_NAV.map((n) => {
                const Icon = n.icon;
                const active = tab === n.key;
                return (
                  <button
                    key={n.key}
                    onClick={() => go(n.key)}
                    className={`flex flex-col items-center gap-1 py-3 rounded-xl text-xs font-semibold transition ${
                      active ? 'bg-volt-500 text-navy-950' : 'text-white/80 hover:bg-white/10'
                    }`}
                  >
                    <Icon size={18} />
                    {n.label}
                  </button>
                );
              })}
            </div>
          </nav>
        )}
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {tab === 'dashboard' && <AdminDashboardScreen />}
        {tab === 'approval' && <AdminApprovalScreen />}
        {tab === 'notice' && <AdminNoticeScreen />}
        {tab === 'notification' && <AdminNotificationScreen />}
      </main>

      <ToastStack />
    </div>
  );
}

function Shell() {
  const isAdmin = useAdminRoute();
  const { user, loading } = useAuth();

  if (isAdmin) return <AdminShell />;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-950">
        <Loader2 size={32} className="animate-spin text-volt-400" />
      </div>
    );
  }

  if (!user) return <AuthScreen />;

  return (
    <AppProvider authUser={user}>
      <UserShell />
    </AppProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}
