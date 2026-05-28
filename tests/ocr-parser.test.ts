import { describe, it, expect } from 'vitest';
import { parseTimesheetText, cleanOCRText } from '../src/lib/ocr-parser';

describe('parseTimesheetText', () => {
  it('parses date and time entries from OCR text', () => {
    const text = `
      CANDIDATE NAME: John Smith
      01/01/2024 08:00 18:00
      02/01/2024 07:30 17:30
    `;

    const result = parseTimesheetText(text);

    expect(result.shifts.length).toBe(2);
    expect(result.shifts[0].startTime).toBe('08:00');
    expect(result.shifts[0].endTime).toBe('18:00');
    expect(result.shifts[1].startTime).toBe('07:30');
    expect(result.shifts[1].endTime).toBe('17:30');
  });

  it('extracts candidate name', () => {
    const text = 'CANDIDATE NAME: Jane Doe  WORK LOCATION: Site A';
    const result = parseTimesheetText(text);
    expect(result.candidateName).toBe('Jane Doe');
  });

  it('returns empty shifts for unparseable text', () => {
    const result = parseTimesheetText('no valid data here');
    expect(result.shifts).toHaveLength(0);
  });

  it('sorts shifts by date', () => {
    const text = `
      15/03/2024 08:00 16:00
      10/03/2024 09:00 17:00
      12/03/2024 07:00 15:00
    `;

    const result = parseTimesheetText(text);

    expect(result.shifts.length).toBe(3);
    expect(result.shifts[0].date).toBe('2024-03-10');
    expect(result.shifts[1].date).toBe('2024-03-12');
    expect(result.shifts[2].date).toBe('2024-03-15');
  });

  it('handles dates with 2-digit years', () => {
    const text = '05/06/24 08:00 17:00';
    const result = parseTimesheetText(text);

    expect(result.shifts.length).toBe(1);
    expect(result.shifts[0].date).toBe('2024-06-05');
  });

  it('preserves raw text', () => {
    const text = 'Some raw OCR output';
    const result = parseTimesheetText(text);
    expect(result.rawText).toBe(text);
  });

  it('handles dot-separated times', () => {
    const text = '01/01/2024 08.00 17.30';
    const result = parseTimesheetText(text);

    expect(result.shifts.length).toBe(1);
    expect(result.shifts[0].startTime).toBe('08:00');
    expect(result.shifts[0].endTime).toBe('17:30');
  });

  it('parses entries prefixed with weekday names and times without separators', () => {
    const text = `
      Mon 01/02/2024 0800 1730
      Tue 02/02/24 09:00 18:00
    `;

    const result = parseTimesheetText(text);

    expect(result.shifts.length).toBe(2);
    expect(result.shifts[0].date).toBe('2024-02-01');
    expect(result.shifts[0].startTime).toBe('08:00');
    expect(result.shifts[0].endTime).toBe('17:30');
    expect(result.shifts[1].date).toBe('2024-02-02');
    expect(result.shifts[1].startTime).toBe('09:00');
    expect(result.shifts[1].endTime).toBe('18:00');
  });

  it('skips entries whose date components are impossible calendar dates', () => {
    // OCR misreads can yield out-of-range day/month values; we drop them
    // instead of letting an Invalid Date poison the sort comparator.
    const text = `
      32/13/2024 08:00 17:00
      15/03/2024 09:00 18:00
    `;

    const result = parseTimesheetText(text);

    expect(result.shifts.length).toBe(1);
    expect(result.shifts[0].date).toBe('2024-03-15');
  });

  it('skips entries whose times are out of range', () => {
    // Without this guard, an out-of-range time would still produce a shift
    // with 0 hours but billed at the daily rate — a phantom invoice line.
    const text = `
      01/03/2024 25:00 17:00
      02/03/2024 08:00 12:60
      03/03/2024 09:00 18:00
    `;

    const result = parseTimesheetText(text);

    expect(result.shifts.length).toBe(1);
    expect(result.shifts[0].date).toBe('2024-03-03');
  });

  it('skips entries whose year is outside a plausible timesheet range', () => {
    // OCR can drop a leading digit on a four-digit year ("2024" → "0024"),
    // and that round-trips cleanly through Date as year 24 CE. Without a
    // range guard the resulting shift sorts to the front and prints with a
    // nonsense date.
    const text = `
      01/03/0024 08:00 17:00
      15/03/2024 09:00 18:00
    `;

    const result = parseTimesheetText(text);

    expect(result.shifts.length).toBe(1);
    expect(result.shifts[0].date).toBe('2024-03-15');
  });

  it('skips weekday-prefixed entries whose times are out of range', () => {
    const text = `
      Mon 01/03/2024 2500 1700
      Tue 02/03/2024 0900 1800
    `;

    const result = parseTimesheetText(text);

    expect(result.shifts.length).toBe(1);
    expect(result.shifts[0].date).toBe('2024-03-02');
  });

  it('skips entries whose start and end times are identical', () => {
    // OCR can duplicate the same HH:MM where two different times were intended;
    // without this guard the 0-hour shift is still billed at the daily rate.
    const text = `
      01/03/2024 09:00 09:00
      02/03/2024 09:00 18:00
    `;

    const result = parseTimesheetText(text);

    expect(result.shifts.length).toBe(1);
    expect(result.shifts[0].date).toBe('2024-03-02');
  });

  it('skips weekday-prefixed entries whose start and end times are identical', () => {
    const text = `
      Mon 01/03/2024 0900 0900
      Tue 02/03/2024 0900 1800
    `;

    const result = parseTimesheetText(text);

    expect(result.shifts.length).toBe(1);
    expect(result.shifts[0].date).toBe('2024-03-02');
  });

  it('skips entries whose rounded duration is zero', () => {
    // Sub-15-minute spans round to 0 hours but createShiftEntry would still
    // bill RATES.dailyRate — another phantom invoice line we need to drop.
    const text = `
      01/03/2024 09:00 09:10
      02/03/2024 09:00 18:00
    `;

    const result = parseTimesheetText(text);

    expect(result.shifts.length).toBe(1);
    expect(result.shifts[0].date).toBe('2024-03-02');
  });

  it('skips weekday-prefixed entries whose rounded duration is zero', () => {
    const text = `
      Mon 01/03/2024 0900 0910
      Tue 02/03/2024 0900 1800
    `;

    const result = parseTimesheetText(text);

    expect(result.shifts.length).toBe(1);
    expect(result.shifts[0].date).toBe('2024-03-02');
  });

  it('drops duplicate shifts sharing the same date and times', () => {
    // A worker cannot be on two shifts at the same time, so any repeat must be
    // an OCR doubling. Without dedup we'd bill RATES.dailyRate for each copy.
    const text = `
      01/03/2024 09:00 18:00
      01/03/2024 09:00 18:00
      02/03/2024 09:00 18:00
    `;

    const result = parseTimesheetText(text);

    expect(result.shifts.length).toBe(2);
    expect(result.shifts.map(s => s.date)).toEqual(['2024-03-01', '2024-03-02']);
  });

  it('drops duplicate weekday-prefixed shifts in the fallback path', () => {
    const text = `
      Mon 01/03/2024 0900 1800
      Mon 01/03/2024 0900 1800
      Tue 02/03/2024 0900 1800
    `;

    const result = parseTimesheetText(text);

    expect(result.shifts.length).toBe(2);
    expect(result.shifts.map(s => s.date)).toEqual(['2024-03-01', '2024-03-02']);
  });
});

describe('cleanOCRText', () => {
  it('removes pipe characters', () => {
    expect(cleanOCRText('hello | world')).toBe('hello world');
  });

  it('collapses multiple spaces', () => {
    expect(cleanOCRText('hello    world')).toBe('hello world');
  });

  it('corrects common OCR misreads', () => {
    expect(cleanOCRText('o8:00')).toBe('08:00');
    expect(cleanOCRText('l5:30')).toBe('15:30');
    expect(cleanOCRText('I2:00')).toBe('12:00');
  });

  it('corrects misreads where the letter sits after a digit', () => {
    expect(cleanOCRText('8o:00')).toBe('80:00');
    expect(cleanOCRText('1l:30')).toBe('11:30');
    expect(cleanOCRText('2I:00')).toBe('21:00');
  });

  it('rewrites a stray B between or beside digits as 8', () => {
    expect(cleanOCRText('1B:30')).toBe('18:30');
    expect(cleanOCRText('0B:00')).toBe('08:00');
    expect(cleanOCRText('180B')).toBe('1808');
  });

  it('leaves letters untouched when they are not adjacent to digits', () => {
    expect(cleanOCRText('Bob says hello')).toBe('Bob says hello');
    expect(cleanOCRText('Ian and Olive')).toBe('Ian and Olive');
  });

  it('trims whitespace', () => {
    expect(cleanOCRText('  hello  ')).toBe('hello');
  });
});
