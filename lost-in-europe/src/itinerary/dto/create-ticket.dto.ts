import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { TicketDetails } from '../entities/ticket.entity';

export type TicketDetailsDto = TicketDetails;
export class CreateTicketDto {
  @IsString()
  @ApiProperty({ example: 'Hired Street' })
  from: string;

  @IsString()
  @ApiProperty({ example: 'Star Avenue' })
  to: string;

  @IsOptional()
  @ApiProperty({
    description:
      'Detalhes livres (jsonb). Use para transporte, assento, plataforma etc.',
    example: {
      transport: 'train',
      code: 'RJX765',
      platform: '3',
      gate: 'A',
      seat: '17C',
      extra: 'Extra info from location',
      toExtra: 'Extra info to location',
    },
  })
  details?: TicketDetails;
}
