import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';

import { Itinerary } from './itinerary.entity';

export type TicketTransport =
  | 'train'
  | 'bus'
  | 'plane'
  | 'flight'
  | 'ship'
  | 'boat'
  | 'car'
  | 'taxi'
  | 'uber'
  | 'bike'
  | 'walk'
  | 'airplane bus'
  | 'other';

export type TicketDetails = {
  transport?: TicketTransport;
  code?: string;
  platform?: string;
  seat?: string;
  gate?: string;
  extra?: string;

  toExtra?: string;
};

@Index('idx_itinerary', ['itinerary'])
@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  from: string;

  @Column()
  to: string;

  @Column({ type: 'jsonb', nullable: true })
  details: TicketDetails;

  @Column({ type: 'integer', nullable: true })
  position: number;

  @ManyToOne(() => Itinerary, (itinerary) => itinerary.tickets, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  itinerary: Itinerary;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
