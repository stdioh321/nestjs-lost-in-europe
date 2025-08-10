import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ItineraryModule } from './itinerary/itinerary.module';
import { DatabaseModule } from './infraestructure/databases/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    ItineraryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
