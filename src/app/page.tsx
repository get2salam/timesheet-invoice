'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { FileDown, FileSpreadsheet, Eye, Upload, RefreshCw, CheckCircle, PenLine } from 'lucide-react';
import FileUploader from '@/components/FileUploader';
import ShiftEditor from '@/components/ShiftEditor';
import InvoicePreview from '@/components/InvoicePreview';
import InvoiceSettings from '@/components/InvoiceSettings';
import { ShiftEntry, InvoiceData, RATES } from '@/lib/types';
import { calculateInvoiceTotals, generateInvoiceNumber, generateId } from '@/lib/calculations';
import { parseTimesheetText, cleanOCRText } from '@/lib/ocr-parser';
import { downloadPDF } from '@/lib/pdf-generator';
import { downloadExcel } from '@/lib/excel-generator';

export default function Home() {
  const [shifts, setShifts] = useState<ShiftEntry[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState(() => generateInvoiceNumber(1));
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [roundHours, setRoundHours] = useState(true);
  const [ocrStatus, setOcrStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [tesseractLoaded, setTesseractLoaded] = useState(false);

  const invoiceData: InvoiceData = {
    invoiceNumber,
    invoiceDate,
    dueDate: 'Upon Receipt',
    shifts,
    ...calculateInvoiceTotals(shifts),
    tax: 0,
  };

  const loadTesseract = useCallback(async () => {
    if (typeof window !== 'undefined' && !tesseractLoaded) {
      try {
        const Tesseract = await import('tesseract.js');
        (window as any).Tesseract = Tesseract;
        setTesseractLoaded(true);
      } catch (error) {
        console.error('Failed to load Tesseract:', error);
      }
    }
  }, [tesseractLoaded]);

  useEffect(() => { loadTesseract(); }, [loadTesseract]);

  const processTimesheet = async (file: File) => {
    setIsProcessing(true);
    setOcrStatus('loading');
    try {
      if (!tesseractLoaded) await loadTesseract();
      const Tesseract = (window as any).Tesseract || await import('tesseract.js');
      const imageUrl = URL.createObjectURL(file);
      const result = await Tesseract.recognize(imageUrl, 'eng', {
        logger: (m: any) => { if (m.status === 'recognizing text') console.log(`OCR: ${Math.round(m.progress * 100)}%`); },
      });
      const parsed = parseTimesheetText(cleanOCRText(result.data.text));
      if (parsed.shifts.length > 0) { setShifts(parsed.shifts); setOcrStatus('success'); }
      else {
        setOcrStatus('error');
        startManualEntry();
      }
      URL.revokeObjectURL(imageUrl);
    } catch (error) {
      setOcrStatus('error');
      startManualEntry();
    } finally { setIsProcessing(false); }
  };

  const startManualEntry = () => {
    const today = new Date().toISOString().split('T')[0];
    setShifts([
      { id: generateId(), description: 'Protec 3', date: today, startTime: '06:00', endTime: '18:00', hours: 12, otHours: 2, rate: RATES.dailyRate, amount: RATES.dailyRate + (2 * RATES.otRate) }
    ]);
    setOcrStatus('idle');
  };

  const handleDownloadPDF = () => downloadPDF(invoiceData, `hfs_invoice_${invoiceNumber.replace('/', '_')}`);
  const handleDownloadExcel = () => downloadExcel(invoiceData, `hfs_invoice_${invoiceNumber.replace('/', '_')}`);
  const handleReset = () => { setShifts([]); setShowPreview(false); setOcrStatus('idle'); };
  const hasShifts = shifts.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-royal-blue text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Timesheet Invoice Generator</h1>
              <p className="text-light-blue text-sm mt-1">Upload your timesheet and generate professional invoices</p>
            </div>
            {hasShifts && (<button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm"><RefreshCw className="w-4 h-4" />Start Over</button>)}
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">
        {!hasShifts ? (
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-light-blue rounded-full mb-4"><Upload className="w-8 h-8 text-medium-blue" /></div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Upload Your Timesheet</h2>
              <p className="text-gray-600">Take a photo or upload an image of your timesheet.</p>
            </div>
            <FileUploader onFileSelect={processTimesheet} isProcessing={isProcessing} />
            
            <div className="mt-6 text-center">
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300"></div></div>
                <div className="relative flex justify-center text-sm"><span className="px-4 bg-gray-50 text-gray-500">OR</span></div>
              </div>
              <button onClick={startManualEntry} className="mt-6 flex items-center justify-center gap-2 w-full px-6 py-3 text-medium-blue font-medium border-2 border-medium-blue rounded-xl hover:bg-light-blue transition-colors">
                <PenLine className="w-5 h-5" />
                Enter Shifts Manually
              </button>
              <p className="mt-2 text-sm text-gray-500">Best for handwritten timesheets</p>
            </div>

            {ocrStatus === 'error' && (<div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"><p className="text-sm text-yellow-800"><strong>Note:</strong> Could not detect shifts automatically. Please enter manually.</p></div>)}
          </div>
        ) : (
          <div className="space-y-6">
            {ocrStatus === 'success' && (<div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg"><CheckCircle className="w-5 h-5 text-green-600" /><p className="text-sm text-green-800">Extracted {shifts.length} shift(s). Review and edit if needed.</p></div>)}
            <InvoiceSettings invoiceNumber={invoiceNumber} invoiceDate={invoiceDate} onInvoiceNumberChange={setInvoiceNumber} onInvoiceDateChange={setInvoiceDate} />
            <ShiftEditor shifts={shifts} onShiftsChange={setShifts} roundHours={roundHours} onRoundHoursChange={setRoundHours} />
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap gap-6 text-sm">
                  <div><span className="text-gray-500">Days:</span><span className="ml-2 font-semibold">{shifts.length}</span></div>
                  <div><span className="text-gray-500">Daily:</span><span className="ml-2 font-semibold">£{invoiceData.dailyTotal.toFixed(2)}</span></div>
                  <div><span className="text-gray-500">OT ({invoiceData.otHoursTotal}hrs):</span><span className="ml-2 font-semibold">£{invoiceData.otTotal.toFixed(2)}</span></div>
                  <div className="text-lg"><span className="text-gray-500">Total:</span><span className="ml-2 font-bold text-royal-blue">£{invoiceData.grandTotal.toFixed(2)}</span></div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowPreview(!showPreview)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"><Eye className="w-4 h-4" />{showPreview ? 'Hide' : 'Preview'}</button>
                  <button onClick={handleDownloadExcel} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"><FileSpreadsheet className="w-4 h-4" />Excel</button>
                  <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-medium-blue rounded-lg hover:bg-royal-blue"><FileDown className="w-4 h-4" />PDF</button>
                </div>
              </div>
            </div>
            {showPreview && <InvoicePreview data={invoiceData} />}
          </div>
        )}
      </main>
      <footer className="py-6 text-center text-sm text-gray-500">Timesheet Invoice Generator • Built for Ahmed Waqas</footer>
    </div>
  );
}
