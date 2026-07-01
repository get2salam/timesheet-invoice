import { describe, it, expect } from 'vitest';
import { createShiftEntry, calculateInvoiceTotals } from '../src/lib/calculations';
import { RATES } from '../src/lib/types';

describe('OT rounding boundary via createShiftEntry', () => {
  // 08:00–18:20 = 620 min = 10.33h raw. Math.round(10.33/0.5)*0.5 = 21*0.5 = 10.5 → crosses OT threshold.
  it('rounds 10h20m up to 10.5h and triggers 0.5h OT when rounding is on', () => {
    const shift = createShiftEntry('Protec 3', '2024-03-04', '08:00', '18:20', true);
    expect(shift.hours).toBe(10.5);
    expect(shift.otHours).toBe(0.5);
    expect(shift.amount).toBe(RATES.dailyRate + 0.5 * RATES.otRate);
  });

  // 08:00–18:10 = 610 min = 10.17h raw. Math.round(10.17/0.5)*0.5 = 20*0.5 = 10.0 → stays below OT threshold.
  it('rounds 10h10m down to 10h with no OT when rounding is on', () => {
    const shift = createShiftEntry('Protec 3', '2024-03-04', '08:00', '18:10', true);
    expect(shift.hours).toBe(10);
    expect(shift.otHours).toBe(0);
    expect(shift.amount).toBe(RATES.dailyRate);
  });

  // Without rounding the same 10h20m input keeps the raw fractional OT.
  it('keeps raw fractional OT when rounding is off for the same 10h20m shift', () => {
    const shift = createShiftEntry('Protec 3', '2024-03-04', '08:00', '18:20', false);
    expect(shift.hours).toBeCloseTo(10.33, 2);
    expect(shift.otHours).toBeCloseTo(0.33, 2);
  });
});

describe('calculateInvoiceTotals – grand total / amount consistency', () => {
  // grandTotal is computed independently of shift.amount (it sums from shift.otHours).
  // This invariant guards against future divergence between the two computation paths.
  it('grandTotal equals sum of individual shift amounts across a mixed-OT working week', () => {
    const shifts = [
      createShiftEntry('Protec 3', '2024-03-04', '08:00', '18:00', false), // 10h, 0 OT → £140
      createShiftEntry('Protec 3', '2024-03-05', '08:00', '20:00', false), // 12h, 2h OT → £168
      createShiftEntry('Protec 3', '2024-03-06', '22:00', '08:00', false), // 10h overnight, 0 OT → £140
      createShiftEntry('Protec 3', '2024-03-07', '08:00', '22:00', false), // 14h, 4h OT → £196
      createShiftEntry('Protec 3', '2024-03-08', '08:00', '16:00', false), //  8h, 0 OT → £140
    ];
    const totals = calculateInvoiceTotals(shifts);
    const sumOfAmounts = shifts.reduce((sum, s) => sum + s.amount, 0);
    expect(totals.grandTotal).toBe(sumOfAmounts);
    // 5×£140 daily + 6h OT × £14/h = £700 + £84 = £784
    expect(totals.grandTotal).toBe(784);
    expect(totals.otHoursTotal).toBe(6);
  });
});

describe('overnight shifts in createShiftEntry', () => {
  it('a 12h overnight shift (20:00–08:00) produces 2h OT and the correct amount', () => {
    const shift = createShiftEntry('Protec 3', '2024-03-04', '20:00', '08:00', false);
    expect(shift.hours).toBe(12);
    expect(shift.otHours).toBe(2);
    expect(shift.amount).toBe(RATES.dailyRate + 2 * RATES.otRate);
  });

  it('a standard 10h overnight shift (22:00–08:00) produces no OT', () => {
    const shift = createShiftEntry('Protec 3', '2024-03-04', '22:00', '08:00', false);
    expect(shift.hours).toBe(10);
    expect(shift.otHours).toBe(0);
    expect(shift.amount).toBe(RATES.dailyRate);
  });
});
