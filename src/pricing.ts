// 펜션 요금: 평일 65만원, 주말·공휴일 85만원 (1박 기준) — 기본값, 관리자가 변경 가능
// 코트 요금: 평일 주간·야간, 주말/공휴일 주간·야간 각각 관리자가 설정 가능 (시간대 + 시간당 금액)

export const COURT_PRICE_PER_HOUR = 20000;
export const COURT_PRICE_PER_HOUR_PEAK = 25000;
export const COURT_SLOT_HOURS = 1;
export const COURT_SLOT_PRICE = COURT_PRICE_PER_HOUR * COURT_SLOT_HOURS; // 20000
export const COURT_SLOT_PRICE_PEAK = COURT_PRICE_PER_HOUR_PEAK * COURT_SLOT_HOURS; // 25000

export interface CourtPricingTier {
  startHour: number; // 0-23
  endHour: number; // 1-24 (exclusive)
  pricePerHour: number;
}

export interface CourtPricing {
  weekdayDay: CourtPricingTier;
  weekdayNight: CourtPricingTier;
  weekendDay: CourtPricingTier;
  weekendNight: CourtPricingTier;
}

export const DEFAULT_COURT_PRICING: CourtPricing = {
  weekdayDay: { startHour: 5, endHour: 17, pricePerHour: 20000 },
  weekdayNight: { startHour: 17, endHour: 24, pricePerHour: 25000 },
  weekendDay: { startHour: 5, endHour: 17, pricePerHour: 25000 },
  weekendNight: { startHour: 17, endHour: 24, pricePerHour: 25000 },
};

export function isWeekendOrHolidayDate(dateStr: string, extraHolidays?: string[]): boolean {
  return isWeekendOrHoliday(dateStr) || (extraHolidays?.includes(dateStr) ?? false);
}

export function getCourtSlotPriceWithConfig(
  pricing: CourtPricing,
  dateStr: string,
  slot: string,
  extraHolidays?: string[],
): number {
  const startHour = parseInt(slot.slice(0, 2), 10);
  const isHolidayDate = isWeekendOrHolidayDate(dateStr, extraHolidays);
  const isNight = startHour >= 17;
  const tier = isHolidayDate
    ? isNight
      ? pricing.weekendNight
      : pricing.weekendDay
    : isNight
      ? pricing.weekdayNight
      : pricing.weekdayDay;
  return tier.pricePerHour * COURT_SLOT_HOURS;
}

// 오후 5시(17:00) 이후 슬롯을 피크 시간으로 간주
function isPeakSlot(slot: string): boolean {
  const startHour = parseInt(slot.slice(0, 2), 10);
  return startHour >= 17;
}

export function getCourtSlotPrice(dateStr: string, slot: string, extraHolidays?: string[]): number {
  const isHolidayDate = isWeekendOrHoliday(dateStr) || (extraHolidays?.includes(dateStr) ?? false);
  if (isHolidayDate || isPeakSlot(slot)) return COURT_SLOT_PRICE_PEAK;
  return COURT_SLOT_PRICE;
}

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

// 펜션 주말 요금 기준: 금요일·토요일 체크인만 주말 요금.
// 일요일은 평일 요금 적용 (일요일→월요일 1박이 평일이 되도록).
// 공휴일은 요일과 무관하게 주말 요금 적용.
export function isPensionWeekendOrHoliday(dateStr: string): boolean {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay(); // 0=일, 5=금, 6=토
  const md = dateStr.slice(5);
  if (FIXED_HOLIDAYS.has(md)) return true;
  if (LUNAR_HOLIDAYS_2026.has(dateStr)) return true;
  return day === 5 || day === 6;
}

// 기본 요금 기준 (mockData 초기값용)
export function getPensionPrice(dateStr: string): number {
  return isWeekendOrHoliday(dateStr) ? PENSION_WEEKEND_PRICE : PENSION_WEEKDAY_PRICE;
}

export function formatWon(n: number): string {
  return n.toLocaleString('ko-KR') + '원';
}
