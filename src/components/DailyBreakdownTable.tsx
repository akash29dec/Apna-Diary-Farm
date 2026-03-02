// ========================================
// Daily Breakdown Table Component (Phase 2)
// ========================================

import { useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import type { DailyEntry } from '@/types';
import { useEntryStore } from '@/stores/entryStore';
import { saveAuditLog } from '@/services/localDB';
import { insertAuditLog } from '@/services/supabase';
import { getDaysInMonth } from 'date-fns';
import toast from 'react-hot-toast';

interface DailyBreakdownTableProps {
  entries: DailyEntry[];
  yearMonth: string;
  customerId: string;
  onRefresh: () => void;
}

export default function DailyBreakdownTable({
  entries,
  yearMonth,
  customerId,
  onRefresh,
}: DailyBreakdownTableProps) {
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editMilk, setEditMilk] = useState('0');
  const [editPaneer, setEditPaneer] = useState('0');
  const [editDahi, setEditDahi] = useState('0');
  const [saving, setSaving] = useState(false);

  const { saveEntry } = useEntryStore();

  const parts = yearMonth.split('-');
  const y = parseInt(parts[0] ?? '2026', 10);
  const m = parseInt(parts[1] ?? '1', 10) - 1;
  const daysInMonth = getDaysInMonth(new Date(y, m));

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const entryMap = new Map<string, DailyEntry>();
  for (const entry of entries) {
    entryMap.set(entry.entry_date, entry);
  }

  const startEdit = (dateStr: string, entry?: DailyEntry) => {
    setEditingDate(dateStr);
    setEditMilk(entry?.milk_qty?.toString() ?? '0');
    setEditPaneer(entry?.paneer_qty?.toString() ?? '0');
    setEditDahi(entry?.dahi_qty?.toString() ?? '0');
  };

  const cancelEdit = () => {
    setEditingDate(null);
  };

  const handleSaveEdit = async (dateStr: string) => {
    setSaving(true);
    const existingEntry = entryMap.get(dateStr);
    const milkQty = parseFloat(editMilk) || 0;
    const paneerQty = parseFloat(editPaneer) || 0;
    const dahiQty = parseFloat(editDahi) || 0;

    try {
      // Store original date, save entry for that date
      const originalDate = useEntryStore.getState().selectedDate;
      useEntryStore.getState().setSelectedDate(dateStr);

      const newEntry = await saveEntry({
        customerId,
        milkQty,
        paneerQty,
        dahiQty,
        existingEntryId: existingEntry?.id,
      });

      // Restore the original date
      useEntryStore.getState().setSelectedDate(originalDate);

      // Create audit log if editing existing entry
      if (existingEntry) {
        const auditLog = {
          id: crypto.randomUUID(),
          entry_id: existingEntry.id,
          customer_id: customerId,
          changed_at: new Date().toISOString(),
          changed_by: 'seller',
          field_changed: 'inline_edit',
          old_value: {
            milk_qty: existingEntry.milk_qty,
            paneer_qty: existingEntry.paneer_qty,
            dahi_qty: existingEntry.dahi_qty,
            total_amount: existingEntry.total_amount,
          },
          new_value: {
            milk_qty: milkQty,
            paneer_qty: paneerQty,
            dahi_qty: dahiQty,
            total_amount: newEntry.total_amount,
          },
          reason: 'Inline edit from monthly detail',
        };

        await saveAuditLog(auditLog);
        try {
          await insertAuditLog(auditLog);
        } catch {
          // Non-critical if audit log sync fails
        }
      }

      toast.success('Entry updated!');
      setEditingDate(null);
      onRefresh();
    } catch {
      toast.error('Failed to save entry');
    } finally {
      setSaving(false);
    }
  };

  // Build rows for each day of the month
  const rows: { dateStr: string; day: number; entry: DailyEntry | undefined; isFuture: boolean }[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${yearMonth}-${String(d).padStart(2, '0')}`;
    const entry = entryMap.get(dateStr);
    const isFuture = dateStr > todayStr;
    rows.push({ dateStr, day: d, entry, isFuture });
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-surface rounded-2xl border border-border overflow-hidden">
      <h3 className="text-label font-semibold text-text-primary font-poppins p-4 pb-2">
        📋 Daily Breakdown
      </h3>

      {/* Table header */}
      <div className="grid grid-cols-[60px_1fr_1fr_1fr_80px_40px] gap-1 px-4 py-2 bg-primary-light text-helper font-medium text-text-secondary font-poppins text-center">
        <span className="text-left">Date</span>
        <span>Milk</span>
        <span>Paneer</span>
        <span>Dahi</span>
        <span>Amount</span>
        <span></span>
      </div>

      {/* Table rows */}
      <div className="divide-y divide-border">
        {rows.map(({ dateStr, day, entry, isFuture }) => {
          if (isFuture) return null;

          const isEditing = editingDate === dateStr;
          const hasEntry = entry && entry.total_amount > 0;
          const isNoEntry = !entry;
          const isZero = entry && entry.total_amount === 0;
          const dayOfWeek = dayNames[new Date(dateStr + 'T00:00:00').getDay()] ?? '';

          if (isEditing) {
            return (
              <div key={dateStr} className="p-3 bg-amber-50">
                <p className="text-helper text-text-secondary font-poppins mb-2">
                  Editing: {day} {dayOfWeek}
                </p>
                {entry && (
                  <p className="text-helper text-amber-600 font-poppins mb-2 italic">
                    ⚠️ Editing past entry — customer will be notified via WhatsApp
                  </p>
                )}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div>
                    <label className="text-helper text-text-secondary font-poppins block mb-1">🥛 Milk (L)</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={editMilk}
                      onChange={(e) => setEditMilk(e.target.value)}
                      step="0.25"
                      min="0"
                      className="w-full h-10 px-2 text-body bg-white border border-border rounded-lg font-poppins text-center"
                      aria-label="Edit milk quantity"
                    />
                  </div>
                  <div>
                    <label className="text-helper text-text-secondary font-poppins block mb-1">🧀 Paneer</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={editPaneer}
                      onChange={(e) => setEditPaneer(e.target.value)}
                      step="0.25"
                      min="0"
                      className="w-full h-10 px-2 text-body bg-white border border-border rounded-lg font-poppins text-center"
                      aria-label="Edit paneer quantity"
                    />
                  </div>
                  <div>
                    <label className="text-helper text-text-secondary font-poppins block mb-1">🥣 Dahi</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={editDahi}
                      onChange={(e) => setEditDahi(e.target.value)}
                      step="0.25"
                      min="0"
                      className="w-full h-10 px-2 text-body bg-white border border-border rounded-lg font-poppins text-center"
                      aria-label="Edit dahi quantity"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSaveEdit(dateStr)}
                    disabled={saving}
                    className="flex-1 h-11 bg-accent-orange text-white font-bold text-body rounded-xl font-poppins min-h-touch disabled:opacity-50"
                    aria-label="Save edit"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="flex-1 h-11 bg-gray-200 text-text-primary font-bold text-body rounded-xl font-poppins min-h-touch"
                    aria-label="Cancel edit"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={dateStr}
              className={`grid grid-cols-[60px_1fr_1fr_1fr_80px_40px] gap-1 px-4 py-2.5 items-center text-center text-body font-poppins ${
                isNoEntry || isZero ? 'bg-gray-50 text-text-secondary' : ''
              }`}
            >
              <span className="text-left text-helper text-text-secondary">
                {String(day).padStart(2, '0')} {dayOfWeek}
              </span>

              {hasEntry ? (
                <>
                  <span>{entry.milk_qty > 0 ? `${entry.milk_qty}L` : '—'}</span>
                  <span>{entry.paneer_qty > 0 ? `${entry.paneer_qty}kg` : '—'}</span>
                  <span>{entry.dahi_qty > 0 ? `${entry.dahi_qty}kg` : '—'}</span>
                  <span className="font-medium">₹{entry.total_amount.toFixed(0)}</span>
                  <button
                    onClick={() => startEdit(dateStr, entry)}
                    className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-primary-light"
                    aria-label={`Edit entry for ${dateStr}`}
                  >
                    <Pencil className="w-4 h-4 text-primary-blue" />
                  </button>
                </>
              ) : isZero ? (
                <>
                  <span>—</span>
                  <span>—</span>
                  <span>—</span>
                  <span className="text-helper italic">No purchase</span>
                  <button
                    onClick={() => startEdit(dateStr, entry)}
                    className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-primary-light"
                    aria-label={`Edit entry for ${dateStr}`}
                  >
                    <Pencil className="w-4 h-4 text-text-secondary" />
                  </button>
                </>
              ) : (
                <>
                  <span>—</span>
                  <span>—</span>
                  <span>—</span>
                  <span className="text-helper italic">No entry</span>
                  <button
                    onClick={() => startEdit(dateStr)}
                    className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-primary-light"
                    aria-label={`Add entry for ${dateStr}`}
                  >
                    <Plus className="w-4 h-4 text-accent-green" />
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Monthly total footer */}
      <div className="grid grid-cols-[60px_1fr_1fr_1fr_80px_40px] gap-1 px-4 py-3 bg-primary-light text-center font-poppins font-semibold border-t-2 border-primary-blue/20">
        <span className="text-left text-label text-text-primary">Total</span>
        <span className="text-body text-text-primary">
          {entries.reduce((s, e) => s + e.milk_qty, 0).toFixed(1)}L
        </span>
        <span className="text-body text-text-primary">
          {entries.reduce((s, e) => s + e.paneer_qty, 0).toFixed(2)}kg
        </span>
        <span className="text-body text-text-primary">
          {entries.reduce((s, e) => s + e.dahi_qty, 0).toFixed(2)}kg
        </span>
        <span className="text-body text-primary-blue">
          ₹{entries.filter(e => e.total_amount > 0).reduce((s, e) => s + e.total_amount, 0).toFixed(0)}
        </span>
        <span></span>
      </div>
    </div>
  );
}
