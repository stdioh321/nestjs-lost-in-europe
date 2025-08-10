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
  details: Record<string, unknown>;

  @Column({ type: 'integer', nullable: true, name: '"order"' })
  order: number;

  @ManyToOne(() => Itinerary, (itinerary) => itinerary.tickets, {
    onDelete: 'CASCADE',
  })
  itinerary: Itinerary;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
