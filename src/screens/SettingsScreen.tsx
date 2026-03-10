// ========================================
// Settings Screen (Route: /settings)
// ========================================

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronRight,
  Bell,
  Smartphone,
  Database,
  Info,
  Download,
  FileText,
  Cloud,
  Upload,
  Loader2,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';
import { usePriceStore } from '@/stores/priceStore';
import BottomNav from '@/components/BottomNav';
import WhatsAppSendLogTable from '@/components/WhatsAppSendLogTable';
import { testWhatsAppConnection } from '@/services/whatsappService';
import { isSupabaseConfigured } from '@/services/supabase';
import toast from 'react-hot-toast';
import {
  requestNotificationPermission,
  scheduleReminderNotification,
  cancelScheduledReminder,
} from '@/services/notificationService';

export default function SettingsScreen() {
  const navigate = useNavigate();
  const { settings, fetchSettings, updateSettings } = useSettingsStore();
  const { globalPrices, fetchGlobalPrices } = usePriceStore();

  const [sellerName, setSellerName] = useState('');
  const [sellerPhone, setSellerPhone] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState('08:00');
  const [testingWhatsApp, setTestingWhatsApp] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState<'unknown' | 'connected' | 'not_configured'>('unknown');

  useEffect(() => {
    fetchSettings();
    fetchGlobalPrices();
    // Check WhatsApp API status
    setWhatsappStatus(isSupabaseConfigured() ? 'connected' : 'not_configured');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (settings) {
      setSellerName(settings.seller_name);
      setSellerPhone(settings.seller_phone ?? '');
      setReminderEnabled(settings.reminder_enabled);
      setReminderTime(settings.reminder_time);
    }
  }, [settings]);

  const handleSaveShopInfo = async () => {
    await updateSettings({
      seller_name: sellerName.trim() || 'Apna Diary',
      seller_phone: sellerPhone.trim() || null,
    });
    toast.success('Shop info saved');
  };

  const handleToggleReminder = async () => {
    const newValue = !reminderEnabled;
    setReminderEnabled(newValue);
    await updateSettings({ reminder_enabled: newValue });

    if (newValue) {
      const granted = await requestNotificationPermission();
      if (granted) {
        scheduleReminderNotification(reminderTime);
        toast.success('Reminder enabled');
      } else {
        toast('Notifications blocked by browser. Enable them in browser settings.', { icon: '⚠️' });
        setReminderEnabled(false);
        await updateSettings({ reminder_enabled: false });
      }
    } else {
      cancelScheduledReminder();
      toast.success('Reminder disabled');
    }
  };

  const handleReminderTimeChange = async (time: string) => {
    setReminderTime(time);
    await updateSettings({ reminder_time: time });
    if (reminderEnabled) {
      scheduleReminderNotification(time);
    }
  };

  const latestPrice = globalPrices[0];

  return (
    <div className="min-h-screen bg-bg pb-24">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center gap-3 bg-primary-blue px-4 h-14">
        <button
          onClick={() => navigate('/')}
          className="flex items-center justify-center min-w-touch min-h-touch"
          aria-label="Go back to home"
        >
          <ArrowLeft size={28} className="text-white" />
        </button>
        <h1 className="text-xl font-bold text-white font-poppins">Settings</h1>
      </header>

      <div className="h-14" />

      <div className="p-4 space-y-6">
        {/* Shop Information */}
        <section className="bg-surface rounded-2xl p-4 border border-border space-y-3">
          <h2 className="text-label font-semibold text-text-primary font-poppins flex items-center gap-2">
            🏪 Shop Information
          </h2>
          <div className="space-y-2">
            <label className="text-helper text-text-secondary font-poppins">
              Shop / Seller Name
            </label>
            <input
              type="text"
              value={sellerName}
              onChange={(e) => setSellerName(e.target.value)}
              className="w-full h-14 px-4 text-body text-text-primary bg-bg border-2 border-border rounded-xl font-poppins focus:outline-none focus:border-primary-blue transition-colors"
              aria-label="Seller name"
            />
          </div>
          <div className="space-y-2">
            <label className="text-helper text-text-secondary font-poppins">
              Seller Phone (+91)
            </label>
            <input
              type="tel"
              inputMode="numeric"
              value={sellerPhone}
              onChange={(e) => setSellerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="Phase 3 — for WhatsApp sender"
              className="w-full h-14 px-4 text-body text-text-primary bg-bg border-2 border-border rounded-xl font-poppins focus:outline-none focus:border-primary-blue transition-colors"
              aria-label="Seller phone number"
            />
          </div>
          <button
            onClick={handleSaveShopInfo}
            className="w-full h-12 bg-primary-blue text-white font-semibold text-label rounded-xl font-poppins hover:bg-primary-blue/90 transition-colors min-h-touch"
            aria-label="Save shop information"
          >
            Save Shop Info
          </button>
        </section>

        {/* Global Prices */}
        <section className="bg-surface rounded-2xl border border-border overflow-hidden">
          <button
            onClick={() => navigate('/settings/prices')}
            className="w-full flex items-center justify-between p-4 hover:bg-primary-light transition-colors min-h-touch"
            aria-label="Open price settings"
          >
            <div>
              <h2 className="text-label font-semibold text-text-primary font-poppins flex items-center gap-2">
                💰 Global Prices
              </h2>
              {latestPrice && (
                <p className="text-helper text-text-secondary font-poppins mt-1">
                  Milk: ₹{latestPrice.milk_price}/L &nbsp;|&nbsp; Paneer: ₹{latestPrice.paneer_price}/kg &nbsp;|&nbsp; Dahi: ₹{latestPrice.dahi_price}/kg
                </p>
              )}
            </div>
            <ChevronRight size={24} className="text-text-secondary shrink-0" />
          </button>
        </section>

        {/* Notifications */}
        <section className="bg-surface rounded-2xl p-4 border border-border space-y-3">
          <h2 className="text-label font-semibold text-text-primary font-poppins flex items-center gap-2">
            <Bell size={18} /> Notifications
          </h2>
          <div className="flex items-center justify-between">
            <span className="text-body text-text-primary font-poppins">
              Daily entry reminder
            </span>
            <div className="flex items-center justify-center min-w-[44px] min-h-[44px]">
              <button
                role="switch"
                aria-checked={reminderEnabled}
                onClick={handleToggleReminder}
                className={`relative inline-flex items-center w-12 h-6 rounded-full transition-all duration-200
                  ${reminderEnabled ? 'bg-green-500' : 'bg-gray-200'}`}
                aria-label="Toggle daily reminder"
              >
                <span
                  className={`inline-block w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200
                    ${reminderEnabled ? 'translate-x-6' : 'translate-x-0.5'}`}
                />
              </button>
            </div>
          </div>
          {reminderEnabled && (
            <div className="flex items-center justify-between">
              <span className="text-label text-text-secondary font-poppins">
                Reminder time
              </span>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => handleReminderTimeChange(e.target.value)}
                className="h-12 px-3 text-body text-text-primary bg-bg border-2 border-border rounded-xl font-poppins focus:outline-none focus:border-primary-blue"
                aria-label="Reminder time"
              />
            </div>
          )}
        </section>

        {/* WhatsApp Settings (Phase 3 — Live) */}
        <section className="bg-surface rounded-2xl p-4 border border-border space-y-4">
          <h2 className="text-label font-semibold text-text-primary font-poppins flex items-center gap-2">
            <Smartphone size={18} /> WhatsApp Integration
          </h2>

          {/* API Status */}
          <div className="flex items-center justify-between">
            <span className="text-body text-text-primary font-poppins">
              API Status
            </span>
            <div className="flex items-center gap-1.5">
              {whatsappStatus === 'connected' ? (
                <>
                  <CheckCircle size={16} className="text-accent-green" />
                  <span className="text-helper text-accent-green font-poppins font-medium">Connected</span>
                </>
              ) : (
                <>
                  <XCircle size={16} className="text-warning-red" />
                  <span className="text-helper text-warning-red font-poppins font-medium">Not configured</span>
                </>
              )}
            </div>
          </div>

          {/* Seller Phone */}
          <div className="flex items-center justify-between">
            <span className="text-body text-text-secondary font-poppins">
              Sender Number
            </span>
            <span className="text-helper text-text-secondary font-poppins">
              {sellerPhone ? `+91 ${sellerPhone}` : 'Not set'}
            </span>
          </div>

          {/* Test Connection Button */}
          <button
            onClick={async () => {
              if (!sellerPhone) {
                toast.error('Set seller phone number first');
                return;
              }
              setTestingWhatsApp(true);
              try {
                const phone = sellerPhone.startsWith('+91') ? sellerPhone : `+91${sellerPhone}`;
                const result = await testWhatsAppConnection(phone);
                if (result.success) {
                  toast.success('✅ WhatsApp connection successful!');
                  setWhatsappStatus('connected');
                } else {
                  toast.error(`⚠️ Test failed: ${result.error}`);
                }
              } catch {
                toast.error('Failed to test connection');
              } finally {
                setTestingWhatsApp(false);
              }
            }}
            disabled={testingWhatsApp}
            className="w-full h-12 border-2 font-semibold text-label rounded-xl font-poppins transition-colors min-h-touch flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ borderColor: '#25D366', color: '#25D366' }}
            aria-label="Test WhatsApp connection"
          >
            {testingWhatsApp ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Testing...
              </>
            ) : (
              'Test Connection'
            )}
          </button>

          {/* Send Log */}
          <div className="pt-2 border-t border-border">
            <h3 className="text-helper font-semibold text-text-secondary font-poppins mb-2">
              Recent Send Log
            </h3>
            <WhatsAppSendLogTable />
          </div>
        </section>

        {/* Data & Backup */}
        <section className="bg-surface rounded-2xl p-4 border border-border space-y-3">
          <h2 className="text-label font-semibold text-text-primary font-poppins flex items-center gap-2">
            <Database size={18} /> Data & Backup
          </h2>
          <div className="grid grid-cols-1 gap-2">
            {[
              { icon: <Download size={18} />, label: 'Export All Data as CSV', disabled: true },
              { icon: <FileText size={18} />, label: 'Export All Data as PDF', disabled: true },
              { icon: <Cloud size={18} />, label: 'Backup to Supabase Cloud', disabled: true },
              { icon: <Upload size={18} />, label: 'Import / Restore Backup', disabled: true },
            ].map((item) => (
              <button
                key={item.label}
                disabled={item.disabled}
                className="flex items-center gap-3 w-full h-12 px-4 border border-border rounded-xl text-label text-text-secondary font-poppins hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-touch"
                aria-label={item.label}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </section>

        {/* About */}
        <section className="bg-surface rounded-2xl p-4 border border-border space-y-2">
          <h2 className="text-label font-semibold text-text-primary font-poppins flex items-center gap-2">
            <Info size={18} /> About
          </h2>
          <p className="text-body text-text-primary font-poppins font-semibold">
            Apna Diary 🥛
          </p>
          <p className="text-helper text-text-secondary font-poppins">
            Fresh & Pure Daily ✨
          </p>
          <p className="text-helper text-text-secondary font-poppins">
            Version 2.0.0 — Phase 3
          </p>
        </section>
      </div>

      <BottomNav />
    </div>
  );
}
