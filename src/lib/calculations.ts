import { ShiftEntry, RATES } from './types';

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function parseTime(timeStr: string): { hours: number; minutes: number } | null {
  const match = timeStr.match(/(\d{1,2})[:\.](\d{2})/);
  if (match) {
    return { hours: parseInt(match[1]), minutes: parseInt(match[2]) };
  }
  return null;
}

export function calculateHours(startTime: string, endTime: string): number {
  const start = parseTime(startTime);
  const end = parseTime(endTime);
  if (!start || !end) return 0;
  const startMinutes = start.hours * 60 + start.minutes;
  const endMinutes = end.hours * 60 + end.minutes;
  const diffMinutes = endMinutes - startMinutes;
  return Math.round((diffMinutes / 60) * 100) / 100;
}

export function roundHoursToNearest(hours: number, nearest: number = 0.5): number {
  return Math.round(hours / nearest) * nearest;
}

export function calculateOvertimeHours(totalHours: number): number {
  if (totalHours <= RATES.standardHours) return 0;
  return totalHours - RATES.standardHours;
}

export function calculateShiftAmount(hours: number, otHours: number): number {
  const baseAmount = RATES.dailyRate;
  const otAmount = otHours * RATES.otRate;
  return baseAmount + otAmount;
}

export function calculateInvoiceTotals(shifts: ShiftEntry[]): {
  dailyTotal: number;
  otHoursTotal: number;
  otTotal: number;
  grandTotal: number;
} {
  const dailyTotal = shifts.length * RATES.dailyRate;
  const otHoursTotal = shifts.reduce((sum, shift) => sum + shift.otHours, 0);
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
  const date = new Date(dateStr);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatCurrency(amount: number): string {
  return `£${amount.toFixed(2)}`;
}

export function getCurrentMonthPrefix(): string {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return months[new Date().getMonth()];
}

export function generateInvoiceNumber(sequenceNumber: number = 1): string {
  return `${getCurrentMonthPrefix()}/${sequenceNumber.toString().padStart(3, '0')}`;
}
