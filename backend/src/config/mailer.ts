import nodemailer, { Transporter, SendMailOptions } from 'nodemailer';
import { env } from './env';
import { logger } from './logger';

// ============================================================
// Transport
// ============================================================

let transport: Transporter | null = null;

/**
 * Get or create the nodemailer transport (lazy singleton).
 * Verifies SMTP connection on first use in non-test environments.
 */
async function getTransport(): Promise<Transporter> {
  if (transport) return transport;

  transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
  });

  if (env.NODE_ENV !== 'test') {
    try {
      await transport.verify();
      logger.info('✅ SMTP connection verified');
    } catch (error) {
      logger.warn('SMTP verification failed — emails may not be delivered', {
        error: (error as Error).message,
      });
    }
  }

  return transport;
}

// ============================================================
// Email queue (in-memory, Redis-ready interface)
// ============================================================

interface QueuedEmail {
  options: SendMailOptions;
  attempts: number;
  nextAttemptAt: Date;
}

const emailQueue: QueuedEmail[] = [];
let queueProcessing = false;

/** Drain and send any queued emails. Retries up to 3 times with back-off. */
async function processQueue(): Promise<void> {
  if (queueProcessing || emailQueue.length === 0) return;
  queueProcessing = true;

  const now = new Date();
  const ready = emailQueue.filter((e) => e.nextAttemptAt <= now);

  for (const queued of ready) {
    try {
      const t = await getTransport();
      await t.sendMail(queued.options);
      emailQueue.splice(emailQueue.indexOf(queued), 1);
      logger.info('Queued email delivered', { to: queued.options.to, subject: queued.options.subject });
    } catch (error) {
      queued.attempts += 1;
      if (queued.attempts >= 3) {
        emailQueue.splice(emailQueue.indexOf(queued), 1);
        logger.error('Email permanently failed after 3 attempts', {
          to: queued.options.to,
          error: (error as Error).message,
        });
      } else {
        const backoffMs = Math.pow(2, queued.attempts) * 60_000; // 2m, 4m back-off
        queued.nextAttemptAt = new Date(Date.now() + backoffMs);
        logger.warn(`Email delivery failed, retrying in ${backoffMs / 1000}s`, {
          attempt: queued.attempts,
          to: queued.options.to,
        });
      }
    }
  }

  queueProcessing = false;
}

// Process queue every 2 minutes
setInterval(() => { void processQueue(); }, 2 * 60 * 1000);

// ============================================================
// Core send function
// ============================================================

/**
 * Send an email immediately.
 * Falls back to queue on failure.
 *
 * @param options - Nodemailer SendMailOptions
 */
export async function sendEmail(options: SendMailOptions): Promise<void> {
  const mailOptions: SendMailOptions = {
    from: env.SMTP_FROM,
    ...options,
  };

  try {
    const t = await getTransport();
    await t.sendMail(mailOptions);
    logger.info('Email sent', { to: mailOptions.to, subject: mailOptions.subject });
  } catch (error) {
    logger.warn('Email send failed, adding to queue', {
      to: mailOptions.to,
      error: (error as Error).message,
    });
    emailQueue.push({
      options: mailOptions,
      attempts: 1,
      nextAttemptAt: new Date(Date.now() + 2 * 60 * 1000),
    });
  }
}

// ============================================================
// Email templates
// ============================================================

/** Base HTML wrapper applied to all transactional emails */
function baseTemplate(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f4f6f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #1a56db; padding: 32px 40px; }
    .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; }
    .header span { color: #93c5fd; font-size: 14px; }
    .body { padding: 40px; color: #374151; line-height: 1.6; }
    .body h2 { color: #111827; margin-top: 0; }
    .button { display: inline-block; margin: 24px 0; padding: 14px 28px; background: #1a56db; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; }
    .footer { background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 20px 40px; font-size: 12px; color: #9ca3af; }
    .divider { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>EDUK8U</h1>
      <span>Work Placement Intelligence Platform</span>
    </div>
    <div class="body">${body}</div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} EDUK8U. This is an automated message — please do not reply directly.</p>
      <p>If you did not expect this email, please contact your institution administrator.</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Send a welcome email to a newly created user.
 */
export async function sendWelcomeEmail(
  to: string,
  firstName: string,
  tempPassword: string
): Promise<void> {
  const body = `
    <h2>Welcome to EDUK8U, ${firstName}! 👋</h2>
    <p>Your account has been created by your institution administrator.</p>
    <p>Use the credentials below to log in for the first time. You will be prompted to change your password.</p>
    <hr class="divider" />
    <p><strong>Email:</strong> ${to}</p>
    <p><strong>Temporary Password:</strong> <code>${tempPassword}</code></p>
    <hr class="divider" />
    <a href="${env.FRONTEND_URL}/login" class="button">Log in to EDUK8U</a>
    <p style="color:#6b7280;font-size:13px;">For security, this temporary password should be changed immediately after your first login.</p>
  `;

  await sendEmail({
    to,
    subject: 'Welcome to EDUK8U — Your account is ready',
    html: baseTemplate('Welcome to EDUK8U', body),
  });
}

/**
 * Send a password reset email with a secure link.
 */
export async function sendPasswordResetEmail(
  to: string,
  firstName: string,
  resetToken: string
): Promise<void> {
  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  const body = `
    <h2>Reset Your Password</h2>
    <p>Hi ${firstName},</p>
    <p>We received a request to reset the password for your EDUK8U account. Click the button below to choose a new password.</p>
    <a href="${resetUrl}" class="button">Reset Password</a>
    <hr class="divider" />
    <p style="color:#6b7280;font-size:13px;">This link expires in <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email — your password will not change.</p>
    <p style="color:#6b7280;font-size:13px;">If the button above does not work, copy and paste this URL into your browser:<br /><a href="${resetUrl}">${resetUrl}</a></p>
  `;

  await sendEmail({
    to,
    subject: 'EDUK8U — Reset your password',
    html: baseTemplate('Reset Your Password', body),
  });
}

/**
 * Send an email address verification email.
 */
export async function sendEmailVerificationEmail(
  to: string,
  firstName: string,
  verificationToken: string
): Promise<void> {
  const verifyUrl = `${env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
  const body = `
    <h2>Verify Your Email Address</h2>
    <p>Hi ${firstName},</p>
    <p>Please verify your email address to activate your EDUK8U account.</p>
    <a href="${verifyUrl}" class="button">Verify Email Address</a>
    <hr class="divider" />
    <p style="color:#6b7280;font-size:13px;">This link expires in <strong>24 hours</strong>.</p>
  `;

  await sendEmail({
    to,
    subject: 'EDUK8U — Please verify your email address',
    html: baseTemplate('Verify Email Address', body),
  });
}

/**
 * Send a placement alert notification email.
 */
export async function sendPlacementAlertEmail(
  to: string,
  recipientName: string,
  alertType: 'at_risk' | 'hours_overdue' | 'document_missing' | 'placement_start',
  placementReference: string,
  studentName: string,
  details: string
): Promise<void> {
  const alertLabels: Record<string, string> = {
    at_risk: '⚠️ Placement At Risk',
    hours_overdue: '🕐 Hours Log Overdue',
    document_missing: '📄 Missing Document',
    placement_start: '🎉 Placement Starting',
  };

  const label = alertLabels[alertType] ?? 'Placement Notification';
  const body = `
    <h2>${label}</h2>
    <p>Hi ${recipientName},</p>
    <p>This is an automated alert regarding placement <strong>${placementReference}</strong> for student <strong>${studentName}</strong>.</p>
    <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:16px;border-radius:4px;margin:20px 0;">
      <p style="margin:0;color:#92400e;">${details}</p>
    </div>
    <a href="${env.FRONTEND_URL}/placements" class="button">View Placement</a>
    <p style="color:#6b7280;font-size:13px;">If you believe this alert is in error, please contact your placement coordinator.</p>
  `;

  await sendEmail({
    to,
    subject: `EDUK8U — ${label}: ${placementReference}`,
    html: baseTemplate(label, body),
  });
}

/**
 * Send a general in-platform notification email.
 */
export async function sendNotificationEmail(
  to: string,
  recipientName: string,
  title: string,
  message: string,
  actionUrl?: string,
  actionLabel?: string
): Promise<void> {
  const cta =
    actionUrl && actionLabel
      ? `<a href="${actionUrl}" class="button">${actionLabel}</a>`
      : '';

  const body = `
    <h2>${title}</h2>
    <p>Hi ${recipientName},</p>
    <p>${message}</p>
    ${cta}
  `;

  await sendEmail({
    to,
    subject: `EDUK8U — ${title}`,
    html: baseTemplate(title, body),
  });
}
