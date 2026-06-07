import * as XLSX from 'xlsx';
import { InvoiceData, COMPANY_DETAILS, CLIENT_DETAILS, RATES } from './types';
import { formatDate } from './calculations';

// Prefix a single quote when an untrusted string starts with a character that
// Excel, LibreOffice, and Numbers treat as a formula opener. Without this a
// description like '=cmd|"/c calc"!A1' or a leading '+' / '-' / '@' / TAB / CR
// would be evaluated when the recipient opens the workbook (CSV/spreadsheet
// formula injection, OWASP). The quote tells the spreadsheet to render the
// content as plain text.
export function sanitizeSpreadsheetCell(value: string): string {
  if (typeof value !== 'string' || value.length === 0) return value;
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

export function generateInvoiceExcel(data: InvoiceData): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  const wsData: (string | number | null)[][] = [];

  wsData.push(['', COMPANY_DETAILS.name, '', '', '', '', '', 'INVOICE', '']);
  wsData.push(['', 'Logistics & Freight Services', '', '', '', '', '', '', '']);
  wsData.push(['', '', '', '', '', '', '', '', '']);
  wsData.push(['', 'FROM', '', '', '', '', 'Invoice No.', '', sanitizeSpreadsheetCell(data.invoiceNumber)]);
  wsData.push(['', `${COMPANY_DETAILS.address}, ${COMPANY_DETAILS.city}, ${COMPANY_DETAILS.postcode}`, '', '', '', '', 'Date', '', formatDate(data.invoiceDate)]);
  wsData.push(['', `${COMPANY_DETAILS.phone} | ${COMPANY_DETAILS.email}`, '', '', '', '', 'Due Date', '', data.dueDate]);
  wsData.push(['', `UTR# ${COMPANY_DETAILS.utr}`, '', '', '', '', '', '', '']);
  wsData.push(['', '', '', '', '', '', '', '', '']);
  wsData.push(['', 'BILL TO', '', '', '', '', '', '', '']);
  wsData.push(['', CLIENT_DETAILS.name, '', '', '', '', '', '', '']);
  wsData.push(['', `${CLIENT_DETAILS.address}, ${CLIENT_DETAILS.city}, ${CLIENT_DETAILS.postcode}`, '', '', '', '', '', '', '']);
  wsData.push(['', '', '', '', '', '', '', '', '']);
  wsData.push(['', 'DESCRIPTION', 'DATE', 'START', 'END', 'HRS', 'OT HRS', 'RATE', 'AMOUNT']);

  for (const shift of data.shifts) {
    wsData.push(['', sanitizeSpreadsheetCell(shift.description), formatDate(shift.date), shift.startTime, shift.endTime, shift.hours, shift.otHours, shift.rate, shift.amount]);
  }

  wsData.push(['', '', '', '', '', '', '', '', '']);
  wsData.push(['', `* Overtime: Hours beyond ${RATES.standardHours}hrs @ £${RATES.otRate}/hr`, '', '', '', '', '', '', '']);
  wsData.push(['', '', '', '', '', '', '', '', '']);
  wsData.push(['', '', '', '', '', '', `Daily Total (${data.shifts.length} days)`, '', data.dailyTotal]);
  wsData.push(['', '', '', '', '', '', `OT Total (${data.otHoursTotal} hrs)`, '', data.otTotal]);
  wsData.push(['', '', '', '', '', '', 'Tax (0%)', '', data.tax]);
  wsData.push(['', '', '', '', '', 'TOTAL DUE', '', '', data.grandTotal]);
  wsData.push(['', '', '', '', '', '', '', '', '']);
  wsData.push(['', 'PAYMENT DETAILS', '', '', '', '', '', '', '']);
  wsData.push(['', 'Please make payment upon receipt of this invoice.', '', '', '', '', '', '', '']);
  wsData.push(['', 'Thank you for your business!', '', '', '', '', '', '', '']);

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = [{ wch: 3 }, { wch: 18 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 8 }, { wch: 10 }, { wch: 12 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Invoice');
  return wb;
}

export function downloadExcel(data: InvoiceData, filename: string): void {
  const wb = generateInvoiceExcel(data);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
