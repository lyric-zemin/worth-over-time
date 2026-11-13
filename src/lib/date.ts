const DAY_MS = 86_400_000;

function pad(value: number) {
  return String(value).padStart(2, "0");
}

/** 本地日历日 -> YYYY-MM-DD */
export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayKey(now: Date = new Date()): string {
  return toDateKey(now);
}

/** YYYY-MM-DD -> UTC 归一化时间戳，规避时区与夏令时误差 */
export function parseDateKey(key: string): number | null {
  if (typeof key !== "string") return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const timestamp = Date.UTC(year, month - 1, day);
  const check = new Date(timestamp);
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return null;
  }
  return timestamp;
}

export function isValidDateKey(key: string): boolean {
  return parseDateKey(key) !== null;
}

/** 购买当天记为第 1 天，分母恒 >= 1 */
export function daysOwnedFrom(purchasedAt: string, key: string = todayKey()): number {
  const start = parseDateKey(purchasedAt);
  const end = parseDateKey(key);
  if (start === null || end === null) return 1;
  return Math.max(1, Math.round((end - start) / DAY_MS) + 1);
}

export function calendarDaysBetween(fromKey: string, toKey: string): number {
  const from = parseDateKey(fromKey);
  const to = parseDateKey(toKey);
  if (from === null || to === null) return 0;
  return Math.round((to - from) / DAY_MS);
}

/** 转成「本地日历日的本地零点」，供日历组件与 toDateKey 往返使用 */
export function dateKeyToDate(key: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return new Date();
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function formatDateCN(key: string): string {
  const timestamp = parseDateKey(key);
  if (timestamp === null) return key;
  const date = new Date(timestamp);
  return `${date.getUTCFullYear()} 年 ${date.getUTCMonth() + 1} 月 ${date.getUTCDate()} 日`;
}

export function formatDateShort(key: string): string {
  const timestamp = parseDateKey(key);
  if (timestamp === null) return key;
  const date = new Date(timestamp);
  return `${date.getUTCMonth() + 1} 月 ${date.getUTCDate()} 日`;
}

export function isFutureDateKey(key: string, keyNow: string = todayKey()): boolean {
  const value = parseDateKey(key);
  const now = parseDateKey(keyNow);
  return value !== null && now !== null && value > now;
}

export function greetingForHour(hour: number): string {
  if (hour < 5) return "夜深了";
  if (hour < 11) return "早上好";
  if (hour < 14) return "中午好";
  if (hour < 18) return "下午好";
  return "晚上好";
}
