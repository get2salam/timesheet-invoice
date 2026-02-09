export interface ShiftEntry {
  id: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  otHours: number;
  rate: number;
  amount: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  shifts: ShiftEntry[];
  dailyTotal: number;
  otTotal: number;
  otHoursTotal: number;
  tax: number;
  grandTotal: number;
}

export interface CompanyDetails {
  name: string;
  address: string;
  city: string;
  postcode: string;
  phone: string;
  email: string;
  utr: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  sortCode: string;
}

export interface ClientDetails {
  name: string;
  address: string;
  city: string;
  postcode: string;
}

export const COMPANY_DETAILS: CompanyDetails = {
  name: 'Your Company Name',
  address: '123 Business Street',
  city: 'London',
  postcode: 'EC1A 1BB',
  phone: '07000000000',
  email: 'contact@example.com',
  utr: '0000000000',
  bankName: 'Your Bank',
  accountName: 'Your Name',
  accountNumber: '00000000',
  sortCode: '00-00-00',
};

export const CLIENT_DETAILS: ClientDetails = {
  name: 'Client Company Ltd',
  address: '456 Client Road',
  city: 'Manchester',
  postcode: 'M1 1AA',
};

export const RATES = {
  dailyRate: 140,
  otRate: 14,
  standardHours: 10,
};
