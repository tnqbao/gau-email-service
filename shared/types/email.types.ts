// Email Types & Interfaces

export enum EmailType {
  NOTIFICATION = 'thông báo',
  CONFIRMATION = 'xác nhận',
  WARNING = 'cảnh báo'
}

export interface EmailMessage {
  type: EmailType;
  content: string;
  recipient: string;
  recipientName?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

