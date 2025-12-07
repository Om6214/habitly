import { Controller, Post, Body, UseGuards, Request, Logger, Inject } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { AuthGuard } from '@nestjs/passport';
import { PushProvider } from '../reminder_scheduler/notification/providers/push.provider';

@Controller('push')
export class PushController {
  private readonly logger = new Logger(PushController.name);

  constructor(
    private readonly usersService: UsersService,
    @Inject(PushProvider) private readonly pushProvider: PushProvider,
  ) { }

  @Post('register')
  @UseGuards(AuthGuard('jwt')) // If you have JWT auth
  async registerToken(
    @Request() req,
    @Body() body: { token: string; platform?: string }
  ) {
    try {
      const userId = req.user?.userId || req.user?.id || req.user?.sub;

      if (!userId) {
        return { ok: false, error: 'User not authenticated' };
      }

      this.logger.log(`Registering push token for user ${userId}: ${body.token.substring(0, 20)}...`);

      const result = await this.usersService.addPushToken(userId, body.token);

      return {
        ok: true,
        message: 'Token registered successfully',
        result
      };
    } catch (error) {
      this.logger.error('Error registering push token:', error);
      return {
        ok: false,
        error: error.message || 'Failed to register token'
      };
    }
  }

  // For testing without authentication
  @Post('register-test')
  async registerTokenTest(
    @Body() body: { userId: string; token: string; platform?: string }
  ) {
    try {
      const userId = body.userId;
      if (!userId) {
        return { ok: false, error: 'userId is required' };
      }

      this.logger.log(`[TEST] Registering push token for user ${userId}: ${body.token.substring(0, 20)}...`);

      // In a real app, you would save this to the database
      // For testing, just log it
      this.logger.log(`[TEST] Token for ${userId}: ${body.token}`);

      return {
        ok: true,
        message: 'Token registered successfully (test mode)',
        userId: userId,
        tokenPreview: body.token.substring(0, 20) + '...'
      };
    } catch (error) {
      this.logger.error('Error in test registration:', error);
      return {
        ok: false,
        error: error.message || 'Failed to register token'
      };
    }
  }

  // Test notification endpoint
  @Post('test-notification')
  async sendTestNotification(
    @Body() body: {
      token: string;
      title?: string;
      body?: string;
      data?: any
    }
  ) {
    try {
      if (!body.token) {
        return { ok: false, error: 'Token is required' };
      }

      this.logger.log(`Sending test notification to token: ${body.token.substring(0, 20)}...`);

      const result = await this.pushProvider.send({
        token: body.token,
        title: body.title || 'Test Notification',
        body: body.body || 'This is a test notification from Habitly',
        data: body.data || { test: true, timestamp: new Date().toISOString() }
      });

      if (result.ok) {
        return {
          ok: true,
          messageId: result.info,
          message: 'Test notification sent successfully'
        };
      } else {
        return {
          ok: false,
          error: result.error
        };
      }
    } catch (error) {
      this.logger.error('Error sending test notification:', error);
      return {
        ok: false,
        error: error.message || 'Failed to send test notification'
      };
    }
  }

  @Post('unregister')
  @UseGuards(AuthGuard('jwt'))
  async unregisterToken(
    @Request() req,
    @Body() body: { token: string }
  ) {
    try {
      const userId = req.user?.userId || req.user?.id || req.user?.sub;

      if (!userId) {
        return { ok: false, error: 'User not authenticated' };
      }

      this.logger.log(`Removing push token for user ${userId}`);

      await this.usersService.removePushToken(userId, body.token);

      return {
        ok: true,
        message: 'Token unregistered successfully'
      };
    } catch (error) {
      this.logger.error('Error unregistering push token:', error);
      return {
        ok: false,
        error: error.message || 'Failed to unregister token'
      };
    }
  }
}