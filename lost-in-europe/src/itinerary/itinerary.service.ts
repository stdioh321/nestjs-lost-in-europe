import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Itinerary } from './entities/itinerary.entity';
import { Ticket, TicketDetails } from './entities/ticket.entity';
import { CreateItineraryDto } from './dto/create-itinerary.dto';
import { CreateTicketDto } from './dto/create-ticket.dto';

@Injectable()
export class ItineraryService {
  constructor(
    @InjectRepository(Itinerary)
    private itineraryRepository: Repository<Itinerary>,
    @InjectRepository(Ticket) private ticketRepository: Repository<Ticket>,
  ) {}

  public async findAll(): Promise<(Itinerary & { humanReadable: string })[]> {
    const list = await this.itineraryRepository.find({
      where: {},
      order: { id: 'ASC' },
    });

    return list.map((itinerary) => ({
      ...itinerary,
      humanReadable: this.humanReadable(itinerary),
    }));
  }

  public async findById(
    id: number,
  ): Promise<Itinerary & { humanReadable: string }> {
    const itinerary = await this.itineraryRepository.findOne({ where: { id } });
    if (!itinerary)
      throw new NotFoundException(`Itinerary with id [${id}] not found`);
    return { ...itinerary, humanReadable: this.humanReadable(itinerary) };
  }

  public async createAndSort(dto: CreateItineraryDto): Promise<Itinerary> {
    const orderedTickets = this.sortTickets(dto.tickets);

    const ticketsEntities = orderedTickets.map((ticket, idx) =>
      this.ticketRepository.create({ ...ticket, position: idx + 1 }),
    );

    const itinerary = this.itineraryRepository.create({
      name: dto.name,
      tickets: ticketsEntities,
    });
    return this.itineraryRepository.save(itinerary);
  }

  public sortTicketsValidateAndBuildMaps(tickets: CreateTicketDto[]): {
    fromMap: Map<string, CreateTicketDto>;
    toSet: Set<string>;
  } {
    if (!tickets || tickets.length === 0)
      throw new BadRequestException('tickets are required');

    const fromMap = new Map<string, CreateTicketDto>();
    const toSet = new Set<string>();

    tickets.forEach((ticket) => {
      if (fromMap.has(ticket.from))
        throw new BadRequestException(
          `duplicate 'from' detected: ${ticket.from} (expects unique from)`,
        );

      fromMap.set(ticket.from, ticket);
      toSet.add(ticket.to);
    });

    return { fromMap, toSet };
  }

  public sortTicketsFindStartPoint(
    tickets: CreateTicketDto[],
    toSet: Set<string>,
  ): string {
    for (const t of tickets) {
      if (!toSet.has(t.from)) {
        return t.from;
      }
    }
    throw new BadRequestException('could not determine start of itinerary');
  }

  public sortTicketsBuildOrderedItinerary(
    start: string,
    fromMap: Map<string, CreateTicketDto>,
    totalTickets: number,
  ): CreateTicketDto[] {
    const ordered: CreateTicketDto[] = [];
    let current = start;

    while (fromMap.has(current)) {
      const tk = fromMap.get(current)!;
      ordered.push(tk);
      current = tk.to;

      if (ordered.length > totalTickets) {
        throw new BadRequestException(
          `Itinerary contains a cycle: the route loops back to a previous location and never reaches a final destination. 
Detected loop starting at '${current}'. 
Ensure that each 'from' and 'to' sequence forms a straight path without repeating locations.`,
        );
      }
    }

    if (ordered.length !== totalTickets) {
      throw new BadRequestException(
        'Incomplete itinerary: some tickets are not sequentially connected.',
      );
    }

    return ordered;
  }

  public sortTickets(tickets: CreateTicketDto[]): CreateTicketDto[] {
    const { fromMap, toSet } = this.sortTicketsValidateAndBuildMaps(tickets);
    const start = this.sortTicketsFindStartPoint(tickets, toSet);
    return this.sortTicketsBuildOrderedItinerary(
      start,
      fromMap,
      tickets.length,
    );
  }

  public humanReadable(itinerary: Itinerary): string {
    if (!itinerary.tickets?.length) return 'No tickets.';

    const tickets = this.humanReadbleSortTickets(itinerary.tickets);
    return this.humanReadbleFormatLines(tickets);
  }

  public humanReadbleSortTickets(tickets: Ticket[]): Ticket[] {
    return [...tickets].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }

  public humanReadbleFormatLines(tickets: Ticket[]): string {
    const lines = ['0. Start.'];

    tickets.forEach((t, i) => {
      lines.push(`${i + 1}. ${this.ticketToText(t)}`);
    });

    lines.push(`${tickets.length + 1}. Last destination reached.`);

    return lines.join('\n');
  }

  public ticketToText(ticket: Ticket): string {
    const details = ticket.details || {};

    const fromStr = ticket.from;
    const toStrWithExtra = this.ticketToTextBuildToStringWithExtra(
      ticket.to,
      details.toExtra,
    );
    const transportLine = this.ticketToTextBuildTransportLine(
      details,
      fromStr,
      toStrWithExtra,
    );
    const extrasLine = this.ticketToTextBuildExtrasLine(details);

    return `${transportLine}${extrasLine}`;
  }

  public ticketToTextBuildToStringWithExtra(
    to: string,
    toExtra?: string,
  ): string {
    return toExtra ? `${to} (${toExtra})` : to;
  }

  public ticketToTextBuildTransportLine(
    details: TicketDetails,
    fromStr: string,
    toStrWithExtra: string,
  ): string {
    const transport = details.transport;
    const code = details.code ? ` - ${details.code}` : '';

    const platform = details.platform ? `Platform ${details.platform}` : '';
    const gate = details.gate ? `Gate ${details.gate}` : '';
    const platformAndGate = [platform, gate].filter(Boolean).join(' - ');

    if (transport) {
      let line = `Board ${transport}${code}`;
      if (platformAndGate) line += `, ${platformAndGate}`;
      line += ` from ${fromStr} to ${toStrWithExtra}.`;
      return line;
    } else {
      return `From ${fromStr}, board the transport to ${toStrWithExtra}.`;
    }
  }

  public ticketToTextBuildExtrasLine(details: TicketDetails): string {
    const seat = details.seat ? `Seat number ${details.seat}` : '';
    const fromExtra = details.extra ? `${details.extra}` : '';
    const others = details.others ? `${details.others}` : '';

    const extrasArr = [seat, fromExtra, others].filter(Boolean);
    return extrasArr.length ? ` ${extrasArr.join(', ')}` : '';
  }
}
