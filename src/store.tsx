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
  GalleryItem,
  AppNotification,
  ReservationType,
  ReservationStatus,
  CourtName,
  RoomName,
  NoticeType,
  MatchingApplication,
  ApplicantGender,
  GameType,
  GenderRequirement,
  NTRP,
  Hand,
  GamePreference,
} from './types';
import { COURT_TIME_SLOTS, MATCHING_MAX_PLAYERS, mergeTimeSlots } from './types';
import {
  initialUsers,
  initialRooms,
  initialReservations,
  initialMatchingPosts,
  initialNotices,
  initialNotifications,
} from './mockData';
import type { AuthUser } from './lib/auth';
import { supabase, supabaseConfigured } from './lib/supabase';
import { isWeekendOrHoliday, COURT_SLOT_PRICE, getCourtSlotPrice, PENSION_WEEKDAY_PRICE, PENSION_WEEKEND_PRICE } from './pricing';

type ReservationRow = {
  id: string;
  type: ReservationType;
  user_id: string;
  target_id: string;
  target_label: string;
  date: string;
  time_slot: string | null;
  capacity: number | null;
  status: ReservationStatus;
  waiting_sequence: number | null;
  deposit_timeout_until: number | null;
  amount: number;
  created_at: number;
  matching_post_id: string | null;
  batch_id: string | null;
};

function rowToReservation(r: ReservationRow): Reservation {
  return {
    id: r.id,
    type: r.type,
    userId: r.user_id,
    targetId: r.target_id,
    targetLabel: r.target_label,
    date: r.date,
    timeSlot: r.time_slot || undefined,
    capacity: r.capacity || undefined,
    status: r.status,
    waitingSequence: r.waiting_sequence,
    depositTimeoutUntil: r.deposit_timeout_until,
    amount: r.amount,
    createdAt: r.created_at,
    matchingPostId: r.matching_post_id || undefined,
    batchId: r.batch_id || undefined,
  };
}

function reservationToRow(r: Reservation): ReservationRow {
  return {
    id: r.id,
    type: r.type,
    user_id: r.userId,
    target_id: r.targetId,
    target_label: r.targetLabel,
    date: r.date,
    time_slot: r.timeSlot || null,
    capacity: r.capacity || null,
    status: r.status,
    waiting_sequence: r.waitingSequence,
    deposit_timeout_until: r.depositTimeoutUntil || null,
    amount: r.amount,
    created_at: r.createdAt,
    matching_post_id: r.matchingPostId || null,
    batch_id: r.batchId || null,
  };
}

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
  galleryItems: GalleryItem[];
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
    timeSlots: string[];
  }) => { ok: boolean; reason?: string; reservations?: Reservation[] };
  requestWaiting: (reservationId: string) => { ok: boolean; sequence?: number };
  cancelReservation: (id: string) => void;
  approveReservation: (id: string) => void;
  approveReservations: (ids: string[]) => void;
  rejectReservation: (id: string) => void;

  // matching
  createMatchingPost: (input: {
    court: CourtName;
    date: string;
    timeSlots: string[];
    ntrpRequirement: NTRP | 'any';
    genderRequirement: GenderRequirement;
    maxPlayers: number;
    gameType: GameType;
    description: string;
  }) => { ok: boolean; reason?: string; post?: MatchingPost };
  createMatchingPostFromReservation: (input: {
    reservationIds: string[];
    ntrpRequirement: NTRP | 'any';
    genderRequirement: GenderRequirement;
    maxPlayers: number;
    gameType: GameType;
    description: string;
  }) => { ok: boolean; reason?: string; post?: MatchingPost };
  applyMatching: (postId: string, intro: string, gender?: ApplicantGender) => { ok: boolean; reason?: string };
  approveMatchingApplication: (postId: string, applicationId: string) => void;
  rejectMatchingApplication: (postId: string, applicationId: string) => void;
  closeMatching: (postId: string) => void;
  deleteMatchingPost: (postId: string) => void;

  // notices
  createNotice: (n: { title: string; content: string; type: NoticeType }) => void;
  deleteNotice: (id: string) => void;

  // gallery
  createGalleryItem: (input: { imageUrl: string; summary: string }) => void;
  deleteGalleryItem: (id: string) => void;

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

  // temporary holidays
  tempHolidays: string[];
  toggleHoliday: (dateStr: string) => void;
  isHoliday: (dateStr: string) => boolean;

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

  // Load all profiles from Supabase so admin can resolve any user's name/phone
  const loadProfiles = useCallback(async () => {
    if (!supabaseConfigured) return;
    const { data } = await supabase.from('profiles').select('*');
    if (!data) return;
    setUsers((prev) => {
      const existingIds = new Set(prev.map((u) => u.id));
      const loaded: User[] = data
        .filter((p) => !existingIds.has(p.id))
        .map((p) => ({
          id: p.id as string,
          name: (p.name as string) || '사용자',
          nickname: (p.nickname as string) || '',
          phone: (p.phone as string) || '',
          profileImg:
            (p.profile_img as string) || '/logo_png.png',
          career: (p.career as string) || '0년',
          ntrp: (p.ntrp as NTRP) || '2.0',
          hand: (p.hand as Hand) || 'right',
          gamePreference: (p.game_preference as GamePreference) || 'any',
          bio: (p.bio as string) || '',
          isAdmin: false,
        }));
      // Also update existing entries with fresh profile data
      const updated = prev.map((u) => {
        const fresh = data.find((p) => p.id === u.id);
        if (!fresh) return u;
        return {
          ...u,
          name: (fresh.name as string) || u.name,
          nickname: (fresh.nickname as string) || u.nickname,
          phone: (fresh.phone as string) || u.phone,
          profileImg: (fresh.profile_img as string) || u.profileImg,
        };
      });
      return [...updated, ...loaded];
    });
  }, []);

  useEffect(() => {
    if (!supabaseConfigured) return;
    loadProfiles();
    const channel = supabase
      .channel('profiles_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => loadProfiles(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadProfiles]);
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [reservations, setReservations] = useState<Reservation[]>(initialReservations);
  const [matchingPosts, setMatchingPosts] = useState<MatchingPost[]>(initialMatchingPosts);

  const syncMatchingPost = useCallback(async (post: MatchingPost) => {
    if (!supabaseConfigured) return;
    const { error } = await supabase.from('matching_posts').upsert({
      id: post.id,
      reservation_id: post.reservationId,
      reservation_ids: post.reservationIds,
      user_id: post.userId,
      date: post.date,
      time: post.time,
      court: post.court,
      ntrp_requirement: post.ntrpRequirement,
      gender_requirement: post.genderRequirement,
      max_players: post.maxPlayers,
      game_type: post.gameType,
      description: post.description,
      status: post.status,
      court_approved: post.courtApproved,
      applications: post.applications,
      created_at: post.createdAt,
    });
    if (error) console.error('matching_posts sync failed', error);
  }, []);

  // Load matching posts from Supabase so they survive refresh
  const loadMatchingPosts = useCallback(async () => {
    if (!supabaseConfigured) return;
    const { data } = await supabase
      .from('matching_posts')
      .select('*')
      .order('created_at', { ascending: false });
    if (data && data.length > 0) {
      setMatchingPosts(
        data.map((p) => ({
          id: p.id as string,
          reservationId: p.reservation_id as string,
          reservationIds: (p.reservation_ids as string[]) || [],
          userId: p.user_id as string,
          date: p.date as string,
          time: p.time as string,
          court: p.court as CourtName,
          ntrpRequirement: p.ntrp_requirement as NTRP | 'any',
          genderRequirement: p.gender_requirement as GenderRequirement,
          maxPlayers: p.max_players as number,
          gameType: p.game_type as GameType,
          description: p.description as string,
          status: p.status as MatchingStatus,
          courtApproved: (p.court_approved as boolean) ?? false,
          applications: (p.applications as MatchingApplication[]) || [],
          createdAt: p.created_at as number,
        })),
      );
    }
  }, []);

  useEffect(() => {
    if (!supabaseConfigured) return;
    loadMatchingPosts();
    // Realtime: refresh matching posts when any row changes so hosts
    // see new applicants without a manual page reload.
    const channel = supabase
      .channel('matching_posts_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matching_posts' },
        () => {
          loadMatchingPosts();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadMatchingPosts]);
  const [notices, setNotices] = useState<Notice[]>(initialNotices);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);

  // Load notices from Supabase so admin edits are shared across sessions
  useEffect(() => {
    if (!supabaseConfigured) return;
    (async () => {
      const { data } = await supabase
        .from('notices')
        .select('*')
        .order('created_at', { ascending: false });
      if (data && data.length > 0) {
        setNotices(
          data.map((n) => ({
            id: n.id as string,
            title: n.title as string,
            content: n.content as string,
            type: n.type as NoticeType,
            createdAt: n.created_at as number,
          })),
        );
      }
    })();
  }, []);

  // Load gallery items from Supabase
  useEffect(() => {
    if (!supabaseConfigured) return;
    (async () => {
      const { data } = await supabase
        .from('gallery_items')
        .select('*')
        .order('created_at', { ascending: false });
      if (data && data.length > 0) {
        setGalleryItems(
          data.map((g) => ({
            id: g.id as string,
            imageUrl: g.image_url as string,
            summary: g.summary as string,
            createdAt: g.created_at as number,
          })),
        );
      }
    })();
  }, []);
  const [notifications, setNotifications] = useState<AppNotification[]>(initialNotifications);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // ===== Supabase reservation persistence =====
  const upsertReservationToSupabase = useCallback(async (r: Reservation) => {
    if (!supabaseConfigured) return;
    await supabase.from('reservations').upsert(reservationToRow(r));
  }, []);

  const deleteReservationFromSupabase = useCallback(async (id: string) => {
    if (!supabaseConfigured) return;
    await supabase.from('reservations').delete().eq('id', id);
  }, []);

  const loadReservations = useCallback(async () => {
    if (!supabaseConfigured) return;
    const { data } = await supabase
      .from('reservations')
      .select('*')
      .order('created_at', { ascending: true });
    if (data && data.length > 0) {
      setReservations(data.map((r) => rowToReservation(r as ReservationRow)));
    }
  }, []);

  useEffect(() => {
    if (!supabaseConfigured) return;
    loadReservations();
    const channel = supabase
      .channel('reservations_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reservations' },
        () => loadReservations(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadReservations]);
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
  const [bannerImageUrl, setBannerImageUrl] = useState<string | null>(null);
  const [logoImageUrl, setLogoImageUrl] = useState<string | null>(null);
  const [tempHolidays, setTempHolidays] = useState<string[]>([]);

  // Load all settings (pension prices, overrides, banner, logo) from Supabase
  useEffect(() => {
    if (!supabaseConfigured) return;
    (async () => {
      const { data } = await supabase
        .from('settings')
        .select('banner_image_url, logo_image_url, pension_weekday_price, pension_weekend_price, pension_price_overrides, temp_holidays')
        .eq('id', 1)
        .maybeSingle();
      if (data) {
        setBannerImageUrl(data.banner_image_url);
        setLogoImageUrl(data.logo_image_url);
        if (data.pension_weekday_price != null) setPensionWeekdayPrice(data.pension_weekday_price);
        if (data.pension_weekend_price != null) setPensionWeekendPrice(data.pension_weekend_price);
        if (data.pension_price_overrides) setPensionPriceOverrides(data.pension_price_overrides as Record<string, number>);
        if (Array.isArray(data.temp_holidays)) setTempHolidays(data.temp_holidays as string[]);
      }
    })();
  }, []);

  // Load rooms from Supabase so admin edits are shared across sessions
  useEffect(() => {
    if (!supabaseConfigured) return;
    (async () => {
      const { data } = await supabase.from('rooms').select('*');
      if (!data || data.length === 0) return;
      setRooms(
        data.map((r) => ({
          id: r.id as string,
          name: r.name as RoomName,
          maxCapacity: r.max_capacity as number,
          description: r.description as string,
          pricePerNight: r.price_per_night as number,
        })),
      );
    })();
  }, []);

  const updateRoom = useCallback(
    (id: string, patch: Partial<Pick<Room, 'maxCapacity' | 'description'>>) => {
      setRooms((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
      if (supabaseConfigured) {
        const row: Record<string, unknown> = { id, updated_at: new Date().toISOString() };
        if (patch.maxCapacity != null) row.max_capacity = patch.maxCapacity;
        if (patch.description != null) row.description = patch.description;
        supabase.from('rooms').update(row).eq('id', id).then(({ error }) => {
          if (error) pushToast('객실 정보 저장 실패', 'error');
        });
      }
      pushToast('객실 정보가 변경되었습니다.');
    },
    [pushToast],
  );

  const getPensionPrice = useCallback(
    (dateStr: string) => {
      if (pensionPriceOverrides[dateStr] != null) return pensionPriceOverrides[dateStr];
      const isHolidayDate = isWeekendOrHoliday(dateStr) || tempHolidays.includes(dateStr);
      return isHolidayDate ? pensionWeekendPrice : pensionWeekdayPrice;
    },
    [pensionWeekdayPrice, pensionWeekendPrice, pensionPriceOverrides, tempHolidays],
  );

  const updatePensionPrice = useCallback(
    (weekday: number, weekend: number) => {
      setPensionWeekdayPrice(weekday);
      setPensionWeekendPrice(weekend);
      if (supabaseConfigured) {
        supabase
          .from('settings')
          .upsert({
            id: 1,
            banner_image_url: bannerImageUrl,
            logo_image_url: logoImageUrl,
            pension_weekday_price: weekday,
            pension_weekend_price: weekend,
            pension_price_overrides: pensionPriceOverrides,
            temp_holidays: tempHolidays,
            updated_at: new Date().toISOString(),
          })
          .then(({ error }) => {
            if (error) pushToast('펜션 요금 저장 실패', 'error');
          });
      }
      pushToast('펜션 기본 요금이 변경되었습니다.');
    },
    [pushToast, pensionPriceOverrides, bannerImageUrl, logoImageUrl, tempHolidays],
  );

  const setPensionPriceForDate = useCallback(
    (dateStr: string, price: number) => {
      setPensionPriceOverrides((prev) => {
        const next = { ...prev, [dateStr]: price };
        if (supabaseConfigured) {
          supabase
            .from('settings')
            .upsert({
              id: 1,
              banner_image_url: bannerImageUrl,
              logo_image_url: logoImageUrl,
              pension_weekday_price: pensionWeekdayPrice,
              pension_weekend_price: pensionWeekendPrice,
              pension_price_overrides: next,
              updated_at: new Date().toISOString(),
            })
            .then(({ error }) => {
              if (error) pushToast('개별 요금 저장 실패', 'error');
            });
        }
        return next;
      });
      pushToast(`${dateStr} 요금이 설정되었습니다.`);
    },
    [pushToast, pensionWeekdayPrice, pensionWeekendPrice, bannerImageUrl, logoImageUrl],
  );

  const removePensionPriceOverride = useCallback(
    (dateStr: string) => {
      setPensionPriceOverrides((prev) => {
        const next = { ...prev };
        delete next[dateStr];
        if (supabaseConfigured) {
          supabase
            .from('settings')
            .upsert({
              id: 1,
              banner_image_url: bannerImageUrl,
              logo_image_url: logoImageUrl,
              pension_weekday_price: pensionWeekdayPrice,
              pension_weekend_price: pensionWeekendPrice,
              pension_price_overrides: next,
              temp_holidays: tempHolidays,
              updated_at: new Date().toISOString(),
            })
            .then(({ error }) => {
              if (error) pushToast('개별 요금 삭제 실패', 'error');
            });
        }
        return next;
      });
      pushToast(`${dateStr} 개별 요금이 삭제되었습니다.`, 'info');
    },
    [pushToast, pensionWeekdayPrice, pensionWeekendPrice, bannerImageUrl, logoImageUrl, tempHolidays],
  );

  const updateBannerImage = useCallback(
    (url: string | null) => {
      setBannerImageUrl(url);
      if (supabaseConfigured) {
        supabase
          .from('settings')
          .upsert({
            id: 1,
            banner_image_url: url,
            logo_image_url: logoImageUrl,
            pension_weekday_price: pensionWeekdayPrice,
            pension_weekend_price: pensionWeekendPrice,
            pension_price_overrides: pensionPriceOverrides,
            temp_holidays: tempHolidays,
            updated_at: new Date().toISOString(),
          })
          .then(({ error }) => {
            if (error) pushToast('배너 이미지 저장 실패', 'error');
          });
      }
      pushToast(url ? '배너 이미지가 변경되었습니다.' : '배너 이미지가 초기화되었습니다.');
    },
    [pushToast, logoImageUrl, pensionWeekdayPrice, pensionWeekendPrice, pensionPriceOverrides, tempHolidays],
  );

  const updateLogoImage = useCallback(
    (url: string | null) => {
      setLogoImageUrl(url);
      if (supabaseConfigured) {
        supabase
          .from('settings')
          .upsert({
            id: 1,
            banner_image_url: bannerImageUrl,
            logo_image_url: url,
            pension_weekday_price: pensionWeekdayPrice,
            pension_weekend_price: pensionWeekendPrice,
            pension_price_overrides: pensionPriceOverrides,
            temp_holidays: tempHolidays,
            updated_at: new Date().toISOString(),
          })
          .then(({ error }) => {
            if (error) pushToast('로고 이미지 저장 실패', 'error');
          });
      }
      pushToast(url ? '로고 이미지가 변경되었습니다.' : '로고 이미지가 초기화되었습니다.');
    },
    [pushToast, bannerImageUrl, pensionWeekdayPrice, pensionWeekendPrice, pensionPriceOverrides, tempHolidays],
  );

  const toggleHoliday = useCallback(
    (dateStr: string) => {
      setTempHolidays((prev) => {
        const next = prev.includes(dateStr)
          ? prev.filter((d) => d !== dateStr)
          : [...prev, dateStr].sort();
        if (supabaseConfigured) {
          supabase
            .from('settings')
            .upsert({
              id: 1,
              banner_image_url: bannerImageUrl,
              logo_image_url: logoImageUrl,
              pension_weekday_price: pensionWeekdayPrice,
              pension_weekend_price: pensionWeekendPrice,
              pension_price_overrides: pensionPriceOverrides,
              temp_holidays: next,
              updated_at: new Date().toISOString(),
            })
            .then(({ error }) => {
              if (error) pushToast('임시 공휴일 저장 실패', 'error');
            });
        }
        return next;
      });
    },
    [pushToast, pensionWeekdayPrice, pensionWeekendPrice, bannerImageUrl, logoImageUrl, pensionPriceOverrides],
  );

  const isHoliday = useCallback(
    (dateStr: string): boolean => isWeekendOrHoliday(dateStr) || tempHolidays.includes(dateStr),
    [tempHolidays],
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
      // A동 pension blocks A코트 only; B동 pension blocks B코트 only
      const courtBuilding = court[0];
      return reservations.some(
        (r) =>
          r.type === 'pension' &&
          r.date === date &&
          r.status === '예약완료' &&
          r.waitingSequence === null &&
          r.targetLabel[0] === courtBuilding,
      );
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

      const batchId = uid('b');
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
        batchId,
      };

      setReservations((prev) => [...prev, reservation]);
      upsertReservationToSupabase(reservation);
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
    [rooms, reservations, currentUserId, isPensionBlockedByCourt, addNotification, getUser, pushToast, upsertReservationToSupabase],
  );

  // ===== Create court reservation =====
  const createCourtReservation = useCallback(
    (input: { court: CourtName; date: string; timeSlots: string[] }) => {
      if (input.timeSlots.length === 0) {
        return { ok: false, reason: '시간대를 선택해주세요.' };
      }
      for (const slot of input.timeSlots) {
        if (!COURT_TIME_SLOTS.includes(slot as (typeof COURT_TIME_SLOTS)[number])) {
          return { ok: false, reason: '잘못된 시간대입니다.' };
        }
      }
      if (isCourtBlockedByPension(input.date, input.court)) {
        return { ok: false, reason: '해당 날짜에 펜션 예약이 완료되어 코트 이용이 불가합니다.' };
      }
      for (const slot of input.timeSlots) {
        const slotStatus = getCourtSlotStatus(input.date, input.court, slot);
        if (slotStatus === 'booked' || slotStatus === 'pending') {
          return { ok: false, reason: `${slot}은(는) 이미 예약되었거나 신청 중인 시간대입니다.` };
        }
      }

      const batchId = uid('b');
      const newReservations: Reservation[] = input.timeSlots.map((slot) => ({
        id: uid('r'),
        type: 'court',
        userId: currentUserId,
        targetId: input.court,
        targetLabel: input.court,
        date: input.date,
        timeSlot: slot,
        status: '신청',
        waitingSequence: null,
        amount: getCourtSlotPrice(input.date, slot, tempHolidays),
        createdAt: Date.now(),
        batchId,
      }));
      setReservations((prev) => [...prev, ...newReservations]);
      newReservations.forEach((r) => upsertReservationToSupabase(r));
      addNotification({
        kind: 'reservation_new',
        title: '새 코트 예약 신청',
        body: `${getUser(currentUserId)?.name}님이 ${input.court} ${input.timeSlots.join(', ')} 예약을 신청했습니다.`,
        targetUserId: currentUserId,
      });
      pushToast(`${input.timeSlots.length}개 시간대 코트 예약 신청 완료! 입금 후 관리자 승인을 기다려주세요.`);
      return { ok: true, reservations: newReservations };
    },
    [isCourtBlockedByPension, getCourtSlotStatus, currentUserId, addNotification, getUser, pushToast, upsertReservationToSupabase],
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
      upsertReservationToSupabase(newWaiting);
      pushToast(`대기 신청 완료! 대기 ${seq}순위`);
      return { ok: true, sequence: seq };
    },
    [reservations, currentUserId, pushToast, upsertReservationToSupabase],
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
      upsertReservationToSupabase({ ...next, status: '입금대기', waitingSequence: null, depositTimeoutUntil: timeoutUntil });
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
    [reservations, addNotification, getUser, pushToast, upsertReservationToSupabase],
  );

  // ===== Cancel reservation =====
  const cancelReservation = useCallback(
    (id: string) => {
      const target = reservations.find((r) => r.id === id);
      if (!target) return;
      const cancelled: Reservation = { ...target, status: '취소' as ReservationStatus, depositTimeoutUntil: null };
      setReservations((prev) =>
        prev.map((r) => (r.id === id ? cancelled : r)),
      );
      upsertReservationToSupabase(cancelled);
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
    },
    [reservations, promoteNextWaiting, addNotification, getUser, pushToast, upsertReservationToSupabase],
  );

  // ===== Approve reservation (admin) =====
  const approveReservation = useCallback(
    (id: string) => {
      const target = reservations.find((r) => r.id === id);
      if (!target) return;
      const approved: Reservation = { ...target, status: '예약완료' as ReservationStatus };
      setReservations((prev) =>
        prev.map((r) => (r.id === id ? approved : r)),
      );
      upsertReservationToSupabase(approved);
      addNotification({
        kind: 'reservation_approved',
        title: '예약 승인 완료',
        body: `${getUser(target.userId)?.name}님의 ${target.targetLabel} 예약이 승인(예약완료) 처리되었습니다.`,
        targetUserId: target.userId,
      });
      pushToast(`${getUser(target.userId)?.name}님 예약 승인 완료`);

      // Activate matching post if this reservation belongs to one
      setMatchingPosts((mpPrev) => {
        const mp = mpPrev.find((p) => p.reservationIds.includes(id));
        if (!mp || mp.courtApproved) return mpPrev;
        const allApproved = mp.reservationIds.every((rid) =>
          rid === id ? true : reservations.find((r) => r.id === rid)?.status === '예약완료',
        );
        if (!allApproved) return mpPrev;
        const activated = { ...mp, courtApproved: true, status: '모집중' as MatchingStatus };
        syncMatchingPost(activated);
        return mpPrev.map((p) => (p.id === mp.id ? activated : p));
      });
    },
    [reservations, addNotification, getUser, pushToast, upsertReservationToSupabase, syncMatchingPost],
  );

  // ===== Approve multiple reservations at once (admin) =====
  const approveReservations = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;
      const targets = reservations.filter((r) => ids.includes(r.id));
      if (targets.length === 0) return;
      const firstName = getUser(targets[0].userId)?.name || '회원';
      addNotification({
        kind: 'reservation_approved',
        title: '예약 승인 완료',
        body: `${firstName}님의 예약 ${targets.length}건이 승인(예약완료) 처리되었습니다.`,
        targetUserId: targets[0].userId,
      });
      pushToast(`${firstName}님 예약 ${targets.length}건 승인 완료`);
      const approvedMap = new Map<string, Reservation>();
      setReservations((prev) =>
        prev.map((r) => {
          if (!ids.includes(r.id)) return r;
          const approved = { ...r, status: '예약완료' as ReservationStatus };
          approvedMap.set(r.id, approved);
          return approved;
        }),
      );
      for (const id of ids) {
        const approved = approvedMap.get(id);
        if (approved) upsertReservationToSupabase(approved);
      }

      // Activate matching posts if all their reservations are now approved
      setMatchingPosts((mpPrev) => {
        let next = mpPrev;
        for (const mp of mpPrev) {
          if (mp.courtApproved) continue;
          const allApproved = mp.reservationIds.every((rid) => {
            const approved = approvedMap.get(rid);
            if (approved) return approved.status === '예약완료';
            return reservations.find((r) => r.id === rid)?.status === '예약완료';
          });
          if (!allApproved) continue;
          const activated = { ...mp, courtApproved: true, status: '모집중' as MatchingStatus };
          syncMatchingPost(activated);
          next = next.map((p) => (p.id === mp.id ? activated : p));
        }
        return next;
      });
    },
    [reservations, addNotification, getUser, pushToast, upsertReservationToSupabase, syncMatchingPost],
  );

  const rejectReservation = useCallback(
    (id: string) => {
      const target = reservations.find((r) => r.id === id);
      if (!target) return;
      const rejected: Reservation = { ...target, status: '취소' as ReservationStatus };
      setReservations((prev) =>
        prev.map((r) => (r.id === id ? rejected : r)),
      );
      upsertReservationToSupabase(rejected);
      addNotification({
        kind: 'reservation_rejected',
        title: '예약 거절',
        body: `${getUser(target.userId)?.name}님의 ${target.targetLabel} 예약 신청이 거절되었습니다.`,
        targetUserId: target.userId,
      });
      pushToast(`${getUser(target.userId)?.name}님 예약 거절 처리`, 'error');

      // If this reservation belongs to a matching post, remove the matching post
      if (target.matchingPostId) {
        setMatchingPosts((mpPrev) => {
          const mp = mpPrev.find((p) => p.id === target.matchingPostId);
          if (!mp) return mpPrev;
          if (supabaseConfigured) {
            supabase.from('matching_posts').delete().eq('id', mp.id).then(({ error }) => {
              if (error) pushToast('매칭 삭제 실패: ' + error.message, 'error');
            });
          }
          addNotification({
            kind: 'reservation_rejected',
            title: '매칭글 삭제',
            body: '대관 승인이 거절되어 매칭글이 삭제되었습니다.',
            targetUserId: mp.userId,
          });
          return mpPrev.filter((p) => p.id !== mp.id);
        });
      }
    },
    [reservations, addNotification, getUser, pushToast, upsertReservationToSupabase, supabaseConfigured],
  );

  // ===== Matching =====
  const createMatchingPost = useCallback(
    (input: {
      court: CourtName;
      date: string;
      timeSlots: string[];
      ntrpRequirement: NTRP | 'any';
      genderRequirement: GenderRequirement;
      maxPlayers: number;
      gameType: GameType;
      description: string;
    }) => {
      if (input.timeSlots.length === 0) {
        return { ok: false, reason: '시간대를 선택해주세요.' };
      }
      if (input.maxPlayers < 2 || input.maxPlayers > MATCHING_MAX_PLAYERS) {
        return { ok: false, reason: `모집 인원은 2~${MATCHING_MAX_PLAYERS}명이어야 합니다.` };
      }
      // Blocked by pension reservation?
      if (isCourtBlockedByPension(input.date, input.court)) {
        return { ok: false, reason: '해당 날짜에 펜션 예약이 완료되어 코트 이용이 불가합니다.' };
      }
      // Check court slot availability (same as court reservation)
      for (const slot of input.timeSlots) {
        const slotStatus = getCourtSlotStatus(input.date, input.court, slot);
        if (slotStatus === 'booked' || slotStatus === 'pending') {
          return { ok: false, reason: `${slot}은(는) 이미 예약되었거나 신청 중인 시간대입니다.` };
        }
      }

      // Create court reservations for the host (same flow as createCourtReservation)
      const matchingPostId = uid('m');
      const batchId = uid('b');
      const newReservations: Reservation[] = input.timeSlots.map((slot) => ({
        id: uid('r'),
        type: 'court',
        userId: currentUserId,
        targetId: input.court,
        targetLabel: input.court,
        date: input.date,
        timeSlot: slot,
        status: '신청',
        waitingSequence: null,
        amount: getCourtSlotPrice(input.date, slot, tempHolidays),
        createdAt: Date.now(),
        matchingPostId,
        batchId,
      }));
      setReservations((prev) => [...prev, ...newReservations]);
      newReservations.forEach((r) => upsertReservationToSupabase(r));

      const reservationId = newReservations[0].id;
      const reservationIds = newReservations.map((r) => r.id);
      const post: MatchingPost = {
        id: matchingPostId,
        reservationId,
        reservationIds,
        userId: currentUserId,
        date: input.date,
        time: mergeTimeSlots(input.timeSlots),
        court: input.court,
        ntrpRequirement: input.ntrpRequirement,
        genderRequirement: input.genderRequirement,
        maxPlayers: input.maxPlayers,
        gameType: input.gameType,
        description: input.description,
        status: '대관대기',
        courtApproved: false,
        applications: [],
        createdAt: Date.now(),
      };
      setMatchingPosts((prev) => [post, ...prev]);
      syncMatchingPost(post);
      addNotification({
        kind: 'matching_new',
        title: '새 매칭 모집',
        body: `${getUser(currentUserId)?.name}님이 ${input.date} ${mergeTimeSlots(input.timeSlots)} ${input.court} 매칭을 모집합니다.`,
        targetUserId: currentUserId,
      });
      pushToast('매칭글이 등록되었습니다. 코트 예약 신청도 함께 접수되었습니다.');
      return { ok: true, post };
    },
    [isCourtBlockedByPension, getCourtSlotStatus, currentUserId, addNotification, getUser, pushToast, upsertReservationToSupabase],
  );

  const createMatchingPostFromReservation = useCallback(
    (input: {
      reservationIds: string[];
      ntrpRequirement: NTRP | 'any';
      genderRequirement: GenderRequirement;
      maxPlayers: number;
      gameType: GameType;
      description: string;
    }) => {
      const batchReservations = reservations.filter((r) => input.reservationIds.includes(r.id));
      if (batchReservations.length === 0) return { ok: false, reason: '예약을 찾을 수 없습니다.' };
      if (batchReservations.some((r) => r.type !== 'court')) return { ok: false, reason: '코트 예약만 매칭 모집 가능합니다.' };
      if (batchReservations.some((r) => r.status !== '예약완료')) return { ok: false, reason: '예약완료 건만 매칭 모집 가능합니다.' };
      const alreadyMatched = batchReservations.some((r) => matchingPosts.some((p) => p.reservationIds.includes(r.id)));
      if (alreadyMatched) return { ok: false, reason: '이미 해당 예약으로 매칭글이 등록되어 있습니다.' };
      const first = batchReservations[0];
      const timeLabel = mergeTimeSlots(batchReservations.map((r) => r.timeSlot || '').filter(Boolean));
      const post: MatchingPost = {
        id: crypto.randomUUID(),
        reservationId: first.id,
        reservationIds: input.reservationIds,
        userId: currentUserId,
        date: first.date,
        time: timeLabel,
        court: first.targetId as CourtName,
        ntrpRequirement: input.ntrpRequirement,
        genderRequirement: input.genderRequirement,
        maxPlayers: input.maxPlayers,
        gameType: input.gameType,
        description: input.description.slice(0, 500),
        status: '모집중',
        courtApproved: true,
        applications: [],
        createdAt: Date.now(),
      };
      setMatchingPosts((prev) => [post, ...prev]);
      syncMatchingPost(post);
      pushToast('매칭 모집글이 등록되었습니다.');
      return { ok: true, post };
    },
    [reservations, matchingPosts, currentUserId, pushToast, syncMatchingPost],
  );

  const applyMatching = useCallback(
    (postId: string, intro: string, gender?: ApplicantGender) => {
      const post = matchingPosts.find((p) => p.id === postId);
      if (!post) return { ok: false, reason: '매칭글을 찾을 수 없습니다.' };
      if (!post.courtApproved) return { ok: false, reason: '아직 코트 대관 승인 대기 중입니다. 관리자 승인 후 신청 가능합니다.' };
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
        intro: intro.slice(0, 100),
        gender,
      };
      setMatchingPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          const updated = { ...p, applications: [...p.applications, app] };
          syncMatchingPost(updated);
          return updated;
        }),
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
          const updated = { ...p, applications: apps, status };
          syncMatchingPost(updated);
          return updated;
        }),
      );
      pushToast('매칭 신청을 승인했습니다.');
    },
    [addNotification, getUser, pushToast],
  );

  const rejectMatchingApplication = useCallback(
    (postId: string, applicationId: string, reason?: string) => {
      setMatchingPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          const apps = p.applications.map((a) =>
            a.id === applicationId ? { ...a, status: '거절' as const, rejectReason: reason?.slice(0, 100) } : a,
          );
          const app = apps.find((a) => a.id === applicationId);
          if (app) {
            addNotification({
              kind: 'matching_rejected',
              title: '매칭 신청 거절',
              body: reason?.trim()
                ? `${getUser(p.userId)?.name}님이 회원님의 매칭 신청을 거절했습니다. 사유: ${reason.trim()}`
                : `${getUser(p.userId)?.name}님이 회원님의 매칭 신청을 거절했습니다.`,
              targetUserId: app.userId,
            });
          }
          const updated = { ...p, applications: apps };
          syncMatchingPost(updated);
          return updated;
        }),
      );
      pushToast('매칭 신청을 거절했습니다.', 'info');
    },
    [addNotification, getUser, pushToast],
  );

  const closeMatching = useCallback(
    (postId: string) => {
      setMatchingPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          const updated = { ...p, status: '모집완료' as const };
          syncMatchingPost(updated);
          return updated;
        }),
      );
      pushToast('매칭을 완료했습니다.', 'info');
    },
    [pushToast],
  );

  const deleteMatchingPost = useCallback(
    (postId: string) => {
      setMatchingPosts((prev) => prev.filter((p) => p.id !== postId));
      if (supabaseConfigured) {
        supabase.from('matching_posts').delete().eq('id', postId).then(({ error }) => {
          if (error) pushToast('매칭 삭제 실패: ' + error.message, 'error');
        });
      }
      pushToast('매칭글이 삭제되었습니다.', 'info');
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
      if (supabaseConfigured) {
        supabase.from('notices').insert({
          id: notice.id,
          title: notice.title,
          content: notice.content,
          type: notice.type,
          created_at: notice.createdAt,
        }).then(({ error }) => {
          if (error) pushToast('공지 저장 실패: ' + error.message, 'error');
        });
      }
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
      if (supabaseConfigured) {
        supabase.from('notices').delete().eq('id', id).then(({ error }) => {
          if (error) pushToast('공지 삭제 실패: ' + error.message, 'error');
        });
      }
      pushToast('공지사항이 삭제되었습니다.', 'info');
    },
    [pushToast],
  );

  // ===== Gallery =====
  const createGalleryItem = useCallback(
    (input: { imageUrl: string; summary: string }) => {
      const item: GalleryItem = {
        id: uid('g'),
        imageUrl: input.imageUrl,
        summary: input.summary,
        createdAt: Date.now(),
      };
      setGalleryItems((prev) => [item, ...prev]);
      if (supabaseConfigured) {
        supabase.from('gallery_items').insert({
          id: item.id,
          image_url: item.imageUrl,
          summary: item.summary,
          created_at: item.createdAt,
        }).then(({ error }) => {
          if (error) pushToast('갤러리 저장 실패: ' + error.message, 'error');
        });
      }
      pushToast('갤러리가 등록되었습니다.');
    },
    [pushToast],
  );

  const deleteGalleryItem = useCallback(
    (id: string) => {
      setGalleryItems((prev) => prev.filter((g) => g.id !== id));
      if (supabaseConfigured) {
        supabase.from('gallery_items').delete().eq('id', id).then(({ error }) => {
          if (error) pushToast('갤러리 삭제 실패: ' + error.message, 'error');
        });
      }
      pushToast('갤러리가 삭제되었습니다.', 'info');
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
    galleryItems,
    notifications,
    currentUser,
    getUser,
    updateCurrentUser,
    createPensionReservation,
    createCourtReservation,
    requestWaiting,
    cancelReservation,
    approveReservation,
    approveReservations,
    rejectReservation,
    createMatchingPost,
    createMatchingPostFromReservation,
    applyMatching,
    approveMatchingApplication,
    rejectMatchingApplication,
    closeMatching,
    deleteMatchingPost,
    createNotice,
    deleteNotice,
    createGalleryItem,
    deleteGalleryItem,
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
    tempHolidays,
    toggleHoliday,
    isHoliday,
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
