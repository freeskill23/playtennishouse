import { useState } from 'react';
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
  Shield,
  Menu,
  X,
  UserCircle,
} from 'lucide-react';
import { AppProvider, useApp } from './store';
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

function Shell() {
  const { role, setRole, currentUser, notifications, users, setCurrentUserId, logoImageUrl } = useApp();
  const [userTab, setUserTab] = useState<UserTab>('home');
  const [adminTab, setAdminTab] = useState<AdminTab>('dashboard');
  const [mobileMenu, setMobileMenu] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const isUser = role === 'user';
  const nav = isUser ? USER_NAV : ADMIN_NAV;
  const activeTab = isUser ? userTab : adminTab;

  const go = (k: string) => {
    if (isUser) {
      setUserTab(k as UserTab);
    } else {
      setAdminTab(k as AdminTab);
    }
    setMobileMenu(false);
  };

  const switchRole = (r: 'user' | 'admin') => {
    setRole(r);
    if (r === 'admin') {
      setCurrentUserId('admin');
      setAdminTab('dashboard');
    } else {
      setCurrentUserId('u1');
      setUserTab('home');
    }
    setMobileMenu(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <button onClick={() => go(isUser ? 'home' : 'dashboard')} className="shrink-0">
            <Logo size={36} imageUrl={logoImageUrl} />
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {nav.map((n) => {
              const Icon = n.icon;
              const active = activeTab === n.key;
              return (
                <button
                  key={n.key}
                  onClick={() => go(n.key)}
                  className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition ${
                    active ? 'bg-navy-900 text-white' : 'text-navy-700 hover:bg-slate-100'
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
            {/* Role switch */}
            <div className="flex items-center bg-slate-100 rounded-full p-0.5">
              <button
                onClick={() => switchRole('user')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition ${
                  isUser ? 'bg-volt-500 text-navy-950 shadow-volt' : 'text-slate-500'
                }`}
              >
                <UserCircle size={14} /> User
              </button>
              <button
                onClick={() => switchRole('admin')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition ${
                  !isUser ? 'bg-navy-900 text-white shadow-navy' : 'text-slate-500'
                }`}
              >
                <Shield size={14} /> Admin
              </button>
            </div>

            {/* User avatar */}
            <img
              src={currentUser.profileImg}
              alt={currentUser.name}
              className="w-9 h-9 rounded-full object-cover border-2 border-volt-300 hidden sm:block"
            />

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenu((s) => !s)}
              className="md:hidden rounded-lg p-2 text-navy-800 hover:bg-slate-100"
              aria-label="메뉴"
            >
              {mobileMenu ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileMenu && (
          <nav className="md:hidden border-t border-slate-100 bg-white animate-slide-up">
            <div className="max-w-6xl mx-auto px-4 py-2 grid grid-cols-3 gap-1">
              {nav.map((n) => {
                const Icon = n.icon;
                const active = activeTab === n.key;
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

      {/* User switcher (dev helper) */}
      {isUser && (
        <div className="bg-navy-50 border-b border-navy-100">
          <div className="max-w-6xl mx-auto px-4 py-1.5 flex items-center gap-2 overflow-x-auto">
            <span className="text-[10px] font-bold text-navy-500 shrink-0">테스트 유저:</span>
            {users
              .filter((u) => !u.isAdmin)
              .map((u) => (
                <button
                  key={u.id}
                  onClick={() => setCurrentUserId(u.id)}
                  className={`shrink-0 chip text-[10px] transition ${
                    currentUser.id === u.id ? 'bg-volt-500 text-navy-950' : 'bg-white text-navy-600 border border-navy-100'
                  }`}
                >
                  {u.name}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {isUser ? (
          <>
            {userTab === 'home' && <HomeScreen go={go} />}
            {userTab === 'pension' && <PensionScreen />}
            {userTab === 'court' && <CourtScreen />}
            {userTab === 'matching' && <MatchingScreen />}
            {userTab === 'notices' && <NoticesScreen />}
            {userTab === 'mypage' && <MyPageScreen go={go} />}
          </>
        ) : (
          <>
            {adminTab === 'dashboard' && <AdminDashboardScreen />}
            {adminTab === 'approval' && <AdminApprovalScreen />}
            {adminTab === 'notice' && <AdminNoticeScreen />}
            {adminTab === 'notification' && <AdminNotificationScreen />}
          </>
        )}
      </main>

      {/* Footer */}
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

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
