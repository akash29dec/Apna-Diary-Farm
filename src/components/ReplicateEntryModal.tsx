// ========================================
// Replicate Entry Modal Component (Phase 2)
// ========================================

import { useState, useEffect, useMemo } from 'react';
import { X, Copy, Check } from 'lucide-react';
import type { DailyEntry } from '@/types';
import { replicateEntry } from '@/utils/replicateEntry';
import { getDaysInMonth } from 'date-fns';
import toast from 'react-hot-toast';

interface ReplicateEntryModalProps {
    isOpen: boolean;
    sourceEntry: DailyEntry | null;
    entries: DailyEntry[]; // All entries for the current month
    yearMonth: string; // "YYYY-MM"
    onClose: () => void;
    onSuccess: () => void;
}

type SelectionMode = 'empty' | 'weekdays' | 'manual';

export default function ReplicateEntryModal({
    isOpen,
    sourceEntry,
    entries,
    yearMonth,
    onClose,
    onSuccess,
}: ReplicateEntryModalProps) {
    const [mode, setMode] = useState<SelectionMode>('empty');
    const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set());
    const [overwrite, setOverwrite] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Month bounds and today bound
    const parts = yearMonth.split('-');
    const y = parseInt(parts[0] ?? '2026', 10);
    const m = parseInt(parts[1] ?? '1', 10) - 1;
    const daysInMonth = getDaysInMonth(new Date(y, m));

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Map of existing entries for fast lookup
    const entryMap = useMemo(() => {
        const map = new Map<number, DailyEntry>();
        for (const e of entries) {
            if (e.entry_date.startsWith(yearMonth)) {
                const day = parseInt(e.entry_date.split('-')[2] || '0', 10);
                map.set(day, e);
            }
        }
        return map;
    }, [entries, yearMonth]);

    // List of all valid days in this month up to today
    const validDays = useMemo(() => {
        const list: number[] = [];
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${yearMonth}-${String(d).padStart(2, '0')}`;
            if (dateStr <= todayStr) {
                list.push(d);
            }
        }
        return list;
    }, [daysInMonth, yearMonth, todayStr]);

    // Handle quick selection changes
    useEffect(() => {
        if (!isOpen || !sourceEntry) return;

        const sourceDay = parseInt(sourceEntry.entry_date.split('-')[2] || '0', 10);

        if (mode === 'empty') {
            const emptyDays = new Set<number>();
            validDays.forEach(d => {
                if (d !== sourceDay && !entryMap.has(d)) {
                    emptyDays.add(d);
                }
            });
            setSelectedDays(emptyDays);
            setOverwrite(false); // only empty days, so overwrite not needed
        } else if (mode === 'weekdays') {
            const weekdayEmptyDays = new Set<number>();
            validDays.forEach(d => {
                const dateStr = `${yearMonth}-${String(d).padStart(2, '0')}`;
                const dayOfWeek = new Date(dateStr + 'T00:00:00').getDay();
                const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

                // As per spec: "empty days that are Mon-Fri only"
                if (d !== sourceDay && isWeekday && !entryMap.has(d)) {
                    weekdayEmptyDays.add(d);
                }
            });
            setSelectedDays(weekdayEmptyDays);
            setOverwrite(false);
        }
        // if mode === 'manual', we keep whatever is currently selected
    }, [mode, validDays, entryMap, sourceEntry, yearMonth, isOpen]);

    // Only reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setMode('empty'); // Default to all empty days
            setOverwrite(false);
            setIsSubmitting(false);
        }
    }, [isOpen]);

    if (!isOpen || !sourceEntry) return null;

    const sourceDay = parseInt(sourceEntry.entry_date.split('-')[2] || '0', 10);
    const sourceDateStr = `${sourceDay} ${dayNames[new Date(sourceEntry.entry_date + 'T00:00:00').getDay()]}`;

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthLabel = monthNames[m] + ' ' + y;

    // Check if any selected day has an existing entry (for displaying radio options)
    const hasSelectedExisting = Array.from(selectedDays).some(d => entryMap.has(d));

    const handleToggleDay = (day: number) => {
        setMode('manual');
        const next = new Set(selectedDays);
        if (next.has(day)) {
            next.delete(day);
        } else {
            next.add(day);
        }
        setSelectedDays(next);
    };

    const handleSelectAllEmpty = () => {
        setMode('manual');
        const emptyDays = new Set(selectedDays);
        validDays.forEach(d => {
            if (d !== sourceDay && !entryMap.has(d)) {
                emptyDays.add(d);
            }
        });
        setSelectedDays(emptyDays);
    };

    const handleDeselectAll = () => {
        setMode('manual');
        setSelectedDays(new Set());
    };

    const handleReplicate = async () => {
        if (selectedDays.size === 0) {
            toast.error('Please select at least one day');
            return;
        }

        setIsSubmitting(true);
        try {
            const targetDateStrs = Array.from(selectedDays).map(d =>
                `${yearMonth}-${String(d).padStart(2, '0')}`
            );

            const count = await replicateEntry(sourceEntry, targetDateStrs, overwrite);

            toast.success(`✅ Entry replicated to ${count} days in ${monthLabel}`);
            onSuccess();
            onClose();
        } catch (err) {
            console.error('Replication failed', err);
            toast.error('Failed to replicate entries');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-surface rounded-2xl w-full max-w-md p-5 shadow-xl relative max-h-[90vh] flex flex-col">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100"
                    aria-label="Close modal"
                >
                    <X className="w-5 h-5 text-text-secondary" />
                </button>

                <h3 className="text-body font-bold text-text-primary font-poppins mb-1 flex items-center gap-2">
                    <Copy className="w-5 h-5 text-primary-blue" />
                    Replicate Entry
                </h3>
                <div className="mb-5 space-y-1">
                    <p className="text-body font-semibold text-text-primary font-poppins">
                        🥛 {sourceEntry.milk_qty}L milk will be replicated
                    </p>
                    <p className="text-helper text-text-secondary font-poppins">
                        🧀 Paneer and 🥣 Dahi quantities are not replicated — enter manually.
                    </p>
                    <p className="text-helper text-text-secondary font-poppins mt-2">
                        Source date: {sourceDateStr} {monthLabel}
                    </p>
                </div>

                {/* Quick Select Buttons */}
                <div className="mb-4">
                    <p className="text-body font-medium text-text-primary font-poppins mb-2">
                        Select the days you want to fill with these quantities.
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setMode('empty')}
                            className={`flex-1 min-h-touch py-2 px-1 text-helper font-bold rounded-lg font-poppins border-2 transition-colors ${mode === 'empty'
                                ? 'bg-accent-orange text-white border-accent-orange'
                                : 'bg-white text-accent-orange border-accent-orange hover:bg-orange-50'
                                }`}
                        >
                            All empty days
                        </button>
                        <button
                            onClick={() => setMode('weekdays')}
                            className={`flex-1 min-h-touch py-2 px-1 text-helper font-bold rounded-lg font-poppins border-2 transition-colors ${mode === 'weekdays'
                                ? 'bg-accent-orange text-white border-accent-orange'
                                : 'bg-white text-accent-orange border-accent-orange hover:bg-orange-50'
                                }`}
                        >
                            Weekdays only
                        </button>
                        <button
                            onClick={() => setMode('manual')}
                            className={`flex-1 min-h-touch py-2 px-1 text-helper font-bold rounded-lg font-poppins border-2 transition-colors ${mode === 'manual'
                                ? 'bg-accent-orange text-white border-accent-orange'
                                : 'bg-white text-accent-orange border-accent-orange hover:bg-orange-50'
                                }`}
                        >
                            Select manually
                        </button>
                    </div>
                </div>

                {/* Scrollable Checkbox List - Only show in manual mode or if they want to override */}
                {mode === 'manual' && (
                    <div className="flex-1 min-h-0 min-h-[150px] mb-4 flex flex-col border border-border rounded-xl bg-gray-50 overflow-hidden">
                        <div className="flex justify-between items-center p-3 border-b border-border bg-white text-helper font-poppins font-semibold">
                            <button
                                onClick={handleSelectAllEmpty}
                                className="text-primary-blue hover:underline p-1 min-h-touch"
                            >
                                Select All Empty
                            </button>
                            <button
                                onClick={handleDeselectAll}
                                className="text-text-secondary hover:underline p-1 min-h-touch"
                            >
                                Deselect All
                            </button>
                        </div>

                        <div className="overflow-y-auto p-2 space-y-1">
                            {validDays.map(day => {
                                const isSource = day === sourceDay;
                                const hasExisting = entryMap.has(day);
                                const isSelected = selectedDays.has(day);

                                const dateStr = `${yearMonth}-${String(day).padStart(2, '0')}`;
                                const dayOfWeek = dayNames[new Date(dateStr + 'T00:00:00').getDay()];

                                // Determine if disabled: source day is always disabled.
                                // HasExisting is greyed out per spec "Days that already have an entry are shown greyed and cannot be selected."
                                const isDisabled = isSource || hasExisting;

                                return (
                                    <button
                                        key={day}
                                        disabled={isDisabled}
                                        onClick={() => handleToggleDay(day)}
                                        className={`nav-button min-h-touch text-left px-3 py-2 border rounded-lg flex items-center gap-3 w-full transition-colors ${isDisabled
                                            ? 'border-transparent text-text-secondary opacity-50 bg-transparent'
                                            : isSelected
                                                ? 'border-primary-blue bg-blue-50 text-text-primary'
                                                : 'border-border bg-white text-text-primary hover:bg-gray-100'
                                            }`}
                                    >
                                        <div className={`w-5 h-5 rounded flex items-center justify-center border ${isSelected ? 'bg-primary-blue border-primary-blue text-white' : 'border-gray-300 bg-white'
                                            }`}>
                                            {isSelected && <Check className="w-3 h-3" />}
                                        </div>
                                        <span className="font-poppins text-body">
                                            {String(day).padStart(2, '0')} {dayOfWeek}
                                            {isSource && ' — source'}
                                            {!isSource && hasExisting && ' — already has entry'}
                                            {!isSource && !hasExisting && ' — empty'}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Conflict Resolution (Radio options) */}
                {hasSelectedExisting && mode !== 'manual' && (
                    <div className="mb-4 space-y-2 bg-amber-50 rounded-xl p-3 border border-amber-200">
                        <p className="text-helper font-bold text-amber-800 font-poppins">
                            Some selected days already have entries.
                        </p>
                        <label className="flex items-center gap-3 cursor-pointer min-h-touch">
                            <input
                                type="radio"
                                name="conflict-resolution"
                                checked={!overwrite}
                                onChange={() => setOverwrite(false)}
                                className="w-5 h-5 text-primary-blue bg-white border-2 border-border"
                            />
                            <span className="text-body text-text-primary font-poppins">
                                Fill empty days only (skip existing)
                            </span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer min-h-touch">
                            <input
                                type="radio"
                                name="conflict-resolution"
                                checked={overwrite}
                                onChange={() => setOverwrite(true)}
                                className="w-5 h-5 text-primary-blue bg-white border-2 border-border"
                            />
                            <span className="text-body text-text-primary font-poppins">
                                Overwrite existing entries
                            </span>
                        </label>
                    </div>
                )}

                {/* Preview text */}
                <p className="text-center text-body text-text-primary font-poppins font-medium mb-4">
                    This will create/update entries for {selectedDays.size} days in {monthLabel}.
                </p>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-auto">
                    <button
                        onClick={handleReplicate}
                        disabled={isSubmitting || selectedDays.size === 0}
                        className="flex-1 h-14 bg-accent-orange text-white font-bold text-lg rounded-xl font-poppins transition-colors hover:bg-accent-orange/90 min-h-touch disabled:opacity-50 flex items-center justify-center gap-2"
                        aria-label="Replicate"
                    >
                        {isSubmitting ? 'REPLICATING...' : 'REPLICATE'}
                    </button>
                </div>
                <button
                    onClick={onClose}
                    className="w-full mt-2 h-[44px] text-text-secondary font-bold text-body font-poppins hover:text-text-primary"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}
