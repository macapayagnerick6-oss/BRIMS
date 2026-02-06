// Simple Express backend for BRIMMS SMS & notifications
// SMS provider: Twilio
// Email provider: generic SMTP via Nodemailer
//
// Environment variables (see .env.example):
// - TWILIO_ACCOUNT_SID
// - TWILIO_AUTH_TOKEN
// - TWILIO_FROM_NUMBER
// - PORT (optional, default 4000)
// - CORS_ORIGIN (optional, default http://localhost:4200)

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');

dotenv.config();

const app = express();

const PORT = process.env.PORT || 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:4200';

app.use(
  cors({
    origin: CORS_ORIGIN,
  })
);
app.use(express.json());

// In-memory store for demo notifications
const notifications = [];

// Initialize Twilio client (lazy)
function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error(
      'Missing Twilio configuration. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER.'
    );
  }

  const client = require('twilio')(accountSid, authToken);
  return { client, fromNumber };
}

// Initialize Nodemailer transporter (lazy)
let emailTransporter = null;

function getEmailTransporter() {
  if (emailTransporter) return emailTransporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      'Missing SMTP configuration. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS.'
    );
  }

  emailTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return emailTransporter;
}

// Utility to push notification record
function recordNotification({ type, recipient, message, status, error }) {
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    recipient,
    message,
    status,
    error: error || null,
    createdAt: new Date().toISOString(),
  };
  notifications.unshift(entry);
  // Keep list reasonably small
  if (notifications.length > 200) {
    notifications.pop();
  }
  return entry;
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'brimms-backend', time: new Date().toISOString() });
});

// POST /api/notifications/sms - send one-off SMS
app.post('/api/notifications/sms', async (req, res) => {
  const { to, message } = req.body || {};

  if (!to || !message) {
    return res.status(400).json({ error: 'Missing required fields: to, message' });
  }

  try {
    const { client, fromNumber } = getTwilioClient();

    const twilioMessage = await client.messages.create({
      body: message,
      to,
      from: fromNumber,
    });

    const record = recordNotification({
      type: 'sms',
      recipient: to,
      message,
      status: 'sent',
    });

    res.status(201).json({
      success: true,
      notification: record,
      providerId: twilioMessage.sid,
    });
  } catch (err) {
    console.error('Error sending SMS:', err);
    const record = recordNotification({
      type: 'sms',
      recipient: to,
      message,
      status: 'failed',
      error: err.message || 'Unknown error',
    });
    res.status(500).json({ success: false, error: 'Failed to send SMS', notification: record });
  }
});

// POST /api/notifications/email - send one-off email
app.post('/api/notifications/email', async (req, res) => {
  const { to, subject, message, attachmentName, attachmentContent, attachmentMimeType } = req.body || {};

  if (!to || !subject || !message) {
    return res.status(400).json({ error: 'Missing required fields: to, subject, message' });
  }

  try {
    const transporter = getEmailTransporter();
    const from = process.env.EMAIL_FROM || process.env.SMTP_USER;

    const mailOptions = {
      from,
      to,
      subject,
      text: message,
    };

    if (attachmentName && attachmentContent) {
      mailOptions.attachments = [
        {
          filename: attachmentName,
          content: Buffer.from(attachmentContent, 'base64'),
          contentType: attachmentMimeType || undefined,
        },
      ];
    }

    const info = await transporter.sendMail(mailOptions);

    const record = recordNotification({
      type: 'email',
      recipient: to,
      message: `${subject}: ${message.slice(0, 120)}${message.length > 120 ? '…' : ''}`,
      status: 'sent',
    });

    res.status(201).json({
      success: true,
      notification: record,
      providerId: info.messageId,
    });
  } catch (err) {
    console.error('Error sending email:', err);
    const record = recordNotification({
      type: 'email',
      recipient: to,
      message: `${subject || ''}: ${message || ''}`,
      status: 'failed',
      error: err.message || 'Unknown error',
    });
    res.status(500).json({ success: false, error: 'Failed to send email', notification: record });
  }
});

// POST /api/notifications/email/bulk - send email to multiple recipients
app.post('/api/notifications/email/bulk', async (req, res) => {
  const { recipients, subject, message, attachmentName, attachmentContent, attachmentMimeType } = req.body || {};

  if (!Array.isArray(recipients) || recipients.length === 0 || !subject || !message) {
    return res
      .status(400)
      .json({ error: 'Missing required fields: recipients (array), subject, message' });
  }

  try {
    const transporter = getEmailTransporter();
    const from = process.env.EMAIL_FROM || process.env.SMTP_USER;

    const results = [];

    for (const to of recipients) {
      try {
        const mailOptions = {
          from,
          to,
          subject,
          text: message,
        };

        if (attachmentName && attachmentContent) {
          mailOptions.attachments = [
            {
              filename: attachmentName,
              content: Buffer.from(attachmentContent, 'base64'),
              contentType: attachmentMimeType || undefined,
            },
          ];
        }

        const info = await transporter.sendMail(mailOptions);
        const record = recordNotification({
          type: 'email',
          recipient: to,
          message: `${subject}: ${message.slice(0, 120)}${message.length > 120 ? '…' : ''}`,
          status: 'sent',
        });
        results.push({ to, success: true, providerId: info.messageId, notificationId: record.id });
      } catch (innerErr) {
        console.error('Error sending bulk email to', to, innerErr);
        const record = recordNotification({
          type: 'email',
          recipient: to,
          message: `${subject}: ${message.slice(0, 120)}${message.length > 120 ? '…' : ''}`,
          status: 'failed',
          error: innerErr.message || 'Unknown error',
        });
        results.push({ to, success: false, error: innerErr.message, notificationId: record.id });
      }
    }

    res.status(201).json({ success: true, results });
  } catch (err) {
    console.error('Bulk email general error:', err);
    res.status(500).json({ success: false, error: 'Failed to send bulk email' });
  }
});

// POST /api/notifications/sms/bulk - send SMS to multiple recipients
app.post('/api/notifications/sms/bulk', async (req, res) => {
  const { recipients, message } = req.body || {};

  if (!Array.isArray(recipients) || recipients.length === 0 || !message) {
    return res.status(400).json({ error: 'Missing required fields: recipients (array), message' });
  }

  try {
    const { client, fromNumber } = getTwilioClient();

    const results = [];

    for (const to of recipients) {
      try {
        const twilioMessage = await client.messages.create({
          body: message,
          to,
          from: fromNumber,
        });
        const record = recordNotification({
          type: 'sms',
          recipient: to,
          message,
          status: 'sent',
        });
        results.push({ to, success: true, providerId: twilioMessage.sid, notificationId: record.id });
      } catch (innerErr) {
        console.error('Error sending bulk SMS to', to, innerErr);
        const record = recordNotification({
          type: 'sms',
          recipient: to,
          message,
          status: 'failed',
          error: innerErr.message || 'Unknown error',
        });
        results.push({ to, success: false, error: innerErr.message, notificationId: record.id });
      }
    }

    res.status(201).json({ success: true, results });
  } catch (err) {
    console.error('Bulk SMS general error:', err);
    res.status(500).json({ success: false, error: 'Failed to send bulk SMS' });
  }
});

// GET /api/notifications - list recent notifications
app.get('/api/notifications', (req, res) => {
  res.json({ success: true, notifications });
});

// TODO: Add authentication/role middleware when integrating with real user auth

app.listen(PORT, () => {
  console.log(`BRIMMS backend listening on http://localhost:${PORT}`);
});

