import type {
  User,
  Room,
  Reservation,
  MatchingPost,
  Notice,
  AppNotification,
} from './types';
import { getPensionPrice, COURT_SLOT_PRICE, COURT_SLOT_PRICE_PEAK } from './pricing';

// ===== Helpers =====
const today = new Date();
const ymd = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
const addDays = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  return ymd(d);
};

// ===== Users =====
export const initialUsers: User[] = [
  {
    id: 'u1',
    name: '김테니스',
    nickname: '테니스킹',
    phone: '010-1234-5678',
    profileImg:
      'https://images.pexels.com/photos/6457544/pexels-photo-6457544.jpeg?auto=compress&cs=tinysrgb&w=200',
    career: '5년',
    ntrp: '3.5',
    hand: 'right',
    gamePreference: 'doubles',
    bio: '주말 테니스 러버. 복식 좋아합니다!',
    isAdmin: false,
  },
  {
    id: 'u2',
    name: '이서연',
    nickname: '서연짱',
    phone: '010-9876-5432',
    profileImg:
      'https://images.pexels.com/photos/6457570/pexels-photo-6457570.jpeg?auto=compress&cs=tinysrgb&w=200',
    career: '3년',
    ntrp: '3.0',
    hand: 'right',
    gamePreference: 'mixed',
    bio: '혼성 복식 환영 🎾',
    isAdmin: false,
  },
  {
    id: 'u3',
    name: '박정훈',
    nickname: '정훈좌',
    phone: '010-5555-1111',
    profileImg:
      'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=200',
    career: '8년',
    ntrp: '4.0',
    hand: 'left',
    gamePreference: 'singles',
    bio: '단식 위주, 강서버',
    isAdmin: false,
  },
  {
    id: 'admin',
    name: '관리자',
    nickname: '관리자',
    phone: '010-0000-0000',
    profileImg:
      'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=200',
    career: '10년',
    ntrp: '4.5',
    hand: 'right',
    gamePreference: 'any',
    bio: '플테하 운영진',
    isAdmin: true,
  },
];

// ===== Rooms =====
export const initialRooms: Room[] = [
  {
    id: 'roomA',
    name: 'A동',
    maxCapacity: 8,
    description: '단층 펜션 / 테니스 코트 인접 · BBQ 석 available',
    pricePerNight: 650000,
  },
  {
    id: 'roomB',
    name: 'B동',
    maxCapacity: 8,
    description: '2층 펜션 / 넓은 거실 · 코트 전망 · 단체 선호',
    pricePerNight: 850000,
  },
];

// ===== Reservations =====
export const initialReservations: Reservation[] = [
  {
    id: 'r1',
    type: 'pension',
    userId: 'u1',
    targetId: 'roomA',
    targetLabel: 'A동',
    date: addDays(2),
    capacity: 6,
    status: '예약완료',
    waitingSequence: null,
    amount: getPensionPrice(addDays(2)),
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'r2',
    type: 'court',
    userId: 'u2',
    targetId: 'B코트',
    targetLabel: 'B코트',
    date: addDays(3),
    timeSlot: '15:00-17:00',
    status: '예약완료',
    waitingSequence: null,
    amount: COURT_SLOT_PRICE,
    createdAt: Date.now() - 86400000 * 2,
    matchingPostId: 'm2',
  },
  {
    id: 'r3',
    type: 'court',
    userId: 'u3',
    targetId: 'A코트',
    targetLabel: 'A코트',
    date: addDays(4),
    timeSlot: '19:00-21:00',
    status: '입금대기',
    waitingSequence: null,
    amount: COURT_SLOT_PRICE_PEAK,
    createdAt: Date.now() - 3600000 * 5,
  },
  {
    id: 'r4',
    type: 'pension',
    userId: 'u2',
    targetId: 'roomB',
    targetLabel: 'B동',
    date: addDays(2),
    capacity: 4,
    status: '신청',
    waitingSequence: null,
    amount: getPensionPrice(addDays(2)),
    createdAt: Date.now() - 3600000 * 2,
  },
  {
    id: 'r5',
    type: 'pension',
    userId: 'u3',
    targetId: 'roomA',
    targetLabel: 'A동',
    date: addDays(2),
    capacity: 5,
    status: '신청',
    waitingSequence: 1,
    amount: getPensionPrice(addDays(2)),
    createdAt: Date.now() - 3600000,
  },
];

// ===== Matching posts =====
export const initialMatchingPosts: MatchingPost[] = [
  {
    id: 'm1',
    reservationId: 'r1',
    reservationIds: ['r1'],
    userId: 'u1',
    date: addDays(2),
    time: '15:00-17:00',
    court: 'A코트',
    ntrpRequirement: '3.0',
    genderRequirement: 'any',
    maxPlayers: 4,
    gameType: 'doubles',
    description: 'A동 묵는 분들 같이 복식 한 게임 어때요! 편하게 신청주세요.',
    status: '모집중',
    courtApproved: true,
    applications: [
      {
        id: 'a1',
        userId: 'u2',
        status: '대기',
        appliedAt: Date.now() - 3600000,
        intro: 'NTRP 3.0 복식 즐겨요. 잘 부탁드립니다!',
        gender: 'male',
      },
    ],
    createdAt: Date.now() - 7200000,
  },
  {
    id: 'm2',
    reservationId: 'r2',
    reservationIds: ['r2'],
    userId: 'u2',
    date: addDays(3),
    time: '15:00-17:00',
    court: 'B코트',
    ntrpRequirement: '3.5',
    genderRequirement: 'female',
    maxPlayers: 4,
    gameType: 'doubles',
    description: '여성분 복식 메이트 구합니다. NTRP 3.5 이상.',
    status: '모집중',
    courtApproved: true,
    applications: [],
    createdAt: Date.now() - 1800000,
  },
];

// ===== Notices =====
export const initialNotices: Notice[] = [
  {
    id: 'n1',
    title: '7월 우천 시 코트 이용 안내',
    content:
      '비 예보가 있는 날에는 코트 예약이 자동 취소되며, 대기자에게 우선권이 부여됩니다. 우천 취소 시 100% 환불됩니다.',
    type: '우천',
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'n2',
    title: '여름맞이 펜션 스테이 이벤트',
    content:
      '7~8월 펜션 2박 이상 예약 시 코트 1시간 무료 이용권을 드립니다. (선착순 20팀)',
    type: '이벤트',
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: 'n3',
    title: '코트 이용 수칙',
    content:
      '1. 논마킹 신발만 착용 가능합니다.\n2. 코트 예약 시간 10분 전까지 입장해주세요.\n3. 음식물 반입을 금지합니다.',
    type: '이용수칙',
    createdAt: Date.now() - 86400000 * 10,
  },
];

// ===== Notifications =====
export const initialNotifications: AppNotification[] = [
  {
    id: 'nt1',
    kind: 'reservation_new',
    title: '새 예약 신청',
    body: '이서연님이 B동 펜션 예약을 신청했습니다.',
    targetUserId: 'u2',
    createdAt: Date.now() - 3600000 * 2,
    read: false,
  },
  {
    id: 'nt2',
    kind: 'matching_new',
    title: '새 매칭 모집',
    body: '김테니스님이 복식 메이트를 모집합니다.',
    targetUserId: 'u1',
    createdAt: Date.now() - 7200000,
    read: false,
  },
  {
    id: 'nt3',
    kind: 'reservation_approved',
    title: '예약 승인 완료',
    body: '김테니스님의 A동 펜션 예약이 승인되었습니다.',
    targetUserId: 'u1',
    createdAt: Date.now() - 86400000,
    read: true,
  },
];

export const BANK_ACCOUNT = {
  bank: '농협 (NH)',
  number: '302-1234-5678-09',
  holder: '플테하 (PLAY TENNIS HOUSE)',
};
