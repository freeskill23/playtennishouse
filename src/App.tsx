import React, { useState, useEffect, createContext, useContext } from 'react';

// ==========================================
// 1. 전역 상태 관리를 위한 AppContext & Provider
// ==========================================
const AppContext = createContext();

export function AppProvider({ children }) {
  const [notices, setNotices] = useState([
    { id: 1, title: '플테하 펜션 정식 오픈 안내', content: '많은 성원 부탁드립니다.', date: '2026-07-16' },
    { id: 2, title: '7월 주말 코트 예약이 오픈되었습니다.', content: '예약 현황을 확인해보세요.', date: '2026-07-15' }
  ]);
  const [reservations, setReservations] = useState([
    { id: 101, name: '홍길동', type: '코트', detail: 'A코트 14:00~16:00', status: '대기중' },
    { id: 102, name: '이순신', type: '펜션', detail: '테니스 룸 1박', status: '승인됨' }
  ]);
  const [logs, setLogs] = useState([
    { id: 1, message: '새로운 펜션 예약 신청이 접수되었습니다.', time: '방금 전', read: false },
    { id: 2, message: '홍길동 회원이 매칭을 신청했습니다.', time: '10분 전', read: false }
  ]);
  const [toasts, setToasts] = useState([]);

  const showToast = (message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  return (
    <AppContext.Provider value={{ notices, setNotices, reservations, setReservations, logs, setLogs, toasts, showToast }}>
      {children}
      <ToastStack toasts={toasts} />
    </AppContext.Provider>
  );
}

// 토스트 알림 컴포넌트
function ToastStack({ toasts }) {
  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {toasts.map((t) => (
        <div key={t.id} style={{ background: '#333', color: '#fff', padding: '12px 20px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontSize: '14px', animation: 'fadeIn 0.3s' }}>
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ==========================================
// 2. 메인 App 컴포넌트 (라우팅 및 로그인 제어)
// ==========================================
export default function App() {
  const [currentHash, setCurrentHash] = useState(window.location.hash);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(
    sessionStorage.getItem('isAdminAuthenticated') === 'true'
  );

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // 관리자 권한 로그인 처리
  const handleAdminLogin = (password) => {
    if (password === 'admin123') {
      sessionStorage.setItem('isAdminAuthenticated', 'true');
      setIsAdminAuthenticated(true);
      return true;
    }
    return false;
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('isAdminAuthenticated');
    setIsAdminAuthenticated(false);
    window.location.hash = ''; // 로그아웃 시 일반 사용자 메인으로 이동
  };

  // URL 주소 끝에 #admin 이 붙어있다면 관리자 화면으로 분기
  const isAdminRoute = currentHash.startsWith('#admin');

  return (
    <AppProvider>
      <div style={{ fontFamily: 'sans-serif', margin: 0, padding: 0, boxSizing: 'border-box' }}>
        {isAdminRoute ? (
          isAdminAuthenticated ? (
            <AdminShell onLogout={handleAdminLogout} />
          ) : (
            <AdminLogin onLogin={handleAdminLogin} />
          )
        ) : (
          <UserShell />
        )}
      </div>
    </AppProvider>
  );
}

// ==========================================
// 3. 관리자 로그인 컴포넌트
// ==========================================
function AdminLogin({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onLogin(password)) {
      setError('');
    } else {
      setError('비밀번호가 올바르지 않습니다. 다시 입력해 주세요.');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f3f4f6' }}>
      <form onSubmit={handleSubmit} style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', width: '320px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '24px', color: '#111' }}>관리자 로그인</h2>
        <input
          type="password"
          placeholder="비밀번호를 입력하세요 (기본: admin123)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: '100%', padding: '12px', border: '1px solid #ccc', borderRadius: '6px', marginBottom: '12px', boxSizing: 'border-box' }}
        />
        {error && <p style={{ color: '#ef4444', fontSize: '13px', margin: '0 0 12px 0' }}>{error}</p>}
        <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#059669', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
          로그인
        </button>
        <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px' }}>
          <a href="#" style={{ color: '#666', textDecoration: 'none' }}>일반 사용자 화면으로 돌아가기</a>
        </p>
      </form>
    </div>
  );
}

// ==========================================
// 4. 일반 사용자 메인 화면 (UserShell)
// ==========================================
function UserShell() {
  const [activeTab, setActiveTab] = useState('홈');
  const [isMenuOpen, setIsMenuOpen] = useState(false); // 모바일 햄버거 메뉴용
  const tabs = ['홈', '펜션예약', '코트예약', '매칭', '공지', '내예약'];

  return (
    <div>
      {/* 사용자 상단 네비바 */}
      <nav style={{ backgroundColor: '#059669', color: '#fff', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
        <div style={{ fontWeight: 'bold', fontSize: '20px', cursor: 'pointer' }} onClick={() => setActiveTab('홈')}>
          🏡 플테하 (Play Tennis House)
        </div>
        
        {/* 데스크톱 네비게이션 */}
        <div className="desktop-menu" style={{ display: 'flex', gap: '15px' }}>
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'none',
                border: 'none',
                color: activeTab === tab ? '#34d399' : '#fff',
                fontSize: '16px',
                cursor: 'pointer',
                fontWeight: activeTab === tab ? 'bold' : 'normal',
                padding: '5px 10px'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* 모바일 햄버거 버튼 */}
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)} 
          style={{ display: 'none', background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}
          className="mobile-hamburger"
        >
          ☰
        </button>
      </nav>

      {/* 모바일 드롭다운 메뉴 */}
      {isMenuOpen && (
        <div style={{ backgroundColor: '#047857', padding: '10px 0', display: 'flex', flexDirection: 'column', textAlign: 'center' }}>
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setIsMenuOpen(false);
              }}
              style={{ background: 'none', border: 'none', color: '#fff', padding: '12px', fontSize: '15px', borderBottom: '1px solid #065f46' }}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* 사용자 메인 콘텐츠 */}
      <main style={{ padding: '30px 20px', maxWidth: '800px', margin: '0 auto' }}>
        {activeTab === '홈' && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <h1 style={{ color: '#059669', marginBottom: '16px' }}>테니스와 휴식을 함께, 플테하에 오신 것을 환영합니다!</h1>
            <p style={{ color: '#666', fontSize: '16px', lineHeight: '1.6' }}>
              탁 트인 테니스 코트가 완비된 최고의 펜션 공간.<br />
              원하는 날짜를 골라 펜션과 코트를 한 번에 예약하고, 함께 운동할 파트너를 손쉽게 매칭해 보세요.
            </p>
          </div>
        )}

        {activeTab === '펜션예약' && <UserPensionReservation />}
        {activeTab === '코트예약' && <UserCourtReservation />}
        {activeTab === '매칭' && <UserMatching />}
        {activeTab === '공지' && <UserNotice />}
        {activeTab === '내예약' && <UserMyReservations />}
      </main>

      {/* 반응형 메뉴 스타일 (단순 CSS 주입) */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-menu { display: none !important; }
          .mobile-hamburger { display: block !important; }
        }
      `}</style>
    </div>
  );
}

// ==========================================
// 5. 관리자 메인 화면 (AdminShell)
// ==========================================
function AdminShell({ onLogout }) {
  const [activeTab, setActiveTab] = useState('캘린더');
  const { logs, setLogs } = useContext(AppContext);
  const tabs = ['캘린더', '승인관리', '공지관리', '알림로그'];

  // 읽지 않은 알림 개수 계산
  const unreadCount = logs.filter(l => !l.read).length;

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (tab === '알림로그') {
      // 알림로그를 확인하면 모두 읽음으로 처리
      setLogs(prev => prev.map(l => ({ ...l, read: true })));
    }
  };

  return (
    <div>
      {/* 관리자 상단 네비바 */}
      <nav style={{ backgroundColor: '#1e293b', color: '#fff', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontWeight: 'bold', fontSize: '18px', color: '#38bdf8' }}>⚙️ 플테하 관리자 시스템</span>
        </div>

        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabClick(tab)}
              style={{
                position: 'relative',
                background: 'none',
                border: 'none',
                color: activeTab === tab ? '#38bdf8' : '#cbd5e1',
                fontSize: '15px',
                cursor: 'pointer',
                fontWeight: activeTab === tab ? 'bold' : 'normal'
              }}
            >
              {tab}
              {tab === '알림로그' && unreadCount > 0 && (
                <span style={{ position: 'absolute', top: '-8px', right: '-15px', backgroundColor: '#ef4444', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
          <button onClick={onLogout} style={{ marginLeft: '10px', padding: '6px 12px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>
            로그아웃
          </button>
        </div>
      </nav>

      {/* 관리자 메인 콘텐츠 */}
      <main style={{ padding: '30px 20px', maxWidth: '1000px', margin: '0 auto' }}>
        {activeTab === '캘린더' && <AdminCalendar />}
        {activeTab === '승인관리' && <AdminApprove />}
        {activeTab === '공지관리' && <AdminNoticeManage />}
        {activeTab === '알림로그' && <AdminLogList />}
      </main>
    </div>
  );
}

// ==========================================
// 6. 사용자 서브 페이지 모음
// ==========================================
function UserPensionReservation() {
  const { showToast, setReservations } = useContext(AppContext);
  const handleBooking = () => {
    const newBooking = { id: Date.now(), name: '일반 사용자', type: '펜션', detail: '테니스 룸 1박 예약신청', status: '대기중' };
    setReservations(prev => [...prev, newBooking]);
    showToast('펜션 예약 신청이 완료되었습니다! 관리자 승인을 기다려주세요.');
  };
  return (
    <div style={{ border: '1px solid #e5e7eb', padding: '24px', borderRadius: '8px' }}>
      <h2>📅 펜션 예약 신청</h2>
      <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>원하시는 일정을 정하고 예약 요청을 남기시면 승인 절차가 진행됩니다.</p>
      <button onClick={handleBooking} style={{ padding: '12px 24px', backgroundColor: '#059669', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
        간편 예약 신청하기
      </button>
    </div>
  );
}

function UserCourtReservation() {
  const { showToast, setReservations } = useContext(AppContext);
  return (
    <div style={{ border: '1px solid #e5e7eb', padding: '24px', borderRadius: '8px' }}>
      <h2>🎾 테니스 코트 예약</h2>
      <p style={{ color: '#666', fontSize: '14px' }}>A코트 / B코트 실시간 대여 현황을 확인하고 시간을 설정할 수 있습니다.</p>
      <button onClick={() => {
        setReservations(prev => [...prev, { id: Date.now(), name: '일반 사용자', type: '코트', detail: 'A코트 16:00~18:00', status: '대기중' }]);
        showToast('코트 예약이 대기 상태로 접수되었습니다.');
      }} style={{ padding: '12px 24px', backgroundColor: '#059669', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
        코트 예약하기
      </button>
    </div>
  );
}

function UserMatching() {
  const { showToast } = useContext(AppContext);
  return (
    <div style={{ border: '1px solid #e5e7eb', padding: '24px', borderRadius: '8px' }}>
      <h2>🤝 테니스 매칭 등록</h2>
      <p style={{ color: '#666', fontSize: '14px' }}>같이 랠리를 하거나 칠 사람이 없을 때, 게시글을 올려 파트너를 모집하세요.</p>
      <button onClick={() => showToast('매칭 모집 글이 성공적으로 등록되었습니다.')} style={{ padding: '12px 24px', backgroundColor: '#059669', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
        매칭 모집 글쓰기
      </button>
    </div>
  );
}

function UserNotice() {
  const { notices } = useContext(AppContext);
  return (
    <div>
      <h2>📢 중요 공지사항</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
        {notices.map(notice => (
          <div key={notice.id} style={{ padding: '20px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#fafafa' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#111' }}>{notice.title}</h3>
            <p style={{ margin: '0 0 10px 0', color: '#555', fontSize: '14px' }}>{notice.content}</p>
            <span style={{ fontSize: '12px', color: '#999' }}>작성일: {notice.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function UserMyReservations() {
  const { reservations } = useContext(AppContext);
  return (
    <div>
      <h2>📋 나의 예약 / 신청 목록</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
        {reservations.map(res => (
          <div key={res.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
            <div>
              <span style={{ fontWeight: 'bold', marginRight: '10px', color: '#059669' }}>[{res.type}]</span>
              <span>{res.detail}</span>
            </div>
            <span style={{
              fontWeight: 'bold',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              backgroundColor: res.status === '승인됨' ? '#d1fae5' : '#fef3c7',
              color: res.status === '승인됨' ? '#065f46' : '#92400e'
            }}>
              {res.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// 7. 관리자 서브 페이지 모음
// ==========================================
function AdminCalendar() {
  return (
    <div style={{ border: '1px solid #cbd5e1', padding: '24px', borderRadius: '8px', backgroundColor: '#fff' }}>
      <h2 style={{ color: '#0f172a' }}>🗓️ 전체 스케줄 통합 캘린더</h2>
      <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>펜션 객실 예약과 테니스 코트 대관 타임테이블이 일괄 표기됩니다.</p>
      <div style={{ height: '300px', border: '2px dashed #cbd5e1', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
        [통합 대시보드 캘린더 로딩 구역]
      </div>
    </div>
  );
}

function AdminApprove() {
  const { reservations, setReservations, showToast } = useContext(AppContext);

  const handleApprove = (id) => {
    setReservations(prev => prev.map(res => res.id === id ? { ...res, status: '승인됨' } : res));
    showToast('예약을 성공적으로 승인 처리했습니다.');
  };

  return (
    <div>
      <h2 style={{ color: '#0f172a', marginBottom: '20px' }}>📥 회원 예약 신청 대기/승인 관리</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #cbd5e1', color: '#475569' }}>
            <th style={{ padding: '12px 8px' }}>신청자</th>
            <th style={{ padding: '12px 8px' }}>구분</th>
            <th style={{ padding: '12px 8px' }}>내역</th>
            <th style={{ padding: '12px 8px' }}>상태</th>
            <th style={{ padding: '12px 8px' }}>관리</th>
          </tr>
        </thead>
        <tbody>
          {reservations.map(res => (
            <tr key={res.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '12px 8px' }}>{res.name}</td>
              <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>{res.type}</td>
              <td style={{ padding: '12px 8px' }}>{res.detail}</td>
              <td style={{ padding: '12px 8px' }}>
                <span style={{ color: res.status === '승인됨' ? '#16a34a' : '#d97706', fontWeight: 'bold' }}>
                  {res.status}
                </span>
              </td>
              <td style={{ padding: '12px 8px' }}>
                {res.status === '대기중' && (
                  <button onClick={() => handleApprove(res.id)} style={{ padding: '4px 10px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    승인하기
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AdminNoticeManage() {
  const { notices, setNotices, showToast } = useContext(AppContext);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  const handleAddNotice = (e) => {
    e.preventDefault();
    if (!newTitle || !newContent) return;

    const post = {
      id: Date.now(),
      title: newTitle,
      content: newContent,
      date: new Date().toISOString().split('T')[0]
    };

    setNotices(prev => [post, ...prev]);
    setNewTitle('');
    setNewContent('');
    showToast('새로운 공지사항을 등록하였습니다.');
  };

  return (
    <div>
      <h2 style={{ color: '#0f172a' }}>✍️ 공지사항 게시글 관리</h2>
      <form onSubmit={handleAddNotice} style={{ margin: '20px 0', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
        <h4 style={{ margin: '0 0 12px 0' }}>새 공지사항 쓰기</h4>
        <input
          type="text"
          placeholder="공지 제목"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }}
        />
        <textarea
          placeholder="공지 내용 입력"
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          style={{ width: '100%', padding: '10px', height: '80px', border: '1px solid #cbd5e1', borderRadius: '4px', marginBottom: '10px', boxSizing: 'border-box' }}
        />
        <button type="submit" style={{ padding: '8px 16px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          등록 완료
        </button>
      </form>
    </div>
  );
}

function AdminLogList() {
  const { logs } = useContext(AppContext);
  return (
    <div>
      <h2 style={{ color: '#0f172a' }}>🔔 통합 실시간 알림 로그</h2>
      <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>새로운 예약 접수, 매칭 등의 활동 내역이 여기에 모두 누적 기록됩니다.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {logs.map(log => (
          <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: '#fff' }}>
            <span style={{ color: '#334155' }}>{log.message}</span>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>{log.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
