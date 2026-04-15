/**
 * Email Service Unit Tests
 * Tests email sending functionality with both SMTP and Resend providers
 */

import axios from 'axios';
import * as nodemailer from 'nodemailer';
import { sendEmail, sendTemplateEmail, resetTransporter, EmailOptions } from '../email.service';

// Mock axios for Resend API calls
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock nodemailer
jest.mock('nodemailer');
const mockedNodemailer = nodemailer as jest.Mocked<typeof nodemailer>;

// Mock env config
jest.mock('../../config/env.config', () => ({
  env: {
    EMAIL_PROVIDER: 'smtp',
    EMAIL_USER: 'test@example.com',
    EMAIL_PASS: 'test-password',
    EMAIL_FROM: 'test@example.com',
    RESEND_API_KEY: 'test-resend-key',
  },
}));

import { env } from '../../config/env.config';

describe('EmailService', () => {
  let mockTransporter: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset env to default
    (env as any).EMAIL_PROVIDER = 'smtp';

    // Reset transporter cache
    resetTransporter();

    // Setup nodemailer mock
    mockTransporter = {
      sendMail: jest.fn(),
    };
    mockedNodemailer.createTransport.mockReturnValue(mockTransporter);

    // Setup axios mock
    mockedAxios.post.mockResolvedValue({
      data: { id: 'test-message-id' },
    });
  });

  afterEach(() => {
    // Reset env to default
    (env as any).EMAIL_PROVIDER = 'smtp';
  });

  describe('sendEmail - SMTP Provider', () => {
    beforeEach(() => {
      (env as any).EMAIL_PROVIDER = 'smtp';
    });

    it('should send email successfully via SMTP', async () => {
      const emailOptions: EmailOptions = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Test Text',
      };

      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'smtp-message-id',
      });

      const result = await sendEmail(emailOptions);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('smtp-message-id');
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        to: 'recipient@example.com',
        from: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Test Text',
      });
    });

    it('should use custom from address when provided', async () => {
      const emailOptions: EmailOptions = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        from: 'custom@example.com',
      };

      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'smtp-message-id',
      });

      const result = await sendEmail(emailOptions);

      expect(result.success).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'custom@example.com',
        })
      );
    });

    it('should fail when neither html nor text is provided', async () => {
      const emailOptions: EmailOptions = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
      };

      const result = await sendEmail(emailOptions);

      expect(result.success).toBe(false);
      expect(mockTransporter.sendMail).not.toHaveBeenCalled();
    });

    it('should handle SMTP errors gracefully', async () => {
      const emailOptions: EmailOptions = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      };

      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP Error'));

      const result = await sendEmail(emailOptions);

      expect(result.success).toBe(false);
      expect(result.messageId).toBeUndefined();
    });
  });

  describe('sendEmail - Resend Provider', () => {
    beforeEach(() => {
      (env as any).EMAIL_PROVIDER = 'resend';
    });

    it('should send email successfully via Resend', async () => {
      const emailOptions: EmailOptions = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Test Text',
      };

      const result = await sendEmail(emailOptions);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-message-id');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.resend.com/emails',
        {
          from: 'test@example.com',
          to: ['recipient@example.com'],
          subject: 'Test Subject',
          html: '<p>Test HTML</p>',
          text: 'Test Text',
        },
        {
          headers: {
            Authorization: 'Bearer test-resend-key',
            'Content-Type': 'application/json',
          },
        }
      );
    });

    it('should handle array of recipients', async () => {
      const emailOptions: EmailOptions = {
        to: ['recipient1@example.com', 'recipient2@example.com'],
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      };

      const result = await sendEmail(emailOptions);

      expect(result.success).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.resend.com/emails',
        expect.objectContaining({
          to: ['recipient1@example.com', 'recipient2@example.com'],
        }),
        expect.any(Object)
      );
    });

    it('should convert single recipient to array', async () => {
      const emailOptions: EmailOptions = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      };

      const result = await sendEmail(emailOptions);

      expect(result.success).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.resend.com/emails',
        expect.objectContaining({
          to: ['recipient@example.com'],
        }),
        expect.any(Object)
      );
    });

    it('should handle Resend API errors gracefully', async () => {
      const emailOptions: EmailOptions = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      };

      mockedAxios.post.mockRejectedValue(new Error('Resend API Error'));

      const result = await sendEmail(emailOptions);

      expect(result.success).toBe(false);
      expect(result.messageId).toBeUndefined();
    });
  });

  describe('sendTemplateEmail', () => {
    beforeEach(() => {
      (env as any).EMAIL_PROVIDER = 'smtp';
      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'template-message-id',
      });
    });

    it('should send template email successfully', async () => {
      const result = await sendTemplateEmail(
        'recipient@example.com',
        'verifyEmail',
        { firstName: 'John', code: '123456' }
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('template-message-id');
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'recipient@example.com',
          subject: 'Verify Your Email Address',
          html: expect.stringContaining('John'),
        })
      );
    });

    it('should fail with unknown template', async () => {
      await expect(
        sendTemplateEmail('recipient@example.com', 'unknownTemplate', {})
      ).rejects.toThrow('Email template "unknownTemplate" not found');
    });

    it('should handle array of recipients for templates', async () => {
      const result = await sendTemplateEmail(
        ['recipient1@example.com', 'recipient2@example.com'],
        'verifyEmail',
        { firstName: 'John', code: '123456' }
      );

      expect(result.success).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ['recipient1@example.com', 'recipient2@example.com'],
        })
      );
    });
  });

  describe('Provider Selection', () => {
    it('should use SMTP when EMAIL_PROVIDER is smtp', async () => {
      (env as any).EMAIL_PROVIDER = 'smtp';

      const emailOptions: EmailOptions = {
        to: 'recipient@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      };

      mockTransporter.sendMail.mockResolvedValue({ messageId: 'smtp-id' });

      await sendEmail(emailOptions);

      expect(mockTransporter.sendMail).toHaveBeenCalled();
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('should use Resend when EMAIL_PROVIDER is resend', async () => {
      (env as any).EMAIL_PROVIDER = 'resend';

      const emailOptions: EmailOptions = {
        to: 'recipient@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      };

      await sendEmail(emailOptions);

      expect(mockedAxios.post).toHaveBeenCalled();
      expect(mockTransporter.sendMail).not.toHaveBeenCalled();
    });
  });
});