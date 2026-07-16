import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from 'react';
import type {
  User,
  Room,
  Reservation,
  MatchingPost,
  Notice,
  AppNotification,
  ReservationType,
  ReservationStatus,
  CourtName,
  RoomName,
  NoticeType,
  MatchingApplication,
  GameType,
  GenderRequirement,
  NTRP,
} from './types';
import { COURT_TIME_SLOTS } from './types';
import {
  initialUsers,
  initialRooms,
  initialReservations,
  initialMatchingPosts,
  initialNotices,
  initialNotifications,
} from './mockData';
import type { AuthUser } from './lib/auth';
import { isWeekendOrHoliday, COURT_SLOT_PRICE, PENSION_WEEKDAY_PRICE, PENSION_WEEKEND_PRICE } from './pricing';

const uid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 9)}`;

interface Toast {
  id: string;
  message: string;
  kind: 'success' | 'error' | 'info';
}

interface AppState {
  // identity
  currentUserId: string;

  // data
  users: User[];
  rooms: Room[];
  updateRoom: (id: string, patch: Partial<Pick<Room, 'maxCapacity' | 'description'>>) => void;
  reservations: Reservation[];
  matchingPosts: MatchingPost[];
  notices: Notice[];
  notifications: AppNotification[];

  // derived helpers
  currentUser: User;
  getUser: (id: string) => User | undefined;
  updateCurrentUser: (patch: Partial<Pick<User, 'name' | 'nickname' | 'phone' | 'profileImg' | 'career' | 'ntrp' | 'hand' | 'gamePreference' | 'bio'>>) => void;

  // reservation actions
  createPensionReservation: (input: {
    roomId: string;
    date: string;
    capacity: number;
  }) => { ok: boolean; reason?: string; reservation?: Reservation };
  createCourtReservation: (input: {
    court: CourtName;
    date: string;
    timeSlot: string;
  }) => { ok: boolean; reason?: string; reservation?: Reservation };
  requestWaiting: (reservationId: string) => { ok: boolean; sequence?: number };
  cancelReservation: (id: string) => void;
  approveReservation: (id: string) => void;
  rejectReservation: (id: string) => void;

  // matching
  createMatchingPost: (input: {
    reservationId: string;
    ntrpRequirement: NTRP | 'any';
    genderRequirement: GenderRequirement;
    maxPlayers: number;
    gameType: GameType;
    description: string;
  }) => { ok: boolean; reason?: string; post?: MatchingPost };
  applyMatching: (postId: string) => { ok: boolean; reason?: string };
  approveMatchingApplication: (postId: string, applicationId: string) => void;
  closeMatching: (postId: string) => void;

  // notices
  createNotice: (n: { title: string; content: string; type: NoticeType }) => void;
  deleteNotice: (id: string) => void;

  // notifications
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  // toasts
  toasts: Toast[];
  pushToast: (message: string, kind?: Toast['kind']) => void;
  dismissToast: (id: string) => void;

  // pricing
  pensionWeekdayPrice: number;
  pensionWeekendPrice: number;
  pensionPriceOverrides: Record<string, number>;
  getPensionPrice: (dateStr: string) => number;
  updatePensionPrice: (weekday: number, weekend: number) => void;
  setPensionPriceForDate: (dateStr: string, price: number) => void;
  removePensionPriceOverride: (dateStr: string) => void;

  // banner
  bannerImageUrl: string | null;
  updateBannerImage: (url: string | null) => void;

  // logo
  logoImageUrl: string | null;
  updateLogoImage: (url: string | null) => void;

  // queries
  isPensionBlockedByCourt: (date: string) => boolean;
  isCourtBlockedByPension: (date: string, court: CourtName) => boolean;
  getPensionStatusForDate: (date: string, roomName: RoomName) => {
    status: 'available' | 'full' | 'booked' | 'pending';
    reservation?: Reservation;
    waitingCount: number;
  };
  getCourtSlotStatus: (
    date: string,
    court: CourtName,
    slot: string,
  ) => 'available' | 'booked' | 'pending' | 'blocked';
  getReservationsByDate: (date: string) => Reservation[];
  getMatchingsByDate: (date: string) => MatchingPost[];
}

const Ctx = createContext<AppState | null>(null);

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used within AppProvider');
  return v;
}

export function AppProvider({ children, authUser }: { children: ReactNode; authUser: AuthUser }) {
  const currentUserId = authUser.id;
  const [users, setUsers] = useState<User[]>(() => {
    const authAsUser: User = {
      id: authUser.id,
      name: authUser.name,
      nickname: authUser.nickname || '',
      phone: authUser.phone,
      profileImg: authUser.profileImg,
      career: authUser.career,
      ntrp: authUser.ntrp,
      hand: authUser.hand,
      gamePreference: authUser.gamePreference,
      bio: authUser.bio,
      isAdmin: false,
    };
    return [authAsUser, ...initialUsers.filter((u) => u.id !== authUser.id)];
  });
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [reservations, setReservations] = useState<Reservation[]>(initialReservations);
  const [matchingPosts, setMatchingPosts] = useState<MatchingPost[]>(initialMatchingPosts);
  const [notices, setNotices] = useState<Notice[]>(initialNotices);
  const [notifications, setNotifications] = useState<AppNotification[]>(initialNotifications);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // ===== Toast helpers =====
  const pushToast = useCallback((message: string, kind: Toast['kind'] = 'success') => {
    const id = uid('toast');
    setToasts((t) => [...t, { id, message, kind }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3200);
  }, []);
  const dismissToast = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  // ===== Notification helper =====
  const addNotification = useCallback(
    (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => {
      setNotifications((prev) => [
        {
          ...n,
          id: uid('nt'),
          createdAt: Date.now(),
          read: false,
        },
        ...prev,
      ]);
    },
    [],
  );

  const getUser = useCallback(
    (id: string) => users.find((u) => u.id === id),
    [users],
  );

  const updateCurrentUser = useCallback(
    (patch: Partial<Pick<User, 'name' | 'nickname' | 'phone' | 'profileImg' | 'career' | 'ntrp' | 'hand' | 'gamePreference' | 'bio'>>) => {
      setUsers((prev) => prev.map((u) => (u.id === currentUserId ? { ...u, ...patch } : u)));
    },
    [currentUserId],
  );

  const [pensionWeekdayPrice, setPensionWeekdayPrice] = useState(PENSION_WEEKDAY_PRICE);
  const [pensionWeekendPrice, setPensionWeekendPrice] = useState(PENSION_WEEKEND_PRICE);
  const [pensionPriceOverrides, setPensionPriceOverrides] = useState<Record<string, number>>({});

  const updateRoom = useCallback(
    (id: string, patch: Partial<Pick<Room, 'maxCapacity' | 'description'>>) => {
      setRooms((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
      pushToast('객실 정보가 변경되었습니다.');
    },
    [pushToast],
  );

  const getPensionPrice = useCallback(
    (dateStr: string) => {
      if (pensionPriceOverrides[dateStr] != null) return pensionPriceOverrides[dateStr];
      return isWeekendOrHoliday(dateStr) ? pensionWeekendPrice : pensionWeekdayPrice;
    },
    [pensionWeekdayPrice, pensionWeekendPrice, pensionPriceOverrides],
  );

  const updatePensionPrice = useCallback(
    (weekday: number, weekend: number) => {
      setPensionWeekdayPrice(weekday);
      setPensionWeekendPrice(weekend);
      pushToast('펜션 기본 요금이 변경되었습니다.');
    },
    [pushToast],
  );

  const setPensionPriceForDate = useCallback(
    (dateStr: string, price: number) => {
      setPensionPriceOverrides((prev) => ({ ...prev, [dateStr]: price }));
      pushToast(`${dateStr} 요금이 설정되었습니다.`);
    },
    [pushToast],
  );

  const removePensionPriceOverride = useCallback(
    (dateStr: string) => {
      setPensionPriceOverrides((prev) => {
        const next = { ...prev };
        delete next[dateStr];
        return next;
      });
      pushToast(`${dateStr} 개별 요금이 삭제되었습니다.`, 'info');
    },
    [pushToast],
  );

  const [bannerImageUrl, setBannerImageUrl] = useState<string | null>(null);

  const updateBannerImage = useCallback(
    (url: string | null) => {
      setBannerImageUrl(url);
      pushToast(url ? '배너 이미지가 변경되었습니다.' : '배너 이미지가 초기화되었습니다.');
    },
    [pushToast],
  );

  const [logoImageUrl, setLogoImageUrl] = useState<string | null>(null);

  const updateLogoImage = useCallback(
    (url: string | null) => {
      setLogoImageUrl(url);
      pushToast(url ? '로고 이미지가 변경되었습니다.' : '로고 이미지가 초기화되었습니다.');
    },
    [pushToast],
  );

  // ===== Business rule: mutual exclusion =====
  // Pension reserved (예약완료) -> all court slots that day become unavailable
  const isPensionBlockedByCourt = useCallback(
    (date: string) => {
      // If any court reservation is 예약완료 on that date, pension is blocked
      return reservations.some(
        (r) =>
          r.type === 'court' &&
          r.date === date &&
          r.status === '예약완료' &&
          r.waitingSequence === null,
      );
    },
    [reservations],
  );

  const isCourtBlockedByPension = useCallback(
    (date: string, court: CourtName) => {
      // If any pension reservation is 예약완료 on that date, all courts blocked
      return reservations.some(
        (r) =>
          r.type === 'pension' &&
          r.date === date &&
          r.status === '예약완료' &&
          r.waitingSequence === null,
      );
      // Note: per PRD, pension reserved blocks ALL courts that day regardless of A/B
      void court;
    },
    [reservations],
  );

  const getPensionStatusForDate = useCallback(
    (date: string, roomName: RoomName) => {
      const room = rooms.find((r) => r.name === roomName);
      const roomId = room?.id;
      const primaries = reservations.filter(
        (r) =>
          r.type === 'pension' &&
          r.date === date &&
          r.targetId === roomId &&
          r.waitingSequence === null &&
          r.status !== '취소',
      );
      const waitings = reservations.filter(
        (r) =>
          r.type === 'pension' &&
          r.date === date &&
          r.targetId === roomId &&
          r.waitingSequence !== null &&
          r.status !== '취소',
      );
      const completed = primaries.find((r) => r.status === '예약완료');
      if (completed) {
        return { status: 'booked' as const, reservation: completed, waitingCount: waitings.length };
      }
      const pending = primaries.find((r) => r.status === '신청' || r.status === '입금대기' || r.status === '승인대기');
      if (pending) {
        return { status: 'pending' as const, reservation: pending, waitingCount: waitings.length };
      }
      if (waitings.length > 0) {
        return { status: 'full' as const, waitingCount: waitings.length };
      }
      return { status: 'available' as const, waitingCount: 0 };
    },
    [rooms, reservations],
  );

  const getCourtSlotStatus = useCallback(
    (date: string, court: CourtName, slot: string): 'available' | 'booked' | 'pending' | 'blocked' => {
      // Blocked by pension
      if (isCourtBlockedByPension(date, court)) return 'blocked';
      const found = reservations.find(
        (r) =>
          r.type === 'court' &&
          r.date === date &&
          r.targetId === court &&
          r.timeSlot === slot &&
          r.waitingSequence === null &&
          r.status !== '취소',
      );
      if (!found) return 'available';
      if (found.status === '예약완료' || found.status === '이용완료') return 'booked';
      return 'pending';
    },
    [reservations, isCourtBlockedByPension],
  );

  const getReservationsByDate = useCallback(
    (date: string) => reservations.filter((r) => r.date === date && r.status !== '취소'),
    [reservations],
  );

  const getMatchingsByDate = useCallback(
    (date: string) => matchingPosts.filter((m) => m.date === date),
    [matchingPosts],
  );

  // ===== Create pension reservation =====
  const createPensionReservation = useCallback(
    (input: { roomId: string; date: string; capacity: number }) => {
      const room = rooms.find((r) => r.id === input.roomId);
      if (!room) return { ok: false, reason: '존재하지 않는 객실입니다.' };
      if (input.capacity < 1 || input.capacity > room.maxCapacity) {
        return { ok: false, reason: `인원은 1~${room.maxCapacity}명이어야 합니다.` };
      }
      // Blocked by court?
      if (isPensionBlockedByCourt(input.date)) {
        return { ok: false, reason: '해당 날짜에 코트 예약이 완료되어 펜션 예약이 불가합니다.' };
      }
      // Check existing
      const existing = reservations.filter(
        (r) =>
          r.type === 'pension' &&
          r.date === input.date &&
          r.targetId === input.roomId &&
          r.waitingSequence === null &&
          r.status !== '취소',
      );
      const hasCompleted = existing.some((r) => r.status === '예약완료');
      const hasPending = existing.some((r) => r.status === '신청' || r.status === '입금대기' || r.status === '승인대기');

      const reservation: Reservation = {
        id: uid('r'),
        type: 'pension',
        userId: currentUserId,
        targetId: input.roomId,
        targetLabel: room.name,
        date: input.date,
        capacity: input.capacity,
        status: hasCompleted ? '신청' : '신청', // 신청 first; admin moves to 입금대기/승인대기/예약완료
        waitingSequence: hasCompleted || hasPending ? (reservations.filter((r) => r.type === 'pension' && r.date === input.date && r.targetId === input.roomId && r.waitingSequence !== null).length + 1) : null,
        amount: getPensionPrice(input.date),
        createdAt: Date.now(),
      };

      setReservations((prev) => [...prev, reservation]);
      addNotification({
        kind: 'reservation_new',
        title: '새 펜션 예약 신청',
        body: `${getUser(currentUserId)?.name}님이 ${room.name} 펜션 예약을 신청했습니다.${reservation.waitingSequence ? ` (대기 ${reservation.waitingSequence}순위)` : ''}`,
        targetUserId: currentUserId,
      });
      pushToast(
        reservation.waitingSequence
          ? `예약 대기 신청 완료! 대기 ${reservation.waitingSequence}순위`
          : '펜션 예약 신청 완료! 입금 후 관리자 승인을 기다려주세요.',
      );
      return { ok: true, reservation };
    },
    [rooms, reservations, currentUserId, isPensionBlockedByCourt, addNotification, getUser, pushToast],
  );

  // ===== Create court reservation =====
  const createCourtReservation = useCallback(
    (input: { court: CourtName; date: string; timeSlot: string }) => {
      if (!COURT_TIME_SLOTS.includes(input.timeSlot as (typeof COURT_TIME_SLOTS)[number])) {
        return { ok: false, reason: '잘못된 시간대입니다.' };
      }
      if (isCourtBlockedByPension(input.date, input.court)) {
        return { ok: false, reason: '해당 날짜에 펜션 예약이 완료되어 코트 이용이 불가합니다.' };
      }
      const slotStatus = getCourtSlotStatus(input.date, input.court, input.timeSlot);
      if (slotStatus === 'booked' || slotStatus === 'pending') {
        return { ok: false, reason: '이미 예약되었거나 신청 중인 시간대입니다.' };
      }

      const reservation: Reservation = {
        id: uid('r'),
        type: 'court',
        userId: currentUserId,
        targetId: input.court,
        targetLabel: input.court,
        date: input.date,
        timeSlot: input.timeSlot,
        status: '신청',
        waitingSequence: null,
        amount: COURT_SLOT_PRICE,
        createdAt: Date.now(),
      };
      setReservations((prev) => [...prev, reservation]);
      addNotification({
        kind: 'reservation_new',
        title: '새 코트 예약 신청',
        body: `${getUser(currentUserId)?.name}님이 ${input.court} ${input.timeSlot} 예약을 신청했습니다.`,
        targetUserId: currentUserId,
      });
      pushToast('코트 예약 신청 완료! 입금 후 관리자 승인을 기다려주세요.');
      return { ok: true, reservation };
    },
    [isCourtBlockedByPension, getCourtSlotStatus, currentUserId, addNotification, getUser, pushToast],
  );

  // ===== Waiting request =====
  const requestWaiting = useCallback(
    (reservationId: string) => {
      const target = reservations.find((r) => r.id === reservationId);
      if (!target) return { ok: false };
      // count current waitings for same slot
      const waitings = reservations.filter(
        (r) =>
          r.waitingSequence !== null &&
          r.status !== '취소' &&
          r.type === target.type &&
          r.date === target.date &&
          r.targetId === target.targetId &&
          r.timeSlot === target.timeSlot,
      );
      const seq = waitings.length + 1;
      const newWaiting: Reservation = {
        ...target,
        id: uid('r'),
        userId: currentUserId,
        status: '신청',
        waitingSequence: seq,
        createdAt: Date.now(),
      };
      setReservations((prev) => [...prev, newWaiting]);
      pushToast(`대기 신청 완료! 대기 ${seq}순위`);
      return { ok: true, sequence: seq };
    },
    [reservations, currentUserId, pushToast],
  );

  // ===== Waiting handoff with timeout =====
  const promoteNextWaiting = useCallback(
    (cancelledReservation: Reservation) => {
      // Find next waiting for same slot
      const candidates = reservations
        .filter(
          (r) =>
            r.waitingSequence !== null &&
            r.status !== '취소' &&
            r.type === cancelledReservation.type &&
            r.date === cancelledReservation.date &&
            r.targetId === cancelledReservation.targetId &&
            r.timeSlot === cancelledReservation.timeSlot,
        )
        .sort((a, b) => (a.waitingSequence || 0) - (b.waitingSequence || 0));

      const next = candidates[0];
      if (!next) return;

      const timeoutUntil = Date.now() + 2 * 60 * 60 * 1000; // 2 hours
      setReservations((prev) =>
        prev.map((r) =>
          r.id === next.id
            ? { ...r, status: '입금대기', waitingSequence: null, depositTimeoutUntil: timeoutUntil }
            : r,
        ),
      );
      addNotification({
        kind: 'waiting_promoted',
        title: '대기 1순위 승격',
        body: `${getUser(next.userId)?.name}님, 예약이 취소되어 입금 대기로 승격되었습니다. 2시간 내 입금해주세요.`,
        targetUserId: next.userId,
      });
      pushToast(`${getUser(next.userId)?.name}님에게 대기가 이양되었습니다. (2시간 입금 대기)`);

      // Set timeout to auto-pass to next
      if (timersRef.current[next.id]) clearTimeout(timersRef.current[next.id]);
      timersRef.current[next.id] = setTimeout(() => {
        setReservations((prev) => {
          const cur = prev.find((r) => r.id === next.id);
          if (!cur || cur.status !== '입금대기') return prev;
          // cancel this one, promote next
          addNotification({
            kind: 'waiting_timeout',
            title: '입금 대기 시간 초과',
            body: `${getUser(next.userId)?.name}님의 입금 대기 시간이 초과되어 다음 대기자에게 이양됩니다.`,
            targetUserId: next.userId,
          });
          pushToast(`${getUser(next.userId)?.name}님 입금 시간 초과, 다음 대기자에게 이양`, 'error');
          // recursively promote
          setTimeout(() => promoteNextWaiting({ ...cur, status: '취소' }), 50);
          return prev.map((r) => (r.id === next.id ? { ...r, status: '취소', depositTimeoutUntil: null } : r));
        });
      }, 2 * 60 * 60 * 1000);
    },
    [reservations, addNotification, getUser, pushToast],
  );

  // ===== Cancel reservation =====
  const cancelReservation = useCallback(
    (id: string) => {
      setReservations((prev) => {
        const target = prev.find((r) => r.id === id);
        if (!target) return prev;
        const updated = prev.map((r) =>
          r.id === id ? { ...r, status: '취소' as ReservationStatus, depositTimeoutUntil: null } : r,
        );
        // If it was a primary completed/pending reservation, promote next waiting
        if (target.waitingSequence === null && target.status === '예약완료') {
          setTimeout(() => promoteNextWaiting(target), 30);
        }
        addNotification({
          kind: 'reservation_cancelled',
          title: '예약 취소',
          body: `${getUser(target.userId)?.name}님의 ${target.targetLabel} 예약이 취소되었습니다.`,
          targetUserId: target.userId,
        });
        pushToast('예약이 취소되었습니다.', 'info');
        return updated;
      });
    },
    [promoteNextWaiting, addNotification, getUser, pushToast],
  );

  // ===== Approve reservation (admin) =====
  const approveReservation = useCallback(
    (id: string) => {
      setReservations((prev) => {
        const target = prev.find((r) => r.id === id);
        if (!target) return prev;
        addNotification({
          kind: 'reservation_approved',
          title: '예약 승인 완료',
          body: `${getUser(target.userId)?.name}님의 ${target.targetLabel} 예약이 승인(예약완료) 처리되었습니다.`,
          targetUserId: target.userId,
        });
        pushToast(`${getUser(target.userId)?.name}님 예약 승인 완료`);
        return prev.map((r) => (r.id === id ? { ...r, status: '예약완료' as ReservationStatus } : r));
      });
    },
    [addNotification, getUser, pushToast],
  );

  const rejectReservation = useCallback(
    (id: string) => {
      setReservations((prev) => {
        const target = prev.find((r) => r.id === id);
        if (!target) return prev;
        addNotification({
          kind: 'reservation_rejected',
          title: '예약 거절',
          body: `${getUser(target.userId)?.name}님의 ${target.targetLabel} 예약 신청이 거절되었습니다.`,
          targetUserId: target.userId,
        });
        pushToast(`${getUser(target.userId)?.name}님 예약 거절 처리`, 'error');
        return prev.map((r) => (r.id === id ? { ...r, status: '취소' as ReservationStatus } : r));
      });
    },
    [addNotification, getUser, pushToast],
  );

  // ===== Matching =====
  const createMatchingPost = useCallback(
    (input: {
      reservationId: string;
      ntrpRequirement: NTRP | 'any';
      genderRequirement: GenderRequirement;
      maxPlayers: number;
      gameType: GameType;
      description: string;
    }) => {
      const reservation = reservations.find((r) => r.id === input.reservationId);
      if (!reservation) return { ok: false, reason: '예약을 찾을 수 없습니다.' };
      if (reservation.userId !== currentUserId) {
        return { ok: false, reason: '본인의 예약만 매칭글을 작성할 수 있습니다.' };
      }
      if (reservation.status !== '예약완료') {
        return { ok: false, reason: '예약완료 상태의 예약만 매칭글을 작성할 수 있습니다.' };
      }
      // Court reservation: must use own time slot
      let time = '';
      let court: CourtName = 'A코트';
      let date = reservation.date;
      if (reservation.type === 'court') {
        time = reservation.timeSlot || '';
        court = reservation.targetId as CourtName;
      } else {
        // pension reservation - allow any time slot; default to afternoon
        time = '15:00-17:00';
        court = reservation.targetLabel === 'A동' ? 'A코트' : 'B코트';
      }

      const post: MatchingPost = {
        id: uid('m'),
        reservationId: input.reservationId,
        userId: currentUserId,
        date,
        time,
        court,
        ntrpRequirement: input.ntrpRequirement,
        genderRequirement: input.genderRequirement,
        maxPlayers: input.maxPlayers,
        gameType: input.gameType,
        description: input.description,
        status: '모집중',
        applications: [],
        createdAt: Date.now(),
      };
      setMatchingPosts((prev) => [post, ...prev]);
      addNotification({
        kind: 'matching_new',
        title: '새 매칭 모집',
        body: `${getUser(currentUserId)?.name}님이 ${date} ${time} ${court} 매칭을 모집합니다.`,
        targetUserId: currentUserId,
      });
      pushToast('매칭글이 등록되었습니다.');
      return { ok: true, post };
    },
    [reservations, currentUserId, addNotification, getUser, pushToast],
  );

  const applyMatching = useCallback(
    (postId: string) => {
      const post = matchingPosts.find((p) => p.id === postId);
      if (!post) return { ok: false, reason: '매칭글을 찾을 수 없습니다.' };
      if (post.userId === currentUserId) return { ok: false, reason: '본인 매칭글에는 신청할 수 없습니다.' };
      if (post.applications.some((a) => a.userId === currentUserId)) {
        return { ok: false, reason: '이미 신청한 매칭입니다.' };
      }
      const approvedCount = post.applications.filter((a) => a.status === '승인').length;
      if (approvedCount >= post.maxPlayers - 1) {
        return { ok: false, reason: '모집 인원이 마감되었습니다.' };
      }
      const app: MatchingApplication = {
        id: uid('a'),
        userId: currentUserId,
        status: '대기',
        appliedAt: Date.now(),
      };
      setMatchingPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, applications: [...p.applications, app] } : p,
        ),
      );
      pushToast('매칭 신청 완료! 호스트 승인 후 연락처가 공개됩니다.');
      return { ok: true };
    },
    [matchingPosts, currentUserId, pushToast],
  );

  const approveMatchingApplication = useCallback(
    (postId: string, applicationId: string) => {
      setMatchingPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          const apps = p.applications.map((a) =>
            a.id === applicationId ? { ...a, status: '승인' as const } : a,
          );
          const approvedCount = apps.filter((a) => a.status === '승인').length;
          let status = p.status;
          if (approvedCount >= p.maxPlayers - 1) status = '모집완료';
          const app = apps.find((a) => a.id === applicationId);
          if (app) {
            addNotification({
              kind: 'matching_approved',
              title: '매칭 승인',
              body: `${getUser(p.userId)?.name}님이 회원님의 매칭 신청을 승인했습니다. 연락처: ${getUser(p.userId)?.phone}`,
              targetUserId: app.userId,
            });
          }
          return { ...p, applications: apps, status };
        }),
      );
      pushToast('매칭 신청을 승인했습니다.');
    },
    [addNotification, getUser, pushToast],
  );

  const closeMatching = useCallback(
    (postId: string) => {
      setMatchingPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, status: '종료' } : p)),
      );
      pushToast('매칭을 종료했습니다.', 'info');
    },
    [pushToast],
  );

  // ===== Notices =====
  const createNotice = useCallback(
    (n: { title: string; content: string; type: NoticeType }) => {
      const notice: Notice = {
        id: uid('n'),
        title: n.title,
        content: n.content,
        type: n.type,
        createdAt: Date.now(),
      };
      setNotices((prev) => [notice, ...prev]);
      addNotification({
        kind: 'notice_new',
        title: '새 공지사항',
        body: `[${n.type}] ${n.title}`,
      });
      pushToast('공지사항이 등록되었습니다.');
    },
    [addNotification, pushToast],
  );

  const deleteNotice = useCallback(
    (id: string) => {
      setNotices((prev) => prev.filter((n) => n.id !== id));
      pushToast('공지사항이 삭제되었습니다.', 'info');
    },
    [pushToast],
  );

  // ===== Notifications =====
  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);
  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  // ===== Simulated waiting timeout acceleration (for demo) =====
  // Expose a way to fast-forward timeouts in dev — not in interface but used via window
  useEffect(() => {
    (window as unknown as { __pthFastForward?: (id: string) => void }).__pthFastForward = (id: string) => {
      if (timersRef.current[id]) {
        clearTimeout(timersRef.current[id]);
        delete timersRef.current[id];
        setReservations((prev) => {
          const cur = prev.find((r) => r.id === id);
          if (!cur || cur.status !== '입금대기') return prev;
          addNotification({
            kind: 'waiting_timeout',
            title: '입금 대기 시간 초과 (시뮬레이션)',
            body: `${getUser(cur.userId)?.name}님의 입금 대기 시간이 초과되어 다음 대기자에게 이양됩니다.`,
            targetUserId: cur.userId,
          });
          pushToast(`${getUser(cur.userId)?.name}님 입금 시간 초과, 다음 대기자에게 이양`, 'error');
          setTimeout(() => promoteNextWaiting({ ...cur, status: '취소' }), 50);
          return prev.map((r) => (r.id === id ? { ...r, status: '취소' as ReservationStatus, depositTimeoutUntil: null } : r));
        });
      }
    };
  }, [addNotification, getUser, pushToast, promoteNextWaiting]);

  // cleanup timers on unmount
  useEffect(() => {
    const t = timersRef.current;
    return () => {
      Object.values(t).forEach(clearTimeout);
    };
  }, []);

  const currentUser = users.find((u) => u.id === currentUserId) || users[0];
  void authUser;

  const value: AppState = {
    currentUserId,
    users,
    rooms,
    updateRoom,
    reservations,
    matchingPosts,
    notices,
    notifications,
    currentUser,
    getUser,
    updateCurrentUser,
    createPensionReservation,
    createCourtReservation,
    requestWaiting,
    cancelReservation,
    approveReservation,
    rejectReservation,
    createMatchingPost,
    applyMatching,
    approveMatchingApplication,
    closeMatching,
    createNotice,
    deleteNotice,
    markNotificationRead,
    markAllNotificationsRead,
    toasts,
    pushToast,
    dismissToast,
    pensionWeekdayPrice,
    pensionWeekendPrice,
    pensionPriceOverrides,
    getPensionPrice,
    updatePensionPrice,
    setPensionPriceForDate,
    removePensionPriceOverride,
    bannerImageUrl,
    updateBannerImage,
    logoImageUrl,
    updateLogoImage,
    isPensionBlockedByCourt,
    isCourtBlockedByPension,
    getPensionStatusForDate,
    getCourtSlotStatus,
    getReservationsByDate,
    getMatchingsByDate,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export type { ReservationType };
