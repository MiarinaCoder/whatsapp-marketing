export interface WhatsAppEvent {
  eventId: string;
  tenantId: string;
  type: 'message_received' | 'message_read' | 'message_failed' | 'free_window_opened';
  contactPhone: string;
  messageId: string;
  timestamp: Date;
  metadata: Record<string, unknown>;
}
