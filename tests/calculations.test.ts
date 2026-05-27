import { describe, it, expect } from 'vitest';
import {
  parseTime,
  calculateHours,
  roundHoursToNearest,
  calculateOvertimeHours,
  calculateShiftAmount,
  calculateInvoiceTotals,
  createShiftEntry,
  formatDate,
  formatCurrency,
  generateInvoiceNumber,
} from '../src/lib/calculations';
import { RATES } from '../src/lib/types';

describe('parseTime', () => {
  it('parses colon-separated time', () => {
    expect(parseTime('09:30')).toEqual({ hours: 9, minutes: 30 });
  });

  it('parses dot-separated time', () => {
    expect(parseTime('14.45')).toEqual({ hours: 14, minutes: 45 });
  });

  it('returns null for invalid input', () => {
    expect(parseTime('invalid')).toBeNull();
    expect(parseTime('')).toBeNull();
  });

  it('handles single-digit hours', () => {
    expect(parseTime('7:00')).toEqual({ hours: 7, minutes: 0 });
  });

  it('rejects out-of-range hours and minutes', () => {
    expect(parseTime('25:00')).toBeNull();
    expect(parseTime('12:60')).toBeNull();
    expect(parseTime('99:99')).toBeNull();
  });

  it('trims surrounding whitespace', () => {
    expect(parseTime('  09:30  ')).toEqual({ hours: 9, minutes: 30 });
    expect(parseTime('\t14.45\n')).toEqual({ hours: 14, minutes: 45 });
  });

  it('rejects embedded or trailing garbage', () => {
    expect(parseTime('12:30 oops')).toBeNull();
    expect(parseTime('shift 09:30')).toBeNull();
    expect(parseTime('09:30:45')).toBeNull();
    expect(parseTime('12:30am')).toBeNull();
  });
});

describe('calculateHours', () => {
  it('calculates hours between two times', () => {
    expect(calculateHours('08:00', '16:00')).toBe(8);
  });

  it('handles partial hours', () => {
    expect(calculateHours('09:00', '17:30')).toBe(8.5);
  });

  it('returns 0 for invalid times', () => {
    expect(calculateHours('invalid', '16:00')).toBe(0);
  });

  it('handles 12-hour shifts', () => {
    expect(calculateHours('06:00', '18:00')).toBe(12);
  });

  it('handles overnight shifts crossing midnight', () => {
    expect(calculateHours('22:00', '06:00')).toBe(8);
    expect(calculateHours('20:30', '04:00')).toBe(7.5);
  });
});

describe('roundHoursToNearest', () => {
  it('rounds to nearest 0.5 by default', () => {
    expect(roundHoursToNearest(8.3)).toBe(8.5);
    expect(roundHoursToNearest(8.1)).toBe(8);
    expect(roundHoursToNearest(8.75)).toBe(9);
  });

  it('rounds to nearest 0.25 when specified', () => {
    expect(roundHoursToNearest(8.1, 0.25)).toBe(8);
    expect(roundHoursToNearest(8.2, 0.25)).toBe(8.25);
  });

  it('returns 0 for non-finite hours instead of propagating NaN', () => {
    expect(roundHoursToNearest(NaN)).toBe(0);
    expect(roundHoursToNearest(Infinity)).toBe(0);
    expect(roundHoursToNearest(-Infinity)).toBe(0);
  });

  it('falls back to the unrounded value when the step is invalid', () => {
    expect(roundHoursToNearest(8.3, 0)).toBe(8.3);
    expect(roundHoursToNearest(8.3, -0.5)).toBe(8.3);
    expect(roundHoursToNearest(8.3, NaN)).toBe(8.3);
  });
});

describe('calculateOvertimeHours', () => {
  it('returns 0 when hours are within standard', () => {
    expect(calculateOvertimeHours(8)).toBe(0);
    expect(calculateOvertimeHours(RATES.standardHours)).toBe(0);
  });

  it('returns overtime hours when exceeding standard', () => {
    expect(calculateOvertimeHours(12)).toBe(2);
    expect(calculateOvertimeHours(11.5)).toBe(1.5);
  });

  it('returns 0 for non-finite or negative inputs', () => {
    expect(calculateOvertimeHours(NaN)).toBe(0);
    expect(calculateOvertimeHours(Infinity)).toBe(0);
    expect(calculateOvertimeHours(-5)).toBe(0);
  });
});

describe('calculateShiftAmount', () => {
  it('returns daily rate when no overtime', () => {
    expect(calculateShiftAmount(8, 0)).toBe(RATES.dailyRate);
  });

  it('adds overtime pay', () => {
    const expected = RATES.dailyRate + 2 * RATES.otRate;
    expect(calculateShiftAmount(12, 2)).toBe(expected);
  });

  it('ignores non-finite or negative overtime', () => {
    expect(calculateShiftAmount(8, NaN)).toBe(RATES.dailyRate);
    expect(calculateShiftAmount(8, -3)).toBe(RATES.dailyRate);
  });
});

describe('calculateInvoiceTotals', () => {
  it('calculates totals for multiple shifts', () => {
    const shifts = [
      createShiftEntry('Shift', '2024-01-01', '08:00', '18:00', false),
      createShiftEntry('Shift', '2024-01-02', '08:00', '20:00', false),
    ];
    const totals = calculateInvoiceTotals(shifts);

    expect(totals.dailyTotal).toBe(2 * RATES.dailyRate);
    expect(totals.otHoursTotal).toBe(shifts[0].otHours + shifts[1].otHours);
    expect(totals.otTotal).toBe(totals.otHoursTotal * RATES.otRate);
    expect(totals.grandTotal).toBe(totals.dailyTotal + totals.otTotal);
  });

  it('handles empty shifts array', () => {
    const totals = calculateInvoiceTotals([]);
    expect(totals.dailyTotal).toBe(0);
    expect(totals.otHoursTotal).toBe(0);
    expect(totals.otTotal).toBe(0);
    expect(totals.grandTotal).toBe(0);
  });

  it('skips non-finite overtime values without poisoning totals', () => {
    const shifts = [
      createShiftEntry('Shift', '2024-01-01', '08:00', '18:00', false),
      { ...createShiftEntry('Shift', '2024-01-02', '08:00', '20:00', false), otHours: NaN },
    ];
    const totals = calculateInvoiceTotals(shifts);

    expect(Number.isFinite(totals.grandTotal)).toBe(true);
    expect(totals.dailyTotal).toBe(2 * RATES.dailyRate);
    expect(totals.otHoursTotal).toBe(0);
    expect(totals.grandTotal).toBe(totals.dailyTotal);
  });
});

describe('createShiftEntry', () => {
  it('creates a shift entry with calculated fields', () => {
    const shift = createShiftEntry('Test', '2024-01-15', '08:00', '18:00', false);
    expect(shift.hours).toBe(10);
    expect(shift.otHours).toBe(0);
    expect(shift.rate).toBe(RATES.dailyRate);
    expect(shift.amount).toBe(RATES.dailyRate);
    expect(shift.id).toBeDefined();
  });

  it('rounds hours when rounding is enabled', () => {
    const shift = createShiftEntry('Test', '2024-01-15', '08:00', '18:20', true);
    expect(shift.hours).toBe(10.5);
  });
});

describe('formatDate', () => {
  it('formats ISO date to DD/MM/YYYY', () => {
    expect(formatDate('2024-01-15')).toBe('15/01/2024');
  });

  it('returns an empty string for invalid or empty input', () => {
    expect(formatDate('')).toBe('');
    expect(formatDate('   ')).toBe('');
    expect(formatDate('not-a-date')).toBe('');
  });

  it('renders the same calendar day regardless of host timezone', () => {
    // new Date('2024-01-15') anchors to UTC midnight, so naive local getters
    // would shift the day backwards in any negative-offset zone. Simulate one
    // by stubbing the prototype getters to return values one day earlier.
    const proto = Date.prototype as unknown as Record<string, () => number>;
    const realDate = proto.getDate;
    const realMonth = proto.getMonth;
    const realYear = proto.getFullYear;
    proto.getDate = function () { return 14; };
    proto.getMonth = function () { return 0; };
    proto.getFullYear = function () { return 2024; };
    try {
      expect(formatDate('2024-01-15')).toBe('15/01/2024');
    } finally {
      proto.getDate = realDate;
      proto.getMonth = realMonth;
      proto.getFullYear = realYear;
    }
  });
});

describe('formatCurrency', () => {
  it('formats number as GBP currency', () => {
    expect(formatCurrency(140)).toBe('£140.00');
    expect(formatCurrency(14.5)).toBe('£14.50');
    expect(formatCurrency(0)).toBe('£0.00');
  });

  it('falls back to £0.00 for non-finite values', () => {
    expect(formatCurrency(NaN)).toBe('£0.00');
    expect(formatCurrency(Infinity)).toBe('£0.00');
    expect(formatCurrency(-Infinity)).toBe('£0.00');
  });
});

describe('generateInvoiceNumber', () => {
  it('generates invoice number with month prefix', () => {
    const invoiceNum = generateInvoiceNumber(1);
    expect(invoiceNum).toMatch(/^[A-Z]{3}\/001$/);
  });

  it('pads sequence number', () => {
    const invoiceNum = generateInvoiceNumber(42);
    expect(invoiceNum).toMatch(/^[A-Z]{3}\/042$/);
  });

  it('clamps non-positive or fractional sequences to a valid integer', () => {
    expect(generateInvoiceNumber(0)).toMatch(/^[A-Z]{3}\/001$/);
    expect(generateInvoiceNumber(-5)).toMatch(/^[A-Z]{3}\/001$/);
    expect(generateInvoiceNumber(7.9)).toMatch(/^[A-Z]{3}\/007$/);
  });

  it('falls back to 001 when the sequence is non-finite', () => {
    expect(generateInvoiceNumber(NaN)).toMatch(/^[A-Z]{3}\/001$/);
    expect(generateInvoiceNumber(Infinity)).toMatch(/^[A-Z]{3}\/001$/);
  });
});
