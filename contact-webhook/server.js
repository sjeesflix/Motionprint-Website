const express = require('express');
const nodemailer = require('nodemailer');

const app = express();
app.use(express.json());

// ── CORS ─────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGIN || 'https://sjeesflix.github.io')
  .split(',').map(o => o.trim());
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ── Allowed destinations ──────────────────────────────────────────────────────
const DESTINATIONS = {
  support: 'support@motion-print.com',
  info:    'info@motion-print.com',
};

// ── SMTP transporter (Synology MailPlus — noreply account) ───────────────────
const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   parseInt(process.env.SMTP_PORT) || 25,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: { rejectUnauthorized: false },
});

// ── Contact endpoint ──────────────────────────────────────────────────────────
app.post('/contact', async (req, res) => {
  const { name, email, company, subject, message, destination, role, phone } = req.body || {};

  // Validate required fields (message is optional)
  if (!name || !email || !company) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  const toAddress = DESTINATIONS[destination] || DESTINATIONS.support;
  const subjectLine = (subject || 'Contact request').trim();
  const destLabel = destination === 'info' ? 'Info' : 'Support';
  const FROM = `"Motionprint" <noreply@motion-print.com>`;

  // ── Confirmation email HTML ───────────────────────────────────────────────
  const confirmSubject = `We received your message — Motionprint${destination !== 'info' ? ' ' + destLabel : ''}`;
  const confirmHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
        <!-- Header -->
        <tr><td style="padding:32px 40px 24px;border-bottom:1px solid #f3f4f6;">
          <img src="https://motion-print.com/Motionprint-full.png" alt="Motionprint" style="height:26px;display:block;">
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px 40px;">
          <p style="margin:0 0 16px;font-size:16px;color:#111827;">Hello,</p>
          <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">Thank you for reaching out. We have received your message and will get back to you as soon as possible.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;padding:20px;margin-bottom:24px;">
            <tr><td style="font-size:13px;color:#6b7280;padding-bottom:6px;">Your message</td></tr>
            ${message ? `<tr><td style="font-size:14px;color:#374151;line-height:1.6;white-space:pre-wrap;">${message.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</td></tr>` : ''}
          </table>
          <p style="margin:0;font-size:15px;color:#374151;line-height:1.6;">Best regards,<br><strong>The Motionprint Team</strong></p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:16px 40px;background:#f9fafb;border-top:1px solid #f3f4f6;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">This is an automated message, please do not reply to this email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const confirmText =
    `Hello,\n\n` +
    `Thank you for reaching out. We have received your message and will get back to you as soon as possible.\n\n` +
    `Your message:\n` +
    (message ? `\n${message}\n` : '') +
    `\nBest regards,\nThe Motionprint Team\n\n` +
    `This is an automated message, please do not reply to this email.`;

  try {
    // 1. Notify the destination inbox
    await transporter.sendMail({
      from:    FROM,
      to:      toAddress,
      replyTo: email,
      subject: `[${destLabel}] ${subjectLine} — ${name} (${company})`,
      text:
        `Name:    ${name}\n` +
        `Email:   ${email}\n` +
        `Company: ${company}\n` +
        (role  ? `Role:    ${role}\n`  : '') +
        (phone ? `Phone:   ${phone}\n` : '') +
        `Subject: ${subjectLine}\n\n` +
        (message || '(no message)'),
    });

    // 2. Confirmation to the user
    await transporter.sendMail({
      from:    FROM,
      to:      email,
      subject: confirmSubject,
      text:    confirmText,
      html:    confirmHtml,
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('[contact]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Contact webhook listening on port ${PORT}`));
