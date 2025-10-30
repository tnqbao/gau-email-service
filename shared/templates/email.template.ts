import { EmailType } from '../types/email.types';

interface TemplateOptions {
  type: EmailType;
  content: string;
  recipientName?: string;
  actionUrl?: string;
}

interface EmailTypeConfig {
  color: string;
  icon: string;
  title: string;
  boxBgColor: string;
  boxBorderColor: string;
}

export class EmailTemplateService {
  private readonly LOGO_URL = 'https://cdn.gauas.online/images/avatar/default_image.jpg';

  private readonly TYPE_CONFIGS: Record<EmailType, EmailTypeConfig> = {
    [EmailType.NOTIFICATION]: {
      color: '#0066cc',
      icon: 'ℹ️',
      title: 'Thông Báo',
      boxBgColor: '#f0f7ff',
      boxBorderColor: '#0066cc'
    },
    [EmailType.CONFIRMATION]: {
      color: '#10b981',
      icon: '✅',
      title: 'Xác Nhận Thành Công',
      boxBgColor: '#d1fae5',
      boxBorderColor: '#10b981'
    },
    [EmailType.WARNING]: {
      color: '#d32f2f',
      icon: '⚠️',
      title: 'Cảnh Báo',
      boxBgColor: '#ffebee',
      boxBorderColor: '#d32f2f'
    }
  };

  generateEmailHTML(options: TemplateOptions): string {
    const { type, content, recipientName, actionUrl } = options;
    const config = this.TYPE_CONFIGS[type];
    const greeting = recipientName ? `Xin chào ${recipientName}` : 'Xin chào bạn';

    return `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.title} - Gauas.lab</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table width="100%" style="max-width: 600px;" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
                            <!-- Header -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 30px 20px; text-align: center;">
                                        <img src="${this.LOGO_URL}" alt="Gauas.lab" style="width: 50px; height: 50px; border-radius: 50%; margin-bottom: 15px; display: inline-block; border: 2px solid #ffffff;">
                                        <div style="color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">Gauas.lab</div>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Content -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding: 40px 30px;">
                                        <!-- Status Badge -->
                                        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                                            <tr>
                                                <td style="background-color: ${config.boxBgColor}; border-left: 4px solid ${config.boxBorderColor}; padding: 15px; border-radius: 4px;">
                                                    <p style="margin: 0; color: ${config.color}; font-size: 14px; font-weight: 600;">
                                                        ${config.icon} ${config.title}
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <!-- Greeting -->
                                        <p style="margin: 0 0 20px 0; color: #333333; font-size: 18px; font-weight: 600;">
                                            ${greeting} 👋
                                        </p>
                                        
                                        <!-- Message Content -->
                                        <div style="margin: 0 0 30px 0; color: #666666; font-size: 15px; line-height: 1.6;">
                                            ${content.split('\n').map(line => `<p style="margin: 0 0 15px 0;">${line}</p>`).join('')}
                                        </div>
                                        
                                        ${actionUrl ? `
                                        <!-- Action Button -->
                                        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                            <tr>
                                                <td align="center">
                                                    <a href="${actionUrl}" style="background-color: ${config.color}; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">
                                                        Xem Chi Tiết
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                        ` : ''}
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Footer -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="background-color: #f9f9f9; padding: 20px 30px; border-top: 1px solid #eeeeee; text-align: center;">
                                        <p style="margin: 0; color: #999999; font-size: 13px; line-height: 1.6;">
                                            © ${new Date().getFullYear()} Gauas.lab. Tất cả quyền được bảo lưu.<br>
                                            <a href="https://gauas.online" style="color: ${config.color}; text-decoration: none;">Truy cập trang web</a>
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
  }

  generatePlainText(options: TemplateOptions): string {
    const { type, content, recipientName } = options;
    const config = this.TYPE_CONFIGS[type];
    const greeting = recipientName ? `Xin chào ${recipientName}` : 'Xin chào bạn';

    return `
${config.icon} ${config.title.toUpperCase()}
${'='.repeat(50)}

${greeting},

${content}

---
© ${new Date().getFullYear()} Gauas.lab. Tất cả quyền được bảo lưu.
Website: https://gauas.online
`.trim();
  }
}
