import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('Lost in Europe — Itineraries')
    .setDescription('API para ordenar e armazenar itinerários (tickets).')
    .setVersion('1.0')
    .addTag('itineraries')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
  const host = `http://localhost`;
  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`\n🚀🚀🚀 Server listening on ${host}:${port}\n`);
  console.log(`📙📙📙 Swagger listening on ${host}:${port}/docs`);
}
bootstrap();