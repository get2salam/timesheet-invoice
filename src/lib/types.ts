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
}

export interface ClientDetails {
  name: string;
  address: string;
  city: string;
  postcode: string;
}

export const COMPANY_DETAILS: CompanyDetails = {
  name: 'AHMED WAQAS',
  address: '103 Apple Tree Ave',
  city: 'Uxbridge',
  postcode: 'UB8 3PX',
  phone: '07429175660',
  email: 'vickycbr8@gmail.com',
  utr: '7038050927',
};

export const CLIENT_DETAILS: ClientDetails = {
  name: 'Heathrow Freight Services Ltd',
  address: '202 Parlaunt Road',
  city: 'Slough',
  postcode: 'SL3 8AZ',
};

export const RATES = {
  dailyRate: 140,
  otRate: 14,
  standardHours: 10,
};
