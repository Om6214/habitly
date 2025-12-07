// src/reminder_scheduler/notification/providers/push.provider.ts
import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';
import { SendResultDto } from '../dto/send-result.dto';
import * as fs from 'fs';

@Injectable()
export class PushProvider {
  private readonly logger = new Logger(PushProvider.name);
  private initialized = false;

  constructor(private readonly config: ConfigService) {
    this.init();
  }

  private async init() {
    if (this.initialized) return;
    
    try {
      // Option 1: JSON file path
      const serviceAccountPath = this.config.get<string>('FIREBASE_SERVICE_ACCOUNT_PATH');
      
      // Option 2: Direct JSON string from environment variable
      const serviceAccountJson = this.config.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON');
      
      // Option 3: Individual fields
      const projectId = this.config.get<string>('FIREBASE_PROJECT_ID');
      const clientEmail = this.config.get<string>('FIREBASE_CLIENT_EMAIL');
      const privateKey = this.config.get<string>('FIREBASE_PRIVATE_KEY');

      let serviceAccount: any;

      if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
        serviceAccount = require(serviceAccountPath);
      } else if (serviceAccountJson) {
        serviceAccount = JSON.parse(serviceAccountJson);
      } else if (projectId && clientEmail && privateKey) {
        serviceAccount = {
          type: 'service_account',
          project_id: projectId,
          private_key_id: this.config.get<string>('FIREBASE_PRIVATE_KEY_ID') || 'test-key-id',
          private_key: privateKey.replace(/\\n/g, '\n'),
          client_email: clientEmail,
          client_id: this.config.get<string>('FIREBASE_CLIENT_ID') || 'test-client-id',
          auth_uri: 'https://accounts.google.com/o/oauth2/auth',
          token_uri: 'https://oauth2.googleapis.com/token',
          auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
          client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(clientEmail)}`,
        };
      } else {
        this.logger.warn('Firebase configuration not found; push notifications will not work');
        return;
      }

      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: serviceAccount.project_id,
        });
      }
      
      this.initialized = true;
      this.logger.log('✅ Firebase Admin SDK initialized successfully');
      
    } catch (err) {
      this.logger.error('❌ Firebase Admin init failed', (err as any)?.message || err);
    }
  }

  async send(payload: any): Promise<SendResultDto> {
    if (!this.initialized) {
      return { 
        ok: false, 
        error: 'Firebase not initialized',
        details: 'Check FIREBASE_SERVICE_ACCOUNT configuration'
      };
    }

    const { token, topic, title, body, data, android, apns, webpush } = payload;

    if (!token && !topic) {
      return { 
        ok: false, 
        error: 'No token or topic specified',
        payloadReceived: payload 
      };
    }

    try {
      const message: admin.messaging.Message = {
        notification: {
          title: title || 'Habitly Reminder',
          body: body || 'Time for your habit!',
        },
        data: data || {},
        android: android || { priority: 'high' },
        apns: apns || {
          payload: {
            aps: {
              alert: {
                title: title || 'Habitly Reminder',
                body: body || 'Time for your habit!',
              },
              sound: 'default',
              badge: 1,
            },
          },
          headers: {
            'apns-priority': '10',
          },
        },
        webpush: webpush || {
          notification: {
            title: title || 'Habitly Reminder',
            body: body || 'Time for your habit!',
            icon: '/icon.png',
            badge: '/badge.png',
          },
        },
        token: token,
        topic: topic,
      };

      const result = await admin.messaging().send(message);
      this.logger.log(`✅ FCM message sent successfully: ${result}`);
      
      return { 
        ok: true, 
        info: result,
        messageId: result,
        details: 'Message sent to FCM successfully'
      };
      
    } catch (err: any) {
      this.logger.error('❌ FCM send failed', {
        error: err.message,
        code: err.code,
        stack: err.stack,
        payload: {
          hasToken: !!token,
          hasTopic: !!topic,
          titleLength: title?.length || 0,
          bodyLength: body?.length || 0,
        }
      });
      
      return { 
        ok: false, 
        error: err.message || String(err),
        code: err.code,
        details: this.getErrorDetails(err)
      };
    }
  }

  private getErrorDetails(err: any): string {
    const errorCode = err.code;
    const errorMessages: Record<string, string> = {
      'messaging/invalid-registration-token': 'The registration token is invalid. Make sure the token matches the token the client receives from registering with FCM.',
      'messaging/registration-token-not-registered': 'The registration token is no longer registered. The app should be re-installed.',
      'messaging/invalid-argument': 'Invalid arguments provided to the FCM API.',
      'messaging/unknown-error': 'An unknown error occurred. Please try again.',
      'messaging/server-unavailable': 'The FCM server is temporarily unavailable. Please try again later.',
      'messaging/too-many-requests': 'Too many requests sent to FCM. Please implement exponential backoff.',
    };
    
    return errorMessages[errorCode] || 'Unknown error occurred';
  }

  // Additional helper method for sending to multiple tokens
  async sendMulticast(tokens: string[], payload: any): Promise<SendResultDto> {
    if (!this.initialized) {
      return { ok: false, error: 'Firebase not initialized' };
    }

    try {
      const message: admin.messaging.MulticastMessage = {
        notification: {
          title: payload.title || 'Habitly Reminder',
          body: payload.body || 'Time for your habit!',
        },
        data: payload.data || {},
        tokens: tokens,
      };

      const result = await admin.messaging().sendEachForMulticast(message);
      this.logger.log(`✅ Multicast message sent: ${result.successCount} successful, ${result.failureCount} failed`);
      
      return {
        ok: true,
        info: result,
        details: `Multicast send: ${result.successCount} successful, ${result.failureCount} failed`,
      };
      
    } catch (err: any) {
      this.logger.error('❌ Multicast send failed', err);
      return { ok: false, error: err.message };
    }
  }

  // Method to validate a token
  async validateToken(token: string): Promise<{ valid: boolean; info?: string }> {
    try {
      // Send a test message (silent data-only) to validate token
      const result = await this.send({
        token,
        data: { validate: 'true' },
        android: { priority: 'normal' },
        apns: {
          headers: { 'apns-priority': '5' },
          payload: {
            aps: {
              'content-available': 1,
            },
          },
        },
      });
      
      return { valid: result.ok, info: result.info as string };
    } catch (err) {
      return { valid: false, info: (err as Error).message };
    }
  }
}