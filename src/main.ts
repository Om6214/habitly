import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(join(__dirname, '..', 'public'), {
    // Add headers for Service Worker
    setHeaders: (res, path) => {
      if (path.endsWith('.js')) {
        res.set('Service-Worker-Allowed', '/');
        res.set('Content-Type', 'application/javascript');
      }
    }
  });
  await app.listen((process.env.PORT || 5000), () => {
    console.log(`Server is running on port http://localhost:${process.env.PORT}`);
  });
}
bootstrap();
