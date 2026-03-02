// ========================================
// App — Routes + Providers
// ========================================

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { useEffect } from 'react';
import DailyEntryScreen from '@/screens/DailyEntryScreen';
import AddCustomerScreen from '@/screens/AddCustomerScreen';
import EditCustomerScreen from '@/screens/EditCustomerScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import PriceSettingsScreen from '@/screens/PriceSettingsScreen';
import SummaryScreen from '@/screens/SummaryScreen';
import CustomerMonthlyDetailScreen from '@/screens/CustomerMonthlyDetailScreen';
import { initializeSeedData, registerSyncListeners, fullSync } from '@/services/syncService';

function AppContent() {
  useEffect(() => {
    // Initialize seed data in IndexedDB
    initializeSeedData().catch(console.error);

    // Attempt initial sync
    if (navigator.onLine) {
      fullSync().catch(console.error);
    }

    // Register online/offline listeners for background sync
    const cleanup = registerSyncListeners((result) => {
      if (result.synced > 0) {
        toast.success(`☁️ Synced ${result.synced} entries to cloud`);
      }
    });

    return cleanup;
  }, []);

  return (
    <>
      <Routes>
        <Route path="/" element={<DailyEntryScreen />} />
        <Route path="/customers/add" element={<AddCustomerScreen />} />
        <Route path="/customers/:id/edit" element={<EditCustomerScreen />} />
        <Route path="/summary" element={<SummaryScreen />} />
        <Route path="/summary/:customerId" element={<CustomerMonthlyDetailScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="/settings/prices" element={<PriceSettingsScreen />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1A1A2E',
            color: '#FFFFFF',
            fontFamily: 'Poppins, sans-serif',
            fontSize: '14px',
            borderRadius: '12px',
            padding: '12px 16px',
          },
          success: {
            iconTheme: {
              primary: '#27AE60',
              secondary: '#FFFFFF',
            },
          },
          error: {
            iconTheme: {
              primary: '#E63946',
              secondary: '#FFFFFF',
            },
          },
        }}
      />
    </BrowserRouter>
  );
}
