'use client';

import React from 'react';
import { Trash2, Plus, Clock } from 'lucide-react';
import { ShiftEntry, RATES } from '@/lib/types';
import { generateId, calculateHours, calculateOvertimeHours, calculateShiftAmount, roundHoursToNearest } from '@/lib/calculations';

interface ShiftEditorProps {
  shifts: ShiftEntry[];
  onShiftsChange: (shifts: ShiftEntry[]) => void;
  roundHours: boolean;
  onRoundHoursChange: (value: boolean) => void;
}

export default function ShiftEditor({ shifts, onShiftsChange, roundHours, onRoundHoursChange }: ShiftEditorProps) {
  const recalculateShift = (shift: ShiftEntry): ShiftEntry => {
    let hours = calculateHours(shift.startTime, shift.endTime);
    if (roundHours) hours = roundHoursToNearest(hours, 0.5);
    const otHours = calculateOvertimeHours(hours);
    const amount = calculateShiftAmount(hours, otHours);
    return { ...shift, hours, otHours, amount };
  };

  const updateShift = (id: string, field: keyof ShiftEntry, value: string | number) => {
    const updatedShifts = shifts.map(shift => {
      if (shift.id !== id) return shift;
      const updated = { ...shift, [field]: value };
      if (field === 'startTime' || field === 'endTime') return recalculateShift(updated);
      if (field === 'hours') {
        const hours = Number(value);
        const otHours = calculateOvertimeHours(hours);
        const amount = calculateShiftAmount(hours, otHours);
        return { ...updated, hours, otHours, amount };
      }
      if (field === 'otHours') {
        const otHours = Number(value);
        const amount = calculateShiftAmount(updated.hours, otHours);
        return { ...updated, otHours, amount };
      }
      return updated;
    });
    onShiftsChange(updatedShifts);
  };

  const addShift = () => {
    const newShift: ShiftEntry = {
      id: generateId(), description: 'Protec 3', date: new Date().toISOString().split('T')[0],
      startTime: '06:00', endTime: '16:00', hours: 10, otHours: 0, rate: RATES.dailyRate, amount: RATES.dailyRate
    };
    onShiftsChange([...shifts, newShift]);
  };

  const removeShift = (id: string) => {
    if (shifts.length <= 1) { alert('You must have at least one shift'); return; }
    onShiftsChange(shifts.filter(shift => shift.id !== id));
  };

  const handleRoundingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newRoundHours = e.target.checked;
    onRoundHoursChange(newRoundHours);
    const updatedShifts = shifts.map(shift => {
      let hours = calculateHours(shift.startTime, shift.endTime);
      if (newRoundHours) hours = roundHoursToNearest(hours, 0.5);
      const otHours = calculateOvertimeHours(hours);
      const amount = calculateShiftAmount(hours, otHours);
      return { ...shift, hours, otHours, amount };
    });
    onShiftsChange(updatedShifts);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <Clock className="w-5 h-5 text-medium-blue" />Shift Details
        </h3>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={roundHours} onChange={handleRoundingChange} className="w-4 h-4 text-medium-blue rounded" />
          <span className="text-gray-600">Round hours to nearest 0.5</span>
        </label>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-medium-blue text-white">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold">Description</th>
              <th className="px-3 py-2 text-center text-xs font-semibold">Date</th>
              <th className="px-3 py-2 text-center text-xs font-semibold">Start</th>
              <th className="px-3 py-2 text-center text-xs font-semibold">End</th>
              <th className="px-3 py-2 text-center text-xs font-semibold">Hours</th>
              <th className="px-3 py-2 text-center text-xs font-semibold">OT Hrs</th>
              <th className="px-3 py-2 text-right text-xs font-semibold">Amount</th>
              <th className="px-3 py-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {shifts.map((shift, index) => (
              <tr key={shift.id} className={index % 2 === 1 ? 'bg-sky-blue' : 'bg-white'}>
                <td className="px-3 py-2"><input type="text" value={shift.description} onChange={(e) => updateShift(shift.id, 'description', e.target.value)} className="w-full px-2 py-1 text-sm border border-gray-200 rounded" /></td>
                <td className="px-3 py-2"><input type="date" value={shift.date} onChange={(e) => updateShift(shift.id, 'date', e.target.value)} className="w-full px-2 py-1 text-sm border border-gray-200 rounded" /></td>
                <td className="px-3 py-2"><input type="time" value={shift.startTime} onChange={(e) => updateShift(shift.id, 'startTime', e.target.value)} className="w-full px-2 py-1 text-sm border border-gray-200 rounded text-center" /></td>
                <td className="px-3 py-2"><input type="time" value={shift.endTime} onChange={(e) => updateShift(shift.id, 'endTime', e.target.value)} className="w-full px-2 py-1 text-sm border border-gray-200 rounded text-center" /></td>
                <td className="px-3 py-2"><input type="number" step="0.5" value={shift.hours} onChange={(e) => updateShift(shift.id, 'hours', e.target.value)} className="w-full px-2 py-1 text-sm border border-gray-200 rounded text-center" /></td>
                <td className="px-3 py-2"><input type="number" step="0.5" value={shift.otHours} onChange={(e) => updateShift(shift.id, 'otHours', e.target.value)} className="w-full px-2 py-1 text-sm border border-gray-200 rounded text-center" /></td>
                <td className="px-3 py-2 text-right"><span className="font-medium text-gray-800">£{shift.amount.toFixed(2)}</span></td>
                <td className="px-3 py-2"><button onClick={() => removeShift(shift.id)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t border-gray-200">
        <button onClick={addShift} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-medium-blue border border-medium-blue rounded-lg hover:bg-light-blue">
          <Plus className="w-4 h-4" />Add Shift
        </button>
      </div>
    </div>
  );
}
