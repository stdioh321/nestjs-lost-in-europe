import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ItineraryModule } from './itinerary/itinerary.module';
import { DatabaseModule } from './infraestructure/databases/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    ItineraryModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
