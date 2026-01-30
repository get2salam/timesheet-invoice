'use client';

import React from 'react';
import { InvoiceData, COMPANY_DETAILS, CLIENT_DETAILS, RATES } from '@/lib/types';
import { formatDate, formatCurrency } from '@/lib/calculations';

interface InvoicePreviewProps {
  data: InvoiceData;
}

export default function InvoicePreview({ data }: InvoicePreviewProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden max-w-2xl mx-auto">
      <div className="bg-royal-blue text-white p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">{COMPANY_DETAILS.name}</h1>
            <p className="text-light-blue text-sm mt-1">Logistics & Freight Services</p>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-bold">INVOICE</h2>
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="flex justify-between mb-6">
          <div>
            <p className="text-sm font-semibold text-medium-blue mb-1">FROM</p>
            <p className="text-sm text-gray-600">{COMPANY_DETAILS.address}, {COMPANY_DETAILS.city}, {COMPANY_DETAILS.postcode}</p>
            <p className="text-sm text-gray-600">{COMPANY_DETAILS.phone} | {COMPANY_DETAILS.email}</p>
            <p className="text-sm text-gray-600">UTR# {COMPANY_DETAILS.utr}</p>
          </div>
          <div className="bg-light-blue rounded-lg p-4 text-sm">
            <div className="flex justify-between gap-4 mb-1">
              <span className="font-semibold text-royal-blue">Invoice No.</span>
              <span className="text-gray-700">{data.invoiceNumber}</span>
            </div>
            <div className="flex justify-between gap-4 mb-1">
              <span className="font-semibold text-royal-blue">Date</span>
              <span className="text-gray-700">{formatDate(data.invoiceDate)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="font-semibold text-royal-blue">Due Date</span>
              <span className="text-gray-700">{data.dueDate}</span>
            </div>
          </div>
        </div>
        <div className="mb-6">
          <p className="text-sm font-semibold text-medium-blue mb-1">BILL TO</p>
          <p className="font-semibold text-gray-800">{CLIENT_DETAILS.name}</p>
          <p className="text-sm text-gray-600">{CLIENT_DETAILS.address}, {CLIENT_DETAILS.city}, {CLIENT_DETAILS.postcode}</p>
        </div>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-medium-blue text-white">
                <th className="px-2 py-2 text-left font-semibold">Description</th>
                <th className="px-2 py-2 text-center font-semibold">Date</th>
                <th className="px-2 py-2 text-center font-semibold">Start</th>
                <th className="px-2 py-2 text-center font-semibold">End</th>
                <th className="px-2 py-2 text-center font-semibold">Hrs</th>
                <th className="px-2 py-2 text-center font-semibold">OT</th>
                <th className="px-2 py-2 text-right font-semibold">Rate</th>
                <th className="px-2 py-2 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.shifts.map((shift, index) => (
                <tr key={shift.id} className={index % 2 === 1 ? 'bg-sky-blue' : ''}>
                  <td className="px-2 py-2 text-gray-700">{shift.description}</td>
                  <td className="px-2 py-2 text-center text-gray-700">{formatDate(shift.date)}</td>
                  <td className="px-2 py-2 text-center text-gray-700">{shift.startTime}</td>
                  <td className="px-2 py-2 text-center text-gray-700">{shift.endTime}</td>
                  <td className="px-2 py-2 text-center text-gray-700">{shift.hours}</td>
                  <td className="px-2 py-2 text-center text-gray-700">{shift.otHours}</td>
                  <td className="px-2 py-2 text-right text-gray-700">{formatCurrency(shift.rate)}</td>
                  <td className="px-2 py-2 text-right font-medium text-gray-800">{formatCurrency(shift.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500
