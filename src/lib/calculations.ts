import { ShiftEntry, RATES } from './types';

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function parseTime(timeStr: string): { hours: number; minutes: number } | null {
  if (typeof timeStr !== 'string') return null;
  // Anchor the pattern so embedded times in garbage input ("12:30 oops",
  // "9:30:45") are rejected rather than silently parsed.
  const match = timeStr.trim().match(/^(\d{1,2})[:\.](\d{2})$/);
  if (!match) return null;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (hours > 23 || minutes > 59) return null;
  return { hours, minutes };
}

export function calculateHours(startTime: string, endTime: string): number {
  const start = parseTime(startTime);
  const end = parseTime(endTime);
  if (!start || !end) return 0;
  const startMinutes = start.hours * 60 + start.minutes;
  let endMinutes = end.hours * 60 + end.minutes;
  // Treat an end time earlier than the start as the following day,
  // so overnight shifts (e.g. 22:00–06:00) report a positive duration.
  if (endMinutes < startMinutes) endMinutes += 24 * 60;
  const diffMinutes = endMinutes - startMinutes;
  return Math.round((diffMinutes / 60) * 100) / 100;
}

export function roundHoursToNearest(hours: number, nearest: number = 0.5): number {
  if (!Number.isFinite(hours)) return 0;
  // A non-positive step would produce NaN (divide-by-zero) or invert the
  // sign; fall back to the unrounded value so callers still get a sane number.
  if (!Number.isFinite(nearest) || nearest <= 0) return hours;
  return Math.round(hours / nearest) * nearest;
}

export function calculateOvertimeHours(totalHours: number): number {
  if (!Number.isFinite(totalHours) || totalHours <= RATES.standardHours) return 0;
  return totalHours - RATES.standardHours;
}

export function calculateShiftAmount(hours: number, otHours: number): number {
  const safeOtHours = Number.isFinite(otHours) && otHours > 0 ? otHours : 0;
  return RATES.dailyRate + safeOtHours * RATES.otRate;
}

export function calculateInvoiceTotals(shifts: ShiftEntry[]): {
  dailyTotal: number;
  otHoursTotal: number;
  otTotal: number;
  grandTotal: number;
} {
  const dailyTotal = shifts.length * RATES.dailyRate;
  const otHoursTotal = shifts.reduce((sum, shift) => {
    const ot = shift.otHours;
    return sum + (Number.isFinite(ot) && ot > 0 ? ot : 0);
  }, 0);
  const otTotal = otHoursTotal * RATES.otRate;
  const grandTotal = dailyTotal + otTotal;
  return { dailyTotal, otHoursTotal, otTotal, grandTotal };
}

export function createShiftEntry(
  description: string,
  date: string,
  startTime: string,
  endTime: string,
  roundHrs: boolean = true
): ShiftEntry {
  let hours = calculateHours(startTime, endTime);
  if (roundHrs) hours = roundHoursToNearest(hours, 0.5);
  const otHours = calculateOvertimeHours(hours);
  const amount = calculateShiftAmount(hours, otHours);
  return { id: generateId(), description, date, startTime, endTime, hours, otHours, rate: RATES.dailyRate, amount };
}

export function formatDate(dateStr: string): string {
  if (typeof dateStr !== 'string' || dateStr.trim() === '') return '';
  const date = new Date(dateStr);
  // new Date('garbage') yields an Invalid Date whose getters return NaN; bail
  // out so callers don't end up rendering "NaN/NaN/NaN" in invoices.
  if (Number.isNaN(date.getTime())) return '';
  // Use UTC getters: new Date('2024-01-15') anchors to UTC midnight, so local
  // getters shift the calendar day backwards in any negative-offset timezone
  // (e.g. America/Los_Angeles would render '14/01/2024' for that input).
  const day = date.getUTCDate().toString().padStart(2, '0');
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

export function formatCurrency(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return `£${safe.toFixed(2)}`;
}

export function getCurrentMonthPrefix(): string {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return months[new Date().getMonth()];
}

export function generateInvoiceNumber(sequenceNumber: number = 1): string {
  // Guard against NaN/negative/fractional inputs that would otherwise emit
  // malformed numbers like "MAY/NaN" or "MAY/0-1".
  const seq = Number.isFinite(sequenceNumber) ? Math.max(1, Math.floor(sequenceNumber)) : 1;
  return `${getCurrentMonthPrefix()}/${seq.toString().padStart(3, '0')}`;
}
