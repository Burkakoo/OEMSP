/**
 * Notification Utilities
 * Handles SMS and push notification sending
 */

import * as admin from 'firebase-admin';
import { env } from '../config/env.config';

// Initialize Firebase Admin SDK
let firebaseApp: admin.app.App | null = null;

function initializeFirebase() {
  if (!firebaseApp && env.FIREBASE_PROJECT_ID) {
    const serviceAccount = {
      projectId: env.FIREBASE_PROJECT_ID,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
    };

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  return firebaseApp;
}

/**
 * Send SMS using Africa's Talking
 */
export async function sendSMS(phoneNumber: string, message: string): Promise<boolean> {
  try {
    if (!env.AFRICAS_TALKING_USERNAME || !env.AFRICAS_TALKING_API_KEY) {
      console.warn('Africa\'s Talking credentials not configured, SMS not sent');
      return false;
    }

    // Import Africa's Talking dynamically to avoid issues if not installed
    const { AfricasTalking } = await import('africastalking');

    const africasTalking = AfricasTalking({
      apiKey: env.AFRICAS_TALKING_API_KEY,
      username: env.AFRICAS_TALKING_USERNAME,
    });

    const sms = africasTalking.SMS;

    const result = await sms.send({
      to: [phoneNumber],
      message: message,
      from: 'OEMSP', // Your registered sender ID
    });

    console.log('SMS sent successfully:', result);
    return true;
  } catch (error) {
    console.error('Failed to send SMS:', error);
    return false;
  }
}

/**
 * Send push notification using Firebase Cloud Messaging
 */
export async function sendPushNotification(
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<boolean> {
  try {
    const app = initializeFirebase();
    if (!app) {
      console.warn('Firebase not configured, push notification not sent');
      return false;
    }

    const message = {
      token: token,
      notification: {
        title: title,
        body: body,
      },
      data: data || {},
    };

    const response = await admin.messaging().send(message);
    console.log('Push notification sent successfully:', response);
    return true;
  } catch (error) {
    console.error('Failed to send push notification:', error);
    return false;
  }
}

/**
 * Send push notification to multiple tokens
 */
export async function sendPushNotificationToMultiple(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ success: number; failure: number }> {
  try {
    const app = initializeFirebase();
    if (!app) {
      console.warn('Firebase not configured, push notifications not sent');
      return { success: 0, failure: tokens.length };
    }

    const message = {
      tokens: tokens,
      notification: {
        title: title,
        body: body,
      },
      data: data || {},
    };

    const messaging = admin.messaging() as any;
    const response = await messaging.sendMulticast(message);
    console.log(`Push notifications sent: ${response.successCount} success, ${response.failureCount} failure`);
    return { success: response.successCount, failure: response.failureCount };
  } catch (error) {
    console.error('Failed to send push notifications:', error);
    return { success: 0, failure: tokens.length };
  }
}