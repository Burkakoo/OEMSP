/**
 * Environment Configuration Module
 * Loads and validates environment variables with TypeScript typing
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Environment variable configuration interface
 */
export interface EnvConfig {
  // Server Configuration
  NODE_ENV: 'development' | 'staging' | 'production' | 'test';
  PORT: number;

  // Database Configuration
  DATABASE_URL: string;

  // JWT Configuration
  JWT_SECRET: string;
  REFRESH_TOKEN_SECRET: string;
  JWT_EXPIRES_IN: string;
  REFRESH_TOKEN_EXPIRES_IN: string;

  // Session Configuration
  SESSION_SECRET: string;

  // Payment Gateway Configuration
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  TELEBIRR_API_KEY?: string;
  CBE_BIRR_API_KEY?: string;
  MPESA_API_KEY?: string;
  MPESA_PUBLIC_KEY?: string;
  MPESA_CONSUMER_KEY?: string;
  MPESA_CONSUMER_SECRET?: string;
  MPESA_ENVIRONMENT: string;
  MPESA_SHORTCODE?: string;
  MPESA_PASSKEY?: string;
  PUBLIC_BASE_URL?: string;
  RENDER_EXTERNAL_URL?: string;

  // AWS Configuration
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  AWS_REGION?: string;
  AWS_S3_BUCKET?: string;

  // Email Service Configuration
  EMAIL_PROVIDER: 'smtp' | 'resend';
  RESEND_API_KEY?: string;
  EMAIL_USER?: string;
  EMAIL_PASS?: string;
  EMAIL_FROM?: string;

  // SMS Service Configuration (Africa's Talking)
  AFRICAS_TALKING_USERNAME: string;
  AFRICAS_TALKING_API_KEY: string;

  // Push Notification Configuration (Firebase)
  FIREBASE_PROJECT_ID: string;
  FIREBASE_PRIVATE_KEY: string;
  FIREBASE_CLIENT_EMAIL: string;

  // Redis Configuration
  REDIS_URL?: string;

  // CORS Configuration
  CORS_ORIGIN: string;

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
}

/**
 * Validates that a required environment variable exists
 * @param key - Environment variable name
 * @param defaultValue - Optional default value
 * @returns The environment variable value
 * @throws Error if required variable is missing
 */
function getEnvVariable(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}. Please check your .env file.`);
  }

  return value;
}

/**
 * Validates and parses a numeric environment variable
 * @param key - Environment variable name
 * @param defaultValue - Default numeric value
 * @returns Parsed number
 */
function getNumericEnvVariable(key: string, defaultValue: number): number {
  const value = process.env[key];

  if (!value) {
    return defaultValue;
  }

  const parsed = parseInt(value, 10);

  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a valid number. Received: ${value}`);
  }

  return parsed;
}

/**
 * Validates NODE_ENV value
 * @param env - Environment string
 * @returns Validated environment
 */
function validateNodeEnv(env: string): 'development' | 'staging' | 'production' | 'test' {
  const validEnvs = ['development', 'staging', 'production', 'test'];

  if (!validEnvs.includes(env)) {
    throw new Error(`Invalid NODE_ENV: ${env}. Must be one of: ${validEnvs.join(', ')}`);
  }

  return env as 'development' | 'staging' | 'production' | 'test';
}

/**
 * Validates environment configuration on startup
 * @returns Validated environment configuration object
 */
function validateEnvConfig(): EnvConfig {
  try {
    const nodeEnv = validateNodeEnv(getEnvVariable('NODE_ENV', 'development'));
    const isTestEnv = nodeEnv === 'test';
    const emailUser = process.env.EMAIL_USER || (isTestEnv ? 'test@example.com' : '');

    const rawEmailProvider = process.env.EMAIL_PROVIDER?.trim().toLowerCase();
    const emailProvider = rawEmailProvider
      ? rawEmailProvider === 'smtp' || rawEmailProvider === 'resend'
        ? rawEmailProvider
        : null
      : process.env.RESEND_API_KEY
      ? 'resend'
      : 'smtp';

    if (!emailProvider) {
      throw new Error('EMAIL_PROVIDER must be either "smtp" or "resend"');
    }

    if (emailProvider === 'resend' && !process.env.RESEND_API_KEY && !isTestEnv) {
      throw new Error('RESEND_API_KEY is required when EMAIL_PROVIDER=resend');
    }

    const config: EnvConfig = {
      // Server Configuration
      NODE_ENV: nodeEnv,
      PORT: getNumericEnvVariable('PORT', 5000),

      // Database Configuration
      DATABASE_URL: getEnvVariable('DATABASE_URL', isTestEnv ? 'mongodb://localhost:27017/test' : ''),

      // JWT Configuration
      JWT_SECRET: getEnvVariable('JWT_SECRET', isTestEnv ? 'test-jwt-secret-key-minimum-32-chars' : ''),
      REFRESH_TOKEN_SECRET: getEnvVariable('REFRESH_TOKEN_SECRET', isTestEnv ? 'test-refresh-token-secret-32-chars' : ''),
      JWT_EXPIRES_IN: getEnvVariable('JWT_EXPIRES_IN', '24h'),
      REFRESH_TOKEN_EXPIRES_IN: getEnvVariable('REFRESH_TOKEN_EXPIRES_IN', '7d'),

      // Session Configuration
      SESSION_SECRET: getEnvVariable('SESSION_SECRET', isTestEnv ? 'test-session-secret-key-32-chars' : ''),

      // Payment Gateway Configuration
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || (isTestEnv ? 'test-stripe-key' : ''),
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || (isTestEnv ? 'test-webhook-secret' : ''),
      TELEBIRR_API_KEY: process.env.TELEBIRR_API_KEY || (isTestEnv ? 'test-telebirr-api-key' : ''),
      CBE_BIRR_API_KEY: process.env.CBE_BIRR_API_KEY || (isTestEnv ? 'test-cbe-birr-api-key' : ''),
      MPESA_API_KEY: process.env.MPESA_API_KEY || (isTestEnv ? 'test-mpesa-api-key' : ''),
      MPESA_PUBLIC_KEY: process.env.MPESA_PUBLIC_KEY || (isTestEnv ? 'test-mpesa-public-key' : ''),
      MPESA_CONSUMER_KEY: process.env.MPESA_CONSUMER_KEY || (isTestEnv ? 'test-mpesa-consumer-key' : ''),
      MPESA_CONSUMER_SECRET: process.env.MPESA_CONSUMER_SECRET || (isTestEnv ? 'test-mpesa-consumer-secret' : ''),
      MPESA_ENVIRONMENT: process.env.MPESA_ENVIRONMENT || (isTestEnv ? 'sandbox' : 'production'),
      MPESA_SHORTCODE: process.env.MPESA_SHORTCODE || (isTestEnv ? '174379' : ''),
      MPESA_PASSKEY: process.env.MPESA_PASSKEY || (isTestEnv ? 'test-passkey' : ''),
      PUBLIC_BASE_URL:
        process.env.PUBLIC_BASE_URL ||
        process.env.RENDER_EXTERNAL_URL ||
        process.env.BASE_URL ||
        (isTestEnv ? 'http://localhost:5000' : ''),
      RENDER_EXTERNAL_URL: process.env.RENDER_EXTERNAL_URL || (isTestEnv ? 'http://localhost:5000' : ''),

      // AWS Configuration
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || (isTestEnv ? 'test-aws-key' : ''),
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || (isTestEnv ? 'test-aws-secret' : ''),
      AWS_REGION: process.env.AWS_REGION || 'us-east-1',
      AWS_S3_BUCKET: process.env.AWS_S3_BUCKET || (isTestEnv ? 'test-bucket' : ''),

      // Email Service Configuration
      EMAIL_PROVIDER: emailProvider as 'smtp' | 'resend',
      RESEND_API_KEY: process.env.RESEND_API_KEY || (isTestEnv ? 'test-resend-api-key' : ''),
      EMAIL_USER: emailUser,
      EMAIL_PASS: process.env.EMAIL_PASS || (isTestEnv ? 'test-app-password' : ''),
      EMAIL_FROM: process.env.EMAIL_FROM || emailUser,

      // SMS Service Configuration (Africa's Talking) - optional in development
      AFRICAS_TALKING_USERNAME: process.env.AFRICAS_TALKING_USERNAME || (isTestEnv ? 'test-username' : ''),
      AFRICAS_TALKING_API_KEY: process.env.AFRICAS_TALKING_API_KEY || (isTestEnv ? 'test-api-key' : ''),

      // Push Notification Configuration (Firebase) - optional in development
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || (isTestEnv ? 'test-project-id' : ''),
      FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY || (isTestEnv ? 'test-private-key' : ''),
      FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || (isTestEnv ? 'test@test.com' : ''),

      // Redis Configuration
      REDIS_URL: process.env.REDIS_URL || (isTestEnv ? 'redis://localhost:6379' : ''),

      // CORS Configuration
      CORS_ORIGIN: getEnvVariable('CORS_ORIGIN', 'http://localhost:3000'),

      // Rate Limiting
      RATE_LIMIT_WINDOW_MS: getNumericEnvVariable('RATE_LIMIT_WINDOW_MS', 60000),
      RATE_LIMIT_MAX_REQUESTS: getNumericEnvVariable('RATE_LIMIT_MAX_REQUESTS', 100),
    };

    // Skip strict validation in test environment
    if (!isTestEnv) {
      // Validate JWT secret strength (minimum 256 bits = 32 characters)
      if (config.JWT_SECRET.length < 32) {
        throw new Error('JWT_SECRET must be at least 32 characters long (256 bits)');
      }

      if (config.REFRESH_TOKEN_SECRET.length < 32) {
        throw new Error('REFRESH_TOKEN_SECRET must be at least 32 characters long (256 bits)');
      }

      // Validate session secret strength
      if (config.SESSION_SECRET.length < 32) {
        throw new Error('SESSION_SECRET must be at least 32 characters long (256 bits)');
      }

      // Validate MongoDB connection string format
      if (!config.DATABASE_URL.startsWith('mongodb')) {
        throw new Error(
          'DATABASE_URL must be a valid MongoDB connection string (starting with mongodb:// or mongodb+srv://)'
        );
      }

      // Validate Redis connection string format
      if (config.REDIS_URL && !config.REDIS_URL.startsWith('redis')) {
        throw new Error('REDIS_URL must be a valid Redis connection string (starting with redis://)');
      }
    }

    return config;
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Environment configuration validation failed:');
      console.error(`   ${error.message}`);
      console.error('\n💡 Please check your .env file and ensure all required variables are set.');
      console.error('   Refer to .env.example for the complete list of required variables.\n');
    }
    process.exit(1);
  }
}

/**
 * Validated environment configuration
 * This object is exported and used throughout the application
 */
export const env: EnvConfig = validateEnvConfig();

/**
 * Helper function to check if running in production
 */
export const isProduction = (): boolean => env.NODE_ENV === 'production';

/**
 * Helper function to check if running in development
 */
export const isDevelopment = (): boolean => env.NODE_ENV === 'development';

/**
 * Helper function to check if running in staging
 */
export const isStaging = (): boolean => env.NODE_ENV === 'staging';

// Log successful configuration load (only in development)
if (isDevelopment()) {
  console.warn('✅ Environment configuration loaded successfully');
  console.warn(`   Environment: ${env.NODE_ENV}`);
  console.warn(`   Port: ${env.PORT}`);
  console.warn(`   CORS Origin: ${env.CORS_ORIGIN}`);
}
