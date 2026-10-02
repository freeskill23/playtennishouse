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
export const FIXED_HOLIDAYS = new Set([
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
export const LUNAR_HOLIDAYS_2026 = new Set([
  '2026-02-16', '2026-02-17', '2026-02-18', // 설날 연휴
  '2026-05-27', // 부처님 오신 날
  '2026-09-23', '2026-09-24', '2026-09-25', // 추석 연휴
]);

// 지정된 고정/음력 공휴일 목록 반환 (관리자 페이지 표시용)
export function getBuiltInHolidays(): string[] {
  const year = new Date().getFullYear();
  const result: string[] = [];
  for (const md of FIXED_HOLIDAYS) {
    result.push(`${year}-${md}`);
  }
  for (const ymd of LUNAR_HOLIDAYS_2026) {
    result.push(ymd);
  }
  return result.sort();
}

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

// ===== BBQ Package Pricing =====
export interface BBQPricing {
  dayStartHour: number;
  nightStartHour: number;
  baseHours: number;
  baseCapacity: number;
  dayPrice: number;
  nightPrice: number;
  extraPersonFee: number;
  extraHourFee: number;
  openDays: number;
}

export const DEFAULT_BBQ_PRICING: BBQPricing = {
  dayStartHour: 5,
  nightStartHour: 17,
  baseHours: 5,
  baseCapacity: 4,
  dayPrice: 160000,
  nightPrice: 200000,
  extraPersonFee: 30000,
  extraHourFee: 10000,
  openDays: 30,
};

export function getBBQSlotTier(
  slotStartHour: number,
  pricing: BBQPricing,
): 'day' | 'night' {
  return slotStartHour >= pricing.nightStartHour ? 'night' : 'day';
}

export function computeBBQPrice(
  startHour: number,
  endHour: number,
  capacity: number,
  pricing: BBQPricing,
): {
  baseAmount: number;
  extraPersonAmount: number;
  extraHourAmount: number;
  total: number;
  breakdown: string[];
  baseHoursDay: number;
  baseHoursNight: number;
  extraHoursDay: number;
  extraHoursNight: number;
  dayBaseAmount: number;
  nightBaseAmount: number;
} {
  const totalHours = endHour - startHour;
  const extraHours = Math.max(0, totalHours - pricing.baseHours);
  const extraPersons = Math.max(0, capacity - pricing.baseCapacity);

  const nightStart = pricing.nightStartHour;

  // Walk through each hour in chronological order, classifying as base/extra and day/night
  let baseHoursDay = 0;
  let baseHoursNight = 0;
  let extraHoursDay = 0;
  let extraHoursNight = 0;
  let hoursUsed = 0;
  for (let h = startHour; h < endHour; h++) {
    const isNight = h >= nightStart;
    if (hoursUsed < pricing.baseHours) {
      if (isNight) baseHoursNight++;
      else baseHoursDay++;
    } else {
      if (isNight) extraHoursNight++;
      else extraHoursDay++;
    }
    hoursUsed++;
  }

  // Base price: if base hours span both tiers, split proportionally by hours.
  // If entirely in one tier, use that tier's flat price.
  const totalBaseHours = baseHoursDay + baseHoursNight;
  let dayBaseAmount = 0;
  let nightBaseAmount = 0;
  if (totalBaseHours > 0) {
    if (baseHoursDay > 0 && baseHoursNight > 0) {
      dayBaseAmount = Math.round((baseHoursDay / totalBaseHours) * pricing.dayPrice);
      nightBaseAmount = Math.round((baseHoursNight / totalBaseHours) * pricing.nightPrice);
    } else if (baseHoursDay > 0) {
      dayBaseAmount = pricing.dayPrice;
    } else {
      nightBaseAmount = pricing.nightPrice;
    }
  }
  const baseAmount = dayBaseAmount + nightBaseAmount;

  const extraHourAmountDay = extraHoursDay * pricing.extraHourFee * capacity;
  const extraHourAmountNight = extraHoursNight * pricing.extraHourFee * capacity;
  const extraHourAmount = extraHourAmountDay + extraHourAmountNight;
  const extraPersonAmount = extraPersons * pricing.extraPersonFee;
  const total = baseAmount + extraHourAmount + extraPersonAmount;

  const breakdown: string[] = [];
  if (baseHoursDay > 0 && baseHoursNight > 0) {
    breakdown.push(`기본 ${baseHoursDay}시간(데이) + ${baseHoursNight}시간(나이트) = ${formatWon(baseAmount)}`);
  } else if (baseHoursNight > 0) {
    breakdown.push(`기본 ${baseHoursNight}시간(나이트) = ${formatWon(nightBaseAmount)}`);
  } else {
    breakdown.push(`기본 ${baseHoursDay}시간(데이) = ${formatWon(dayBaseAmount)}`);
  }
  if (extraHours > 0) {
    const parts: string[] = [];
    if (extraHoursDay > 0) parts.push(`데이 ${extraHoursDay}시간`);
    if (extraHoursNight > 0) parts.push(`나이트 ${extraHoursNight}시간`);
    breakdown.push(`시간 초과 ${parts.join(' + ')} × ${formatWon(pricing.extraHourFee)} × ${capacity}명 = ${formatWon(extraHourAmount)}`);
  }
  if (extraPersons > 0) {
    breakdown.push(`추가 인원 ${extraPersons}명 × ${formatWon(pricing.extraPersonFee)} = ${formatWon(extraPersonAmount)}`);
  }

  return {
    baseAmount,
    extraPersonAmount,
    extraHourAmount,
    total,
    breakdown,
    baseHoursDay,
    baseHoursNight,
    extraHoursDay,
    extraHoursNight,
    dayBaseAmount,
    nightBaseAmount,
  };
}
