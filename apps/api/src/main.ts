import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: (origin, callback) => {
      // السماح للطلبات اللي ما فيها Origin (زي Postman / curl)
      if (!origin) return callback(null, true);

      const allowed = [
        'https://todo-app-pro-web.vercel.app',
      ];

      const vercelPreview = /^https:\/\/todo-app-pro-.*\.vercel\.app$/;

      if (allowed.includes(origin) || vercelPreview.test(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'), false);
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 204,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
}
bootstrap();