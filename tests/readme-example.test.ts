import { describe, expect, it } from 'vitest';
import sampleWeek from '../examples/sample-week.json';
import { calculateInvoiceTotals, createShiftEntry } from '../src/lib/calculations';

describe('README sample week example', () => {
  it('keeps the documented sample totals reproducible', () => {
    const shifts = sampleWeek.map((row) =>
      createShiftEntry(row.description, row.date, row.startTime, row.endTime, false)
    );

    expect(shifts.map((shift) => shift.hours)).toEqual([10, 12.5, 8]);
    expect(shifts.map((shift) => shift.otHours)).toEqual([0, 2.5, 0]);
    expect(calculateInvoiceTotals(shifts)).toEqual({
      dailyTotal: 420,
      otHoursTotal: 2.5,
      otTotal: 35,
      grandTotal: 455,
    });
  });
});
