import { ShiftEntry } from './types';
import { createShiftEntry, parseTime } from './calculations';

interface ParsedTimesheet {
  candidateName: string;
  shifts: ShiftEntry[];
  rawText: string;
}

// Build an ISO date string and reject impossible calendar dates (e.g. OCR
// misreads producing "32/13/2024"). Returns null when the components don't
// round-trip through Date, so callers can skip the entry instead of letting an
// Invalid Date propagate into shift sorting.
function buildIsoDate(day: string, month: string, year: string): string | null {
  const yearNum = parseInt(year, 10);
  // Reject years outside a plausible timesheet range. A dropped leading digit
  // ("2024" → "0024") still round-trips cleanly through Date but stamps shifts
  // in year 24 CE; without this guard they slip past the calendar check and
  // poison the sort order.
  if (!Number.isFinite(yearNum) || yearNum < 2000 || yearNum > 2100) return null;
  const iso = `${year}-${month}-${day}`;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;
  if (
    parsed.getUTCFullYear() !== yearNum ||
    parsed.getUTCMonth() + 1 !== parseInt(month, 10) ||
    parsed.getUTCDate() !== parseInt(day, 10)
  ) {
    return null;
  }
  return iso;
}

export function parseTimesheetText(text: string): ParsedTimesheet {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const shifts: ShiftEntry[] = [];
  // A worker cannot be on two shifts that share the same date, start, and end,
  // so any repeat is either an OCR doubling of a row or a header echoed inside
  // the data; without this guard we'd bill RATES.dailyRate for each copy.
  const seenShiftKeys = new Set<string>();
  const pushIfNew = (shift: ShiftEntry) => {
    const key = `${shift.date}_${shift.startTime}_${shift.endTime}`;
    if (seenShiftKeys.has(key)) return;
    seenShiftKeys.add(key);
    shifts.push(shift);
  };
  let candidateName = '';

  const nameMatch = text.match(/CANDIDATE\s*NAME[:\s]*([A-Za-z\s]+?)(?:\s{2,}|WORK|EMAIL|$)/i);
  if (nameMatch) candidateName = nameMatch[1].trim();

  const dateTimePattern = /(\d{1,2})[\\\/](\d{1,2})(?:[\\\/](\d{2,4}))?\s*(\d{1,2})[:\.]?(\d{2})\s*(\d{1,2})[:\.]?(\d{2})/gi;
  const currentYear = new Date().getFullYear();
  const fullText = text.replace(/\n/g, ' ');
  let match;

  while ((match = dateTimePattern.exec(fullText)) !== null) {
    const day = match[1].padStart(2, '0');
    const month = match[2].padStart(2, '0');
    const year = match[3] ? (match[3].length === 2 ? `20${match[3]}` : match[3]) : currentYear.toString();
    const startTime = `${match[4].padStart(2, '0')}:${match[5]}`;
    const endTime = `${match[6].padStart(2, '0')}:${match[7]}`;
    const dateStr = buildIsoDate(day, month, year);
    if (!dateStr) continue;
    // Skip entries with out-of-range times (e.g. OCR misreads "25:00" or
    // "12:60"). createShiftEntry would otherwise produce a 0-hour shift still
    // billed at RATES.dailyRate, silently invoicing for a phantom shift.
    if (!parseTime(startTime) || !parseTime(endTime)) continue;
    // Identical start and end yield a 0-hour shift that createShiftEntry would
    // still bill at RATES.dailyRate — another phantom invoice line.
    if (startTime === endTime) continue;
    const shift = createShiftEntry('Protec 3', dateStr, startTime, endTime, true);
    // A sub-15-minute span (e.g. OCR misreading "08:00 18:00" as "08:00 08:10")
    // rounds to 0 hours but is still billed at RATES.dailyRate. Drop it.
    if (shift.hours <= 0) continue;
    pushIfNew(shift);
  }

  if (shifts.length === 0) {
    // Per-line fallback: keep the regex non-global so String.match returns the
    // capture groups (a /g regex would only yield the matched substring).
    const dayPattern = /(?:mon|tue|wed|thu|fri|sat|sun)[a-z]*\s*(\d{1,2})[\\\/](\d{1,2})(?:[\\\/](\d{2,4}))?\s*(\d{1,2})[:\.]?(\d{2})\s*(\d{1,2})[:\.]?(\d{2})/i;
    for (const line of lines) {
      const m = line.match(dayPattern);
      if (!m) continue;
      const day = m[1].padStart(2, '0');
      const month = m[2].padStart(2, '0');
      const year = m[3] ? (m[3].length === 2 ? `20${m[3]}` : m[3]) : currentYear.toString();
      const startTime = `${m[4].padStart(2, '0')}:${m[5]}`;
      const endTime = `${m[6].padStart(2, '0')}:${m[7]}`;
      const dateStr = buildIsoDate(day, month, year);
      if (!dateStr) continue;
      if (!parseTime(startTime) || !parseTime(endTime)) continue;
      if (startTime === endTime) continue;
      const shift = createShiftEntry('Protec 3', dateStr, startTime, endTime, true);
      if (shift.hours <= 0) continue;
      pushIfNew(shift);
    }
  }

  shifts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return { candidateName, shifts, rawText: text };
}

export function cleanOCRText(text: string): string {
  return text
    .replace(/[|]/g, '')
    .replace(/\s+/g, ' ')
    // Letter-to-digit corrections fire only when the letter sits adjacent to
    // a real digit, so words like "of", "Ian", "Bob", or "Sun" are left alone
    // while misreads such as "o8:00", "12:0o", "1B:30", "180B", or "1S:30"
    // are rescued.
    .replace(/[oO](?=\d)|(?<=\d)[oO]/g, '0')
    .replace(/[lI](?=\d)|(?<=\d)[lI]/g, '1')
    .replace(/B(?=\d)|(?<=\d)B/g, '8')
    .replace(/[sS](?=\d)|(?<=\d)[sS]/g, '5')
    .trim();
}
