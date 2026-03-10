-- ============================================
-- Phase 3 Migration: Add message_type to whatsapp_send_log
-- ============================================

ALTER TABLE whatsapp_send_log
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'daily_receipt';
