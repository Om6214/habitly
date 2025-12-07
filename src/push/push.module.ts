import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PushController } from './push.controller';
import { UsersModule } from 'src/users/users.module';
import { PushProvider } from 'src/reminder_scheduler/notification/providers/push.provider';

@Module({
  imports: [
    ConfigModule, 
    UsersModule,  
  ],
  controllers: [PushController],
  providers: [PushProvider],
  exports: [PushProvider],
})
export class PushModule {}