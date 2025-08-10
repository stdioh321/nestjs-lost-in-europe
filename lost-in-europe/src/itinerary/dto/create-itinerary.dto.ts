import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ValidateNested,
  IsArray,
  IsOptional,
  Min,
  ArrayMinSize,
} from 'class-validator';

import { CreateTicketDto } from './create-ticket.dto';

export class CreateItineraryDto {
  @IsOptional()
  @ApiProperty({ example: 'Trip to Electica' })
  name?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateTicketDto)
  @ApiProperty({
    type: [CreateTicketDto],
    example: [
      {
        from: 'St. Anton am Arlberg Bahnhof',
        to: 'Innsbruck Hbf',
        details: {
          transport: 'train',
          code: 'RJX765',
          platform: '3',
          seat: '17C',
          gate: 'A',
          extra: 'Extra info from location',
          toExtra: 'Extra info to location',
        },
      },
      {
        from: 'Innsbruck Hbf',
        to: 'Innsbruck Airport',
        details: { transport: 'tram', code: 'S5' },
      },
      {
        from: 'Innsbruck Airport',
        to: 'Venice Airport',
        details: {
          transport: 'flight',
          code: 'AA904',
          gate: '10',
          seat: '18B',
        },
      },
    ],
  })
  tickets: CreateTicketDto[];
}
