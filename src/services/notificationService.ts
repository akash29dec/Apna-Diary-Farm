// ========================================
// Notification Service (Phase 2)
// ========================================

let reminderTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Request Notification API permission from user
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported in this browser');
    return false;
  }
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

/**
 * Show a notification immediately
 */
function showNotification(title: string, body: string): void {
  if (Notification.permission !== 'granted') return;

  // Try service worker notification first (works on Android PWA)
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, {
        body,
        icon: '/icons/icon.svg',
        badge: '/icons/icon.svg',
        tag: 'daily-reminder',
      });
    });
  } else {
    // Fallback to regular notification
    new Notification(title, {
      body,
      icon: '/icons/icon.svg',
      tag: 'daily-reminder',
    });
  }
}

/**
 * Calculate milliseconds until the next occurrence of a given time (HH:MM)
 */
function msUntilTime(timeStr: string): number {
  const [h, m] = timeStr.split(':').map((s) => parseInt(s ?? '0', 10));
  const now = new Date();
  const target = new Date(now);
  target.setHours(h ?? 8, m ?? 0, 0, 0);

  // If the target time has already passed today, schedule for tomorrow
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  return target.getTime() - now.getTime();
}

/**
 * Schedule a daily reminder notification at the specified time.
 * Repeats daily using chained timeouts.
 */
export function scheduleReminderNotification(time: string): void {
  cancelScheduledReminder();

  const ms = msUntilTime(time);

  reminderTimeout = setTimeout(() => {
    showNotification(
      '📋 Apna Diary — Daily Reminder',
      'Time to record today\'s entries! Open the app and enter your sales.'
    );
    // Reschedule for next day
    scheduleReminderNotification(time);
  }, ms);
}

/**
 * Cancel the currently scheduled reminder
 */
export function cancelScheduledReminder(): void {
  if (reminderTimeout !== null) {
    clearTimeout(reminderTimeout);
    reminderTimeout = null;
  }
}
