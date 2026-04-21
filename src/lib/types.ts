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
  name: 'Northline Contracting Ltd',
  address: '14 Kingsway Business Park',
  city: 'Manchester',
  postcode: 'M1 4BT',
  phone: '0161 555 0199',
  email: 'accounts@northline.example',
  utr: '0000000000',
  bankName: 'Monzo Business',
  accountName: 'Northline Contracting Ltd',
  accountNumber: '12345678',
  sortCode: '04-00-04',
};

export const CLIENT_DETAILS: ClientDetails = {
  name: 'Riverstone Warehousing Group',
  address: '88 Dockside Way',
  city: 'Birmingham',
  postcode: 'B5 6PP',
};

export const RATES = {
  dailyRate: 140,
  otRate: 14,
  standardHours: 10,
};
