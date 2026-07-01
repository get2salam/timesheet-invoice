import { describe, it, expect } from 'vitest';
import { sanitizeSpreadsheetCell, generateInvoiceExcel } from '../src/lib/excel-generator';
import { createShiftEntry } from '../src/lib/calculations';
import { InvoiceData } from '../src/lib/types';

describe('sanitizeSpreadsheetCell', () => {
  it('escapes leading "=" so formulas are not evaluated on open', () => {
    expect(sanitizeSpreadsheetCell('=1+1')).toBe("'=1+1");
    expect(sanitizeSpreadsheetCell('=cmd|"/c calc"!A1')).toBe('\'=cmd|"/c calc"!A1');
  });

  it('escapes the other formula-opener characters Excel honours', () => {
    expect(sanitizeSpreadsheetCell('+SUM(A1)')).toBe("'+SUM(A1)");
    expect(sanitizeSpreadsheetCell('-2+3')).toBe("'-2+3");
    expect(sanitizeSpreadsheetCell('@import')).toBe("'@import");
  });

  it('escapes leading whitespace control chars that bypass the obvious prefixes', () => {
    expect(sanitizeSpreadsheetCell('\t=1+1')).toBe("'\t=1+1");
    expect(sanitizeSpreadsheetCell('\r=1+1')).toBe("'\r=1+1");
  });

  it('passes benign values through unchanged', () => {
    expect(sanitizeSpreadsheetCell('Protec 3')).toBe('Protec 3');
    expect(sanitizeSpreadsheetCell('JAN/001')).toBe('JAN/001');
    expect(sanitizeSpreadsheetCell('')).toBe('');
  });

  it('does not escape a formula opener that appears mid-string', () => {
    expect(sanitizeSpreadsheetCell('Shift =A1')).toBe('Shift =A1');
  });
});

describe('generateInvoiceExcel', () => {
  const buildInvoice = (overrides: Partial<InvoiceData> = {}): InvoiceData => ({
    invoiceNumber: 'JAN/001',
    invoiceDate: '2024-01-15',
    dueDate: 'Upon Receipt',
    shifts: [createShiftEntry('Protec 3', '2024-01-15', '08:00', '18:00', false)],
    dailyTotal: 140,
    otHoursTotal: 0,
    otTotal: 0,
    tax: 0,
    grandTotal: 140,
    ...overrides,
  });

  it('quotes a malicious description so the workbook cannot run a formula', () => {
    const data = buildInvoice({
      shifts: [createShiftEntry('=cmd|"/c calc"!A1', '2024-01-15', '08:00', '18:00', false)],
    });
    const wb = generateInvoiceExcel(data);
    const cells = Object.values(wb.Sheets.Invoice).filter(
      (cell): cell is { v: string } => typeof cell === 'object' && cell !== null && 'v' in cell && typeof cell.v === 'string',
    );
    const hasRawFormula = cells.some(cell => cell.v.startsWith('='));
    const hasQuotedFormula = cells.some(cell => cell.v === '\'=cmd|"/c calc"!A1');
    expect(hasRawFormula).toBe(false);
    expect(hasQuotedFormula).toBe(true);
  });

  it('quotes a malicious invoice number so a recruiter-supplied value is inert', () => {
    const data = buildInvoice({ invoiceNumber: '=HYPERLINK("http://evil","click")' });
    const wb = generateInvoiceExcel(data);
    const cells = Object.values(wb.Sheets.Invoice).filter(
      (cell): cell is { v: string } => typeof cell === 'object' && cell !== null && 'v' in cell && typeof cell.v === 'string',
    );
    expect(cells.some(cell => cell.v.startsWith('='))).toBe(false);
    expect(cells.some(cell => cell.v === '\'=HYPERLINK("http://evil","click")')).toBe(true);
  });

  it('sanitizes a formula-injection attempt in dueDate to prevent spreadsheet formula injection', () => {
    const data = buildInvoice({ dueDate: '=HYPERLINK("http://evil","click")' });
    const wb = generateInvoiceExcel(data);
    const cells = Object.values(wb.Sheets.Invoice).filter(
      (cell): cell is { v: string } => typeof cell === 'object' && cell !== null && 'v' in cell && typeof cell.v === 'string',
    );
    expect(cells.some(cell => cell.v.startsWith('='))).toBe(false);
    expect(cells.some(cell => cell.v === '\'=HYPERLINK("http://evil","click")')).toBe(true);
  });
});
