import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ItineraryService } from './itinerary.service';
import { Itinerary } from './entities/itinerary.entity';
import { Ticket } from './entities/ticket.entity';
import { CreateItineraryDto } from './dto/create-itinerary.dto';
import { CreateTicketDto } from './dto/create-ticket.dto';

describe('ItineraryService', () => {
  let service: ItineraryService;
  let itineraryRepo: jest.Mocked<Repository<Itinerary>>;
  let ticketRepo: jest.Mocked<Repository<Ticket>>;

  const mockItinerary: Itinerary = {
    id: 1,
    name: 'Trip to Wonderland',
    tickets: [],
  } as unknown as Itinerary;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItineraryService,
        {
          provide: getRepositoryToken(Itinerary),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Ticket),
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(ItineraryService);
    itineraryRepo = module.get(getRepositoryToken(Itinerary));
    ticketRepo = module.get(getRepositoryToken(Ticket));
  });

  describe('findAll', () => {
    it('should return list with humanReadable', async () => {
      itineraryRepo.find.mockResolvedValue([mockItinerary]);
      jest.spyOn(service, 'humanReadable').mockReturnValue('Human text');

      const result = await service.findAll();
      expect(result).toEqual([
        { ...mockItinerary, humanReadable: 'Human text' },
      ]);
      expect(itineraryRepo.find).toHaveBeenCalledWith({
        where: {},
        order: { id: 'ASC' },
      });
    });

    it('should return empty array if no itineraries found', async () => {
      itineraryRepo.find.mockResolvedValue([]);
      const result = await service.findAll();
      expect(result).toEqual([]);
      expect(itineraryRepo.find).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return itinerary with humanReadable', async () => {
      itineraryRepo.findOne.mockResolvedValue(mockItinerary);
      jest.spyOn(service, 'humanReadable').mockReturnValue('Readable');

      const result = await service.findById(1);
      expect(result).toEqual({ ...mockItinerary, humanReadable: 'Readable' });
    });

    it('should throw NotFoundException if not found', async () => {
      itineraryRepo.findOne.mockResolvedValue(null);
      await expect(service.findById(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('createAndSort', () => {
    it('should create and save sorted itinerary', async () => {
      const dto: CreateItineraryDto = {
        name: 'My trip',
        tickets: [
          { from: 'A', to: 'B' },
          { from: 'B', to: 'C' },
        ] as CreateTicketDto[],
      };

      jest.spyOn(service, 'sortTickets').mockReturnValue(dto.tickets);
      ticketRepo.create.mockImplementation((t) => t as any);
      itineraryRepo.create.mockReturnValue({} as any);
      itineraryRepo.save.mockResolvedValue({ id: 123 } as any);

      const result = await service.createAndSort(dto);

      expect(service.sortTickets).toHaveBeenCalledWith(dto.tickets);
      expect(ticketRepo.create).toHaveBeenCalledTimes(2);
      expect(itineraryRepo.create).toHaveBeenCalled();
      expect(result).toEqual({ id: 123 });
    });

    it('should throw BadRequestException for invalid ticket sequence', async () => {
      const dto: CreateItineraryDto = {
        name: 'Invalid trip',
        tickets: [
          { from: 'A', to: 'B' },
          { from: 'C', to: 'D' },
        ] as CreateTicketDto[],
      };

      jest.spyOn(service, 'sortTickets').mockImplementation(() => {
        throw new BadRequestException('Incomplete itinerary');
      });

      await expect(service.createAndSort(dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('sortTickets', () => {
    it('should sort tickets correctly', () => {
      const tickets: CreateTicketDto[] = [
        { from: 'B', to: 'C' },
        { from: 'A', to: 'B' },
      ];
      jest.spyOn(service, 'sortTicketsValidateAndBuildMaps').mockReturnValue({
        fromMap: new Map([
          ['B', { from: 'B', to: 'C' } as CreateTicketDto],
          ['A', { from: 'A', to: 'B' } as CreateTicketDto],
        ]),
        toSet: new Set(['C', 'B']),
      });
      jest.spyOn(service, 'sortTicketsFindStartPoint').mockReturnValue('A');
      jest.spyOn(service, 'sortTicketsBuildOrderedItinerary').mockReturnValue([
        { from: 'A', to: 'B' },
        { from: 'B', to: 'C' },
      ]);

      const result = service.sortTickets(tickets);
      expect(result.length).toBe(2);
      expect(result).toEqual([
        { from: 'A', to: 'B' },
        { from: 'B', to: 'C' },
      ]);
    });

    it('should throw if tickets empty', () => {
      expect(() => service.sortTickets([])).toThrow(BadRequestException);
    });

    it('should throw for cyclic itinerary', () => {
      const tickets: CreateTicketDto[] = [
        { from: 'A', to: 'B' },
        { from: 'B', to: 'A' },
      ];
      jest.spyOn(service, 'sortTicketsValidateAndBuildMaps').mockReturnValue({
        fromMap: new Map([
          ['A', { from: 'A', to: 'B' }],
          ['B', { from: 'B', to: 'A' }],
        ]),
        toSet: new Set(['B', 'A']),
      });
      jest.spyOn(service, 'sortTicketsFindStartPoint').mockReturnValue('A');

      expect(() => service.sortTickets(tickets)).toThrow(BadRequestException);
    });
  });

  describe('sortTicketsValidateAndBuildMaps', () => {
    it('should throw for duplicate from locations', () => {
      const tickets: CreateTicketDto[] = [
        { from: 'A', to: 'B' },
        { from: 'A', to: 'C' },
      ];
      expect(() => service.sortTicketsValidateAndBuildMaps(tickets)).toThrow(
        BadRequestException,
      );
    });

    it('should create correct maps for valid tickets', () => {
      const tickets: CreateTicketDto[] = [
        { from: 'A', to: 'B' },
        { from: 'B', to: 'C' },
      ];
      const result = service.sortTicketsValidateAndBuildMaps(tickets);
      expect(result.fromMap.size).toBe(2);
      expect(result.toSet.size).toBe(2);
      expect(result.fromMap.get('A')).toEqual({ from: 'A', to: 'B' });
      expect(result.toSet.has('C')).toBe(true);
    });
  });

  describe('sortTicketsFindStartPoint', () => {
    it('should find correct start point', () => {
      const tickets: CreateTicketDto[] = [
        { from: 'B', to: 'C' },
        { from: 'A', to: 'B' },
      ];
      const toSet = new Set(['B', 'C']);
      const result = service.sortTicketsFindStartPoint(tickets, toSet);
      expect(result).toBe('A');
    });

    it('should throw if no start point found', () => {
      const tickets: CreateTicketDto[] = [
        { from: 'A', to: 'B' },
        { from: 'B', to: 'A' },
      ];
      const toSet = new Set(['A', 'B']);
      expect(() => service.sortTicketsFindStartPoint(tickets, toSet)).toThrow(
        BadRequestException,
      );
    });
  });

  describe('sortTicketsBuildOrderedItinerary', () => {
    it('should build correct ordered itinerary', () => {
      const fromMap = new Map([
        ['A', { from: 'A', to: 'B' }],
        ['B', { from: 'B', to: 'C' }],
      ]);
      const result = service.sortTicketsBuildOrderedItinerary('A', fromMap, 2);
      expect(result).toEqual([
        { from: 'A', to: 'B' },
        { from: 'B', to: 'C' },
      ]);
    });

    it('should throw for incomplete itinerary', () => {
      const fromMap = new Map([['A', { from: 'A', to: 'B' }]]);
      expect(() =>
        service.sortTicketsBuildOrderedItinerary('A', fromMap, 2),
      ).toThrow(BadRequestException);
    });
  });

  describe('humanReadable', () => {
    it('should return formatted string', () => {
      jest
        .spyOn(service, 'humanReadbleSortTickets')
        .mockReturnValue([{ position: 1 } as any]);
      jest.spyOn(service, 'humanReadbleFormatLines').mockReturnValue('Lines');
      const result = service.humanReadable({ tickets: [{} as any] } as any);
      expect(result).toBe('Lines');
    });

    it('should return "No tickets." if none', () => {
      const result = service.humanReadable({ tickets: [] } as any);
      expect(result).toBe('No tickets.');
    });
  });

  describe('humanReadbleSortTickets', () => {
    it('should sort tickets by position', () => {
      const tickets: Ticket[] = [
        { position: 2, from: 'B', to: 'C' } as any,
        { position: 1, from: 'A', to: 'B' } as any,
      ];
      const result = service.humanReadbleSortTickets(tickets);
      expect(result).toEqual([
        { position: 1, from: 'A', to: 'B' },
        { position: 2, from: 'B', to: 'C' },
      ]);
    });

    it('should handle tickets with undefined positions', () => {
      const tickets: Ticket[] = [
        { position: undefined, from: 'A', to: 'B' } as any,
        { position: 1, from: 'B', to: 'C' } as any,
      ];
      const result = service.humanReadbleSortTickets(tickets);
      expect(result[0].position).toBeUndefined();
      expect(result[1].position).toBe(1);
    });
  });

  describe('humanReadbleFormatLines', () => {
    it('should format tickets with full details', () => {
      const tickets: Ticket[] = [
        {
          from: 'A',
          to: 'B',
          position: 1,
          details: {
            transport: 'Train',
            code: 'TR123',
            platform: '5',
            seat: '12A',
            toExtra: 'Central Station',
          },
        } as any,
      ];
      const result = service.humanReadbleFormatLines(tickets);
      expect(result).toContain(
        'Board Train - TR123, Platform 5 from A to B (Central Station). Seat number 12A',
      );
      expect(result).toContain('0. Start.');
      expect(result).toContain('2. Last destination reached.');
    });
  });

  describe('ticketToText', () => {
    it('should format ticket with all details', () => {
      const ticket: Ticket = {
        from: 'A',
        to: 'B',
        details: {
          transport: 'Flight',
          code: 'FL456',
          gate: 'G12',
          seat: '23B',
          toExtra: 'International Airport',
          extra: 'Passport required',
          others: 'Carry-on only',
        },
      } as any;
      const result = service.ticketToText(ticket);
      expect(result).toBe(
        'Board Flight - FL456, Gate G12 from A to B (International Airport). Seat number 23B, Passport required, Carry-on only',
      );
    });

    it('should format ticket with minimal details', () => {
      const ticket: Ticket = {
        from: 'A',
        to: 'B',
        details: {},
      } as any;
      const result = service.ticketToText(ticket);
      expect(result).toBe('From A, board the transport to B.');
    });
  });

  describe('ticketToTextBuildToStringWithExtra', () => {
    it('should include toExtra when provided', () => {
      const result = service.ticketToTextBuildToStringWithExtra('B', 'Airport');
      expect(result).toBe('B (Airport)');
    });

    it('should exclude toExtra when not provided', () => {
      const result = service.ticketToTextBuildToStringWithExtra('B', undefined);
      expect(result).toBe('B');
    });
  });

  describe('ticketToTextBuildTransportLine', () => {
    it('should build transport line with all details', () => {
      const details = {
        transport: 'Bus',
        code: 'B123',
        platform: '3',
        gate: 'G1',
      };
      const result = service.ticketToTextBuildTransportLine(
        details as any,
        'A',
        'B',
      );
      expect(result).toBe(
        'Board Bus - B123, Platform 3 - Gate G1 from A to B.',
      );
    });

    it('should build transport line with minimal details', () => {
      const details = {};
      const result = service.ticketToTextBuildTransportLine(details, 'A', 'B');
      expect(result).toBe('From A, board the transport to B.');
    });
  });

  describe('ticketToTextBuildExtrasLine', () => {
    it('should build extras line with all details', () => {
      const details = {
        seat: '12A',
        extra: 'Window seat',
        others: 'Vegetarian meal',
      };
      const result = service.ticketToTextBuildExtrasLine(details);
      expect(result).toBe(' Seat number 12A, Window seat, Vegetarian meal');
    });

    it('should return empty string for no extras', () => {
      const details = {};
      const result = service.ticketToTextBuildExtrasLine(details);
      expect(result).toBe('');
    });
  });
});
