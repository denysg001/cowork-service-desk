type BusinessCalendar = {
  timezone: string;
  startHour: number;
  endHour: number;
  holidays: string[];
};

export function addBusinessHours(start: Date, hours: number, calendar: BusinessCalendar): Date {
  let remainingMinutes = hours * 60;
  const cursor = new Date(start);
  while (remainingMinutes > 0) {
    cursor.setUTCMinutes(cursor.getUTCMinutes() + 1);
    if (isBusinessMinute(cursor, calendar)) remainingMinutes -= 1;
  }
  return cursor;
}

export function effectiveBusinessSeconds(start: Date, end: Date, accumulatedPauseSeconds: number, calendar: BusinessCalendar): number {
  let seconds = 0;
  const cursor = new Date(start);
  while (cursor < end) {
    cursor.setUTCMinutes(cursor.getUTCMinutes() + 1);
    if (isBusinessMinute(cursor, calendar)) seconds += 60;
  }
  return Math.max(0, seconds - accumulatedPauseSeconds);
}

export function slaStatus(input: { createdAt: Date; now: Date; slaHours: number; accumulatedPauseSeconds: number; calendar: BusinessCalendar }) {
  const effective = effectiveBusinessSeconds(input.createdAt, input.now, input.accumulatedPauseSeconds, input.calendar);
  const total = input.slaHours * 3600;
  if (effective > total) return "BREACHED" as const;
  if (effective > total * 0.8) return "AT_RISK" as const;
  return "OK" as const;
}

function isBusinessMinute(date: Date, calendar: BusinessCalendar) {
  const local = new Intl.DateTimeFormat("en-CA", { timeZone: calendar.timezone, year: "numeric", month: "2-digit", day: "2-digit", weekday: "short", hour: "2-digit", hour12: false }).formatToParts(date);
  const values = Object.fromEntries(local.map((part) => [part.type, part.value]));
  if (values.weekday === "Sat" || values.weekday === "Sun") return false;
  const day = `${values.year}-${values.month}-${values.day}`;
  if (calendar.holidays.includes(day)) return false;
  const hour = Number(values.hour);
  return hour >= calendar.startHour && hour < calendar.endHour;
}
