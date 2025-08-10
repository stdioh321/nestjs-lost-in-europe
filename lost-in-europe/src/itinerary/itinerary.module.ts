import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';

import { ItineraryService } from './itinerary.service';
import { ItineraryController } from './itinerary.controller';
import { Itinerary } from './entities/itinerary.entity';
import { Ticket } from './entities/ticket.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Itinerary, Ticket])],
  controllers: [ItineraryController],
  providers: [ItineraryService],
})
export class ItineraryModule {}
