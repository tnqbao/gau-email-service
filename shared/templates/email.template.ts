// Email Template Service - Generate HTML emails with Panda theme

import { EmailType } from '../types/email.types';

interface TemplateOptions {
  type: EmailType;
  content: string;
  recipientName?: string;
}

interface EmailTypeConfig {
  color: string;
  icon: string;
  title: string;
}

export class EmailTemplateService {
  private readonly TYPE_CONFIGS: Record<EmailType, EmailTypeConfig> = {
    [EmailType.NOTIFICATION]: {
      color: '#4CAF50',
      icon: '🐼 📢',
      title: 'Thông Báo'
    },
    [EmailType.CONFIRMATION]: {
      color: '#2196F3',
      icon: '🐼 ✅',
      title: 'Xác Nhận'
    },
    [EmailType.WARNING]: {
      color: '#FF9800',
      icon: '🐼 ⚠️',
      title: 'Cảnh Báo'
    }
  };

  generateEmailHTML(options: TemplateOptions): string {
    const { type, content, recipientName } = options;
    const config = this.TYPE_CONFIGS[type];
    const greeting = recipientName ? `Xin chào ${recipientName}` : 'Xin chào';

    return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.title} - Gấu Trúc System</title>
  <style>
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; }
    .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
    .header { background: linear-gradient(135deg, ${config.color} 0%, ${config.color}dd 100%); color: white; padding: 30px 20px; text-align: center; }
    .header-icon { font-size: 48px; margin-bottom: 10px; }
    .header-title { font-size: 28px; font-weight: bold; margin: 10px 0; }
    .panda-decoration { font-size: 60px; margin: 20px 0; animation: float 3s ease-in-out infinite; }
    @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
    .content { padding: 40px 30px; }
    .greeting { font-size: 20px; color: #333; margin-bottom: 20px; font-weight: 600; }
    .message { font-size: 16px; line-height: 1.8; color: #555; margin-bottom: 30px; white-space: pre-line; }
    .divider { height: 2px; background: linear-gradient(90deg, transparent, ${config.color}, transparent); margin: 30px 0; }
    .footer { background-color: #f9f9f9; padding: 25px 30px; text-align: center; border-top: 3px solid ${config.color}; }
    .footer-panda { font-size: 40px; margin-bottom: 15px; }
    .footer-text { font-size: 14px; color: #777; margin: 5px 0; }
    .badge { display: inline-block; background-color: ${config.color}; color: white; padding: 8px 20px; border-radius: 20px; font-size: 14px; font-weight: bold; margin: 20px 0; }
    .bamboo-pattern { text-align: center; font-size: 24px; color: #4CAF50; margin: 20px 0; opacity: 0.3; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="header-icon">${config.icon}</div>
      <div class="header-title">${config.title}</div>
      <div class="panda-decoration">🐼</div>
    </div>
    <div class="content">
      <div class="greeting">${greeting},</div>
      <div class="badge">${type.toUpperCase()}</div>
      <div class="message">${content}</div>
      <div class="divider"></div>
      <div class="bamboo-pattern">🎋 🎋 🎋</div>
    </div>
    <div class="footer">
      <div class="footer-panda">🐼</div>
      <div class="footer-text"><strong>Gấu Trúc System</strong></div>
      <div class="footer-text">Hệ thống email tự động</div>
      <div class="footer-text" style="margin-top: 15px; font-size: 12px;">© ${new Date().getFullYear()} Gấu Trúc. All rights reserved.</div>
    </div>
  </div>
</body>
</html>`.trim();
  }

  generatePlainText(options: TemplateOptions): string {
    const { type, content, recipientName } = options;
    const config = this.TYPE_CONFIGS[type];
    const greeting = recipientName ? `Xin chào ${recipientName}` : 'Xin chào';

    return `
${config.title.toUpperCase()}
${'='.repeat(50)}

${greeting},

${content}

---
Gấu Trúc System
Hệ thống email tự động
© ${new Date().getFullYear()} Gấu Trúc. All rights reserved.`.trim();
  }
}
