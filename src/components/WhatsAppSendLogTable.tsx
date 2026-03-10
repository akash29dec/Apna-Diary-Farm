// ========================================
// WhatsApp Send Log Table (Phase 3)
// ========================================

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { fetchWhatsAppSendLog } from '@/services/whatsappService';
import type { WhatsAppSendLogEntry } from '@/services/whatsappService';

export default function WhatsAppSendLogTable() {
  const [logs, setLogs] = useState<WhatsAppSendLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const result = await fetchWhatsAppSendLog(10);
      setLogs(result.logs);
      setError(result.error);
    } catch {
      setError('Failed to load send log');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-5 h-5 text-primary-blue animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-helper text-text-secondary font-poppins text-center py-3">
        {error}
      </p>
    );
  }

  if (logs.length === 0) {
    return (
      <p className="text-helper text-text-secondary font-poppins text-center py-3">
        No messages sent yet
      </p>
    );
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return (
          <span className="text-xs bg-accent-green/10 text-accent-green px-2 py-0.5 rounded-full font-medium">
            Sent
          </span>
        );
      case 'failed':
        return (
          <span className="text-xs bg-warning-red/10 text-warning-red px-2 py-0.5 rounded-full font-medium">
            Failed
          </span>
        );
      case 'skipped':
        return (
          <span className="text-xs bg-border text-text-secondary px-2 py-0.5 rounded-full font-medium">
            Skipped
          </span>
        );
      default:
        return (
          <span className="text-xs bg-border text-text-secondary px-2 py-0.5 rounded-full font-medium">
            {status}
          </span>
        );
    }
  };

  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr + 'T00:00:00');
      return `${date.getDate()}/${date.getMonth() + 1}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-1.5">
      {logs.map((log) => (
        <div
          key={log.id}
          className="flex items-center justify-between py-2 px-2 bg-bg rounded-lg"
        >
          <div className="flex-1 min-w-0">
            <p className="text-helper font-medium text-text-primary font-poppins truncate">
              {log.customer_name}
            </p>
            <p className="text-xs text-text-secondary font-poppins">
              {formatDate(log.send_date)} · {log.message_type}
            </p>
          </div>
          <div className="shrink-0 ml-2">
            {statusBadge(log.status)}
          </div>
        </div>
      ))}
    </div>
  );
}
