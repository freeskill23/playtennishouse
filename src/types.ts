// ===== Core domain types for 플테하 (PLAY TENNIS HOUSE) =====

export type Role = 'user' | 'admin';

export type Hand = 'right' | 'left' | 'both';
export type GamePreference = 'singles' | 'doubles' | 'mixed' | 'any';
export type NTRP = '1.0' | '1.5' | '2.0' | '2.5' | '3.0' | '3.5' | '4.0' | '4.5' | '5.0';

export interface User {
  id: string;
  name: string;
  nickname: string;
  phone: string;
  profileImg: string;
  career: string; // 구력
  ntrp: NTRP;
  hand: Hand;
  gamePreference: GamePreference;
  bio: string;
  isAdmin: boolean;
}

export type RoomName = 'A동' | 'B동';
export type CourtName = 'A코트' | 'B코트';

export interface Room {
  id: string;
  name: RoomName;
  maxCapacity: number;
  description: string;
  pricePerNight: number;
}

export type ReservationType = 'pension' | 'court';
export type ReservationStatus =
  | '신청'
  | '입금대기'
  | '승인대기'
  | '예약완료'
  | '이용완료'
  | '취소';

export interface Reservation {
  id: string;
  type: ReservationType;
  userId: string;
  targetId: string; // RoomId for pension, CourtName for court
  targetLabel: string; // display label e.g. 'A동', 'A코트'
  date: string; // YYYY-MM-DD
  timeSlot?: string; // for court, e.g. '09:00-11:00'
  capacity?: number; // for pension, number of guests
  status: ReservationStatus;
  waitingSequence: number | null; // null = primary reservation, 1+ = waiting
  depositTimeoutUntil?: number | null; // epoch ms - for waiting handoff
  amount: number;
  createdAt: number;
}

export type MatchingStatus = '모집중' | '모집완료' | '종료';
export type GameType = 'singles' | 'doubles' | 'mixed' | 'women_doubles' | 'men_doubles' | 'any';
export type GenderRequirement = 'male' | 'female' | 'any';

export interface MatchingApplication {
  id: string;
  userId: string;
  status: '대기' | '승인' | '거절';
  appliedAt: number;
  intro: string; // 한줄 소개
}

export const MATCHING_MAX_PLAYERS = 6;

export interface MatchingPost {
  id: string;
  reservationId: string;
  userId: string;
  date: string;
  time: string;
  court: CourtName;
  ntrpRequirement: NTRP | 'any';
  genderRequirement: GenderRequirement;
  maxPlayers: number;
  gameType: GameType;
  description: string;
  status: MatchingStatus;
  applications: MatchingApplication[];
  createdAt: number;
}

export type NoticeType = '이벤트' | '우천' | '환불' | '이용수칙';

export interface Notice {
  id: string;
  title: string;
  content: string;
  type: NoticeType;
  createdAt: number;
}

export type NotificationKind =
  | 'reservation_new'
  | 'reservation_approved'
  | 'reservation_rejected'
  | 'reservation_cancelled'
  | 'waiting_promoted'
  | 'waiting_timeout'
  | 'matching_new'
  | 'matching_approved'
  | 'matching_completed'
  | 'notice_new';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  targetUserId?: string;
  createdAt: number;
  read: boolean;
}

export const COURT_TIME_SLOTS = [
  '05:00-07:00',
  '07:00-09:00',
  '09:00-11:00',
  '11:00-13:00',
  '13:00-15:00',
  '15:00-17:00',
  '17:00-19:00',
  '19:00-21:00',
  '21:00-23:00',
] as const;

export const STATUS_META: Record<
  ReservationStatus,
  { label: string; cls: string; dot: string }
> = {
  신청: { label: '신청', cls: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
  입금대기: { label: '입금대기', cls: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  승인대기: { label: '승인대기', cls: 'bg-sky-100 text-sky-700', dot: 'bg-sky-500' },
  예약완료: { label: '예약완료', cls: 'bg-volt-100 text-volt-800', dot: 'bg-volt-500' },
  이용완료: { label: '이용완료', cls: 'bg-navy-100 text-navy-700', dot: 'bg-navy-500' },
  취소: { label: '취소', cls: 'bg-rose-100 text-rose-600', dot: 'bg-rose-500' },
};

export const NOTICE_META: Record<NoticeType, { cls: string; icon: string }> = {
  이벤트: { cls: 'bg-volt-100 text-volt-800', icon: 'PartyPopper' },
  우천: { cls: 'bg-sky-100 text-sky-700', icon: 'CloudRain' },
  환불: { cls: 'bg-amber-100 text-amber-700', icon: 'RotateCcw' },
  이용수칙: { cls: 'bg-navy-100 text-navy-700', icon: 'ShieldCheck' },
};
