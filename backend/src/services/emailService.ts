import { db } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import * as postmark from 'postmark';
import sgMail from '@sendgrid/mail';
import { env } from '../config/env';
import { logger } from '../config/logger';

export interface EmailPayload {
  tenantId: string;
  to: string;
  subject: string;
  template: string;
  context?: Record<string, any>;
}

export interface EmailProvider {
  name: string;
  sendEmail(payload: EmailPayload): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

export class PostmarkProvider implements EmailProvider {
  name = 'postmark';
  private client: postmark.ServerClient | null = null;

  constructor() {
    if (env.POSTMARK_SERVER_TOKEN) {
      this.client = new postmark.ServerClient(env.POSTMARK_SERVER_TOKEN);
    } else {
      logger.warn('POSTMARK_SERVER_TOKEN missing. PostmarkProvider initialized in mock mode.');
    }
  }

  async sendEmail(payload: EmailPayload) {
    if (!this.client) {
      logger.info(`[POSTMARK MOCK] To: ${payload.to} | Subject: ${payload.subject}`);
      return { success: true, messageId: `mock-pm-${uuidv4()}` };
    }

    try {
      const result = await this.client.sendEmailWithTemplate({
        From: env.EMAIL_FROM_ADDRESS || 'no-reply@eduk8u.com',
        To: payload.to,
        TemplateAlias: payload.template,
        TemplateModel: payload.context || {},
      });
      return { success: true, messageId: result.MessageID };
    } catch (err: any) {
      logger.error('Postmark error', { error: err.message });
      return { success: false, error: err.message };
    }
  }
}

export class SendGridProvider implements EmailProvider {
  name = 'sendgrid';
  private configured = false;

  constructor() {
    if (env.SENDGRID_API_KEY) {
      sgMail.setApiKey(env.SENDGRID_API_KEY);
      this.configured = true;
    } else {
      logger.warn('SENDGRID_API_KEY missing. SendGridProvider initialized in mock mode.');
    }
  }

  async sendEmail(payload: EmailPayload) {
    if (!this.configured) {
      logger.info(`[SENDGRID MOCK] To: ${payload.to} | Subject: ${payload.subject}`);
      return { success: true, messageId: `mock-sg-${uuidv4()}` };
    }

    try {
      const [response] = await sgMail.send({
        from: env.EMAIL_FROM_ADDRESS || 'no-reply@eduk8u.com',
        to: payload.to,
        subject: payload.subject,
        templateId: payload.template, // Requires dynamic templates in SendGrid
        dynamicTemplateData: payload.context || {},
      });
      return { success: true, messageId: response.headers['x-message-id'] || uuidv4() };
    } catch (err: any) {
      logger.error('SendGrid error', { error: err.message });
      return { success: false, error: err.message };
    }
  }
}

export class EmailService {
  private primaryProvider: EmailProvider;
  private fallbackProvider: EmailProvider;

  constructor(primary?: EmailProvider, fallback?: EmailProvider) {
    this.primaryProvider = primary || new PostmarkProvider();
    this.fallbackProvider = fallback || new SendGridProvider();
  }

  async sendTemplateEmail(payload: EmailPayload) {
    const logId = uuidv4();
    let result = await this.primaryProvider.sendEmail(payload);
    let usedProvider = this.primaryProvider.name;

    // Failover
    if (!result.success) {
      logger.warn(`Primary provider (${this.primaryProvider.name}) failed. Attempting fallback...`);
      result = await this.fallbackProvider.sendEmail(payload);
      usedProvider = this.fallbackProvider.name;
    }

    try {
      await db.query(
        `INSERT INTO email_logs (id, tenant_id, recipient_email, subject, template_name, provider, status, error_message)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          logId,
          payload.tenantId,
          payload.to,
          payload.subject,
          payload.template,
          usedProvider,
          result.success ? 'sent' : 'failed',
          result.success ? null : result.error
        ]
      );
    } catch (dbErr) {
      logger.error('Failed to log email to db', { error: dbErr });
    }
    
    return result;
  }
}

export const emailEngine = new EmailService();
