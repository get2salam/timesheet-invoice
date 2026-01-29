'use client';

import React from 'react';
import { FileText, Calendar, Hash } from 'lucide-react';

interface InvoiceSettingsProps {
  invoiceNumber: string;
  invoiceDate: string;
  onInvoiceNumberChange: (value: string) => void;
  onInvoiceDateChange: (value: string) => void;
}

export default function InvoiceSettings({
  invoiceNumber,
  invoiceDate,
  onInvoiceNumberChange,
  onInvoiceDateChange,
}: InvoiceSettingsProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-medium-blue" />
        Invoice Settings
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <span className="flex items-center gap-1">
              <Hash className="w-4 h-4" />
              Invoice Number
            </span>
          </label>
          <input
            type="text"
            value={invoiceNumber}
            onChange={(e) => onInvoiceNumberChange(e.target.value)}
            placeholder="JAN/001"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medium-blue"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Invoice Date
            </span>
          </label>
          <input
            type="date"
            value={invoiceDate}
            onChange={(e) => onInvoiceDateChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medium-blue"
          />
        </div>
      </div>
    </div>
  );
}
