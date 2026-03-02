// ========================================
// Date Helper Utilities
// ========================================

import { format, addDays, subDays, isAfter, isEqual, startOfDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const TIMEZONE = 'Asia/Kolkata';

/**
 * Get current date/time in IST timezone
 */
export function getISTNow(): Date {
  return toZonedTime(new Date(), TIMEZONE);
}

/**
 * Get current date string in YYYY-MM-DD format (IST)
 */
export function getISTDateString(): string {
  const now = getISTNow();
  return format(now, 'yyyy-MM-dd');
}

/**
 * Format date for display: "Monday, 2 March 2026"
 */
export function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return format(date, 'EEEE, d MMMM yyyy');
}

/**
 * Format date for short display: "2 Mar 2026"
 */
export function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return format(date, 'd MMM yyyy');
}

/**
 * Check if a date string is today (IST)
 */
export function isToday(dateStr: string): boolean {
  const today = getISTDateString();
  return dateStr === today;
}

/**
 * Check if a date string is a future date (IST)
 */
export function isFutureDate(dateStr: string): boolean {
  const todayDate = startOfDay(getISTNow());
  const checkDate = startOfDay(new Date(dateStr + 'T00:00:00'));
  return isAfter(checkDate, todayDate);
}

/**
 * Check if a date string is today or in the future
 */
export function isTodayOrFuture(dateStr: string): boolean {
  const todayDate = startOfDay(getISTNow());
  const checkDate = startOfDay(new Date(dateStr + 'T00:00:00'));
  return isAfter(checkDate, todayDate) || isEqual(checkDate, todayDate);
}

/**
 * Get the next day's date string
 */
export function getNextDay(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return format(addDays(date, 1), 'yyyy-MM-dd');
}

/**
 * Get the previous day's date string
 */
export function getPrevDay(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return format(subDays(date, 1), 'yyyy-MM-dd');
}

/**
 * Format a date string to YYYY-MM-DD
 */
export function toDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}
