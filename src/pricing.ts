// 펜션 요금: 평일 65만원, 주말·공휴일 85만원 (1박 기준) — 기본값, 관리자가 변경 가능
// 코트 요금: 1시간 2만원 (2시간 슬롯 = 4만원)

export const COURT_PRICE_PER_HOUR = 20000;
export const COURT_SLOT_HOURS = 2;
export const COURT_SLOT_PRICE = COURT_PRICE_PER_HOUR * COURT_SLOT_HOURS; // 40000

export const PENSION_WEEKDAY_PRICE = 650000;
export const PENSION_WEEKEND_PRICE = 850000;

// 고정 공휴일 (MM-DD)
const FIXED_HOLIDAYS = new Set([
  '01-01', // 새해
  '03-01', // 삼일절
  '05-05', // 어린이날
  '06-06', // 현충일
  '08-15', // 광복절
  '10-03', // 개천절
  '10-09', // 한글날
  '12-25', // 크리스마스
]);

// 2026년 음력 공휴일 (YYYY-MM-DD)
const LUNAR_HOLIDAYS_2026 = new Set([
  '2026-02-16', '2026-02-17', '2026-02-18', // 설날 연휴
  '2026-05-27', // 부처님 오신 날
  '2026-09-23', '2026-09-24', '2026-09-25', // 추석 연휴
]);

export function isWeekendOrHoliday(dateStr: string): boolean {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay(); // 0=일, 6=토
  if (day === 0 || day === 6) return true;
  const md = dateStr.slice(5);
  if (FIXED_HOLIDAYS.has(md)) return true;
  if (LUNAR_HOLIDAYS_2026.has(dateStr)) return true;
  return false;
}

// 기본 요금 기준 (mockData 초기값용)
export function getPensionPrice(dateStr: string): number {
  return isWeekendOrHoliday(dateStr) ? PENSION_WEEKEND_PRICE : PENSION_WEEKDAY_PRICE;
}

export function formatWon(n: number): string {
  return n.toLocaleString('ko-KR') + '원';
}
