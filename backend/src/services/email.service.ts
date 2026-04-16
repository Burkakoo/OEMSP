/**
 * Email Service
 * Sends transactional emails via either Gmail SMTP or Resend HTTP API.
 *
 * Required env vars for SMTP:
 * - EMAIL_PROVIDER=smtp
 * - EMAIL_USER: Gmail address
 * - EMAIL_PASS: Gmail App Password (16 chars, no spaces)
 *
 * Required env vars for Resend:
 * - EMAIL_PROVIDER=resend
 * - RESEND_API_KEY: Resend API key
 *
 * Optional env vars:
 * - EMAIL_FROM: Defaults to EMAIL_USER when omitted
 */

import axios from 'axios';
import * as nodemailer from 'nodemailer';
import { type Transporter } from 'nodemailer';
import { env } from '../config/env.config';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

export interface EmailTemplate {
  name: string;
  subject: string;
  html: string;
}

let transporter: Transporter | null = null;

const getTransporter = (): Transporter => {
  if (transporter) {
    return transporter;
  }

  const emailUser = env.EMAIL_USER;
  const emailPass = env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    throw new Error('Missing EMAIL_USER or EMAIL_PASS in environment variables');
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });

  return transporter;
};

// Export for testing
export const resetTransporter = (): void => {
  transporter = null;
};

const sendViaResend = async (options: EmailOptions): Promise<{ success: boolean; messageId?: string }> => {
  const resendApiKey = env.RESEND_API_KEY;

  if (!resendApiKey) {
    throw new Error('Missing RESEND_API_KEY in environment variables');
  }

  const payload = {
    from: options.from,
    to: Array.isArray(options.to) ? options.to : [options.to],
    subject: options.subject,
    html: options.html,
    text: options.text,
  };

  const response = await axios.post('https://api.resend.com/emails', payload, {
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
  });

  return {
    success: true,
    messageId: response.data?.id,
  };
};

/**
 * Email templates for different notification types
 */
const EMAIL_TEMPLATES: Record<string, (data: any) => EmailTemplate> = {
  enrollment: (data: { studentName: string; courseTitle: string }) => ({
    name: 'enrollment',
    subject: `Enrollment Confirmation - ${data.courseTitle}`,
    html: `
      <h1>Welcome to ${data.courseTitle}!</h1>
      <p>Hi ${data.studentName},</p>
      <p>You have successfully enrolled in ${data.courseTitle}.</p>
      <p>Start learning today!</p>
    `,
  }),

  courseUpdate: (data: { studentName: string; courseTitle: string; updateMessage: string }) => ({
    name: 'courseUpdate',
    subject: `Course Update - ${data.courseTitle}`,
    html: `
      <h1>Course Update</h1>
      <p>Hi ${data.studentName},</p>
      <p>There's an update to ${data.courseTitle}:</p>
      <p>${data.updateMessage}</p>
    `,
  }),

  quizGraded: (data: { studentName: string; quizTitle: string; score: number; totalScore: number }) => ({
    name: 'quizGraded',
    subject: `Quiz Results - ${data.quizTitle}`,
    html: `
      <h1>Quiz Results</h1>
      <p>Hi ${data.studentName},</p>
      <p>Your quiz "${data.quizTitle}" has been graded.</p>
      <p>Score: ${data.score}/${data.totalScore}</p>
    `,
  }),

  certificateIssued: (data: { studentName: string; courseTitle: string; certificateUrl: string }) => ({
    name: 'certificateIssued',
    subject: `Certificate Issued - ${data.courseTitle}`,
    html: `
      <h1>Congratulations!</h1>
      <p>Hi ${data.studentName},</p>
      <p>You have successfully completed ${data.courseTitle}!</p>
      <p>Your certificate is ready: <a href="${data.certificateUrl}">Download Certificate</a></p>
    `,
  }),

  paymentSuccess: (data: { studentName: string; courseTitle: string; amount: number; currency: string }) => ({
    name: 'paymentSuccess',
    subject: `Payment Confirmation - ${data.courseTitle}`,
    html: `
      <h1>Payment Successful</h1>
      <p>Hi ${data.studentName},</p>
      <p>Your payment for ${data.courseTitle} has been processed successfully.</p>
      <p>Amount: ${data.amount} ${data.currency}</p>
    `,
  }),

  paymentFailed: (data: { studentName: string; courseTitle: string; reason: string }) => ({
    name: 'paymentFailed',
    subject: `Payment Failed - ${data.courseTitle}`,
    html: `
      <h1>Payment Failed</h1>
      <p>Hi ${data.studentName},</p>
      <p>Your payment for ${data.courseTitle} could not be processed.</p>
      <p>Reason: ${data.reason}</p>
      <p>Please try again or contact support.</p>
    `,
  }),

  verifyEmail: (data: { firstName: string; code: string }) => ({
    name: 'verifyEmail',
    subject: 'Verify Your Email Address',
    html: `
      <h1>Please verify your email</h1>
      <p>Hi ${data.firstName},</p>
      <p>Use the following code to verify your email address:</p>
      <h2>${data.code}</h2>
      <p>This code will expire in 15 minutes.</p>
    `,
  }),

  passwordResetOtp: (data: { firstName: string; code: string }) => ({
    name: 'passwordResetOtp',
    subject: 'Reset Your Password',
    html: `
      <h1>Password reset code</h1>
      <p>Hi ${data.firstName},</p>
      <p>Use the following code to reset your password:</p>
      <h2>${data.code}</h2>
      <p>This code will expire in 15 minutes.</p>
      <p>If you did not request this, you can safely ignore this email.</p>
    `,
  }),
};

/**
 * Send email using Gmail SMTP (Nodemailer)
 */
export const sendEmail = async (options: EmailOptions): Promise<{ success: boolean; messageId?: string }> => {
  try {
    if (!options.html && !options.text) {
      throw new Error('Email must have either text or html content');
    }

    const fromAddress = options.from || env.EMAIL_FROM || env.EMAIL_USER;

    if (!fromAddress) {
      throw new Error('Missing EMAIL_FROM or EMAIL_USER in environment variables');
    }

    const emailOptions = {
      ...options,
      from: fromAddress,
    };

    if (env.EMAIL_PROVIDER === 'resend') {
      return await sendViaResend(emailOptions);
    }

    const result = await getTransporter().sendMail({
      to: emailOptions.to,
      from: emailOptions.from,
      subject: emailOptions.subject,
      text: emailOptions.text,
      html: emailOptions.html,
    });

    return { success: true, messageId: result.messageId };
  } catch (error) {
    if (error instanceof Error) {
      console.error('SMTP/Email Error:', error.message);
      console.error('Error Stack:', error.stack);
    } else {
      console.error('Unknown Email Error:', error);
    }
    return { success: false };
  }
};

/**
 * Send email using template
 */
export const sendTemplateEmail = async (
  to: string | string[],
  templateName: string,
  templateData: any
): Promise<{ success: boolean; messageId?: string }> => {
  const templateFn = EMAIL_TEMPLATES[templateName];

  if (!templateFn) {
    throw new Error(`Email template "${templateName}" not found`);
  }

  const template = templateFn(templateData);

  return sendEmail({
    to,
    subject: template.subject,
    html: template.html,
  });
};

/**
 * Send bulk emails (for notifications)
 * TODO: Implement with email queue for better performance
 */
export const sendBulkEmails = async (
  emails: EmailOptions[]
): Promise<{ success: boolean; sent: number; failed: number }> => {
  // Placeholder implementation
  // In production, use a queue system like Bull or AWS SQS

  console.log(`Would send ${emails.length} bulk emails`);

  let sent = 0;
  let failed = 0;

  for (const email of emails) {
    try {
      await sendEmail(email);
      sent++;
    } catch (error) {
      console.error('Failed to send email:', error);
      failed++;
    }
  }

  return { success: failed === 0, sent, failed };
};

/**
 * Queue email for async sending
 * TODO: Implement with Bull queue
 */
export const queueEmail = async (options: EmailOptions): Promise<{ jobId: string }> => {
  // Placeholder implementation
  // In production, add to Bull queue:

  /*
  const emailQueue = require('../queues/email.queue');
  const job = await emailQueue.add('send-email', options);
  return { jobId: job.id };
  */

  console.log('Email queued for sending:', options.subject);

  return { jobId: `job-${Date.now()}` };
};
