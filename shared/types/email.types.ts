export enum EmailType {
  NOTIFICATION = 'notification',
  CONFIRMATION = 'confirmation',
  WARNING = 'warning'
}

export interface EmailMessage {
  type: EmailType;
  content: string;
  recipient: string;
  recipientName?: string;
  actionUrl?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}
