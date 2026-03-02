// ========================================
// Settings Store (Zustand)
// ========================================

import { create } from 'zustand';
import type { Settings } from '@/types';
import {
  getSettings as getSettingsLocal,
  saveSettings as saveSettingsLocal,
} from '@/services/localDB';
import {
  upsertSettings as upsertSettingsRemote,
  isSupabaseConfigured,
} from '@/services/supabase';

interface SettingsState {
  settings: Settings | null;
  loading: boolean;
  fetchSettings: () => Promise<void>;
  updateSettings: (updates: Partial<Settings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  loading: false,

  fetchSettings: async () => {
    set({ loading: true });
    try {
      const settings = await getSettingsLocal();
      set({ settings: settings ?? null, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  updateSettings: async (updates) => {
    const current = get().settings;
    if (!current) return;

    const updated: Settings = {
      ...current,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    await saveSettingsLocal(updated);
    set({ settings: updated });

    if (navigator.onLine && isSupabaseConfigured()) {
      try {
        await upsertSettingsRemote(updated);
      } catch (err) {
        console.error('Failed to sync settings:', err);
      }
    }
  },
}));
