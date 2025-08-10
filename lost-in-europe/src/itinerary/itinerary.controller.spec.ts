import { Test, TestingModule } from '@nestjs/testing';
import { ItineraryController } from './itinerary.controller';
import { ItineraryService } from './itinerary.service';
import { Itinerary } from './entities/itinerary.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('ItineraryController', () => {
  let controller: ItineraryController;
  let service: jest.Mocked<ItineraryService>;

  const baseTimestamps = {
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: undefined,
  };

  const mockItinerary: Itinerary & { humanReadable: string } = {
    id: 1,
    name: undefined,
    tickets: [],
    ...baseTimestamps,
    humanReadable: 'Mock itinerary',
  };

  const mockItineraries: (Itinerary & { humanReadable: string })[] = [
    {
      id: 1,
      name: undefined,
      tickets: [],
      ...baseTimestamps,
      humanReadable: 'Itinerary 1',
    },
    {
      id: 2,
      name: undefined,
      tickets: [],
      ...baseTimestamps,
      humanReadable: 'Itinerary 2',
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ItineraryController],
      providers: [
        {
          provide: ItineraryService,
          useValue: {
            createAndSort: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ItineraryController>(ItineraryController);
    service = module.get(ItineraryService) as jest.Mocked<ItineraryService>;
  });

  describe('create', () => {
    it('should create and sort itinerary', async () => {
      const mockResult: Itinerary = {
        id: 1,
        name: 'Trip',
        tickets: [
          {
            id: 1,
            from: 'Street 01',
            to: 'Street 02',
            details: { seat: '12A', gate: 'A1' },
            position: 1,
            itinerary: {} as Itinerary,
            ...baseTimestamps,
          },
        ],
        ...baseTimestamps,
      };

      service.createAndSort.mockResolvedValue(mockResult);

      const result = await controller.create({
        name: 'Trip',
        tickets: [{ from: 'Street 01', to: 'Street 02' } as CreateTicketDto],
      });

      expect(result).toEqual(mockResult);
      expect(service.createAndSort).toHaveBeenCalledWith({
        name: 'Trip',
        tickets: [{ from: 'Street 01', to: 'Street 02' }],
      });
    });

    it('should throw BadRequestException for empty tickets array', async () => {
      service.createAndSort.mockRejectedValue(
        new BadRequestException('tickets must contain at least 1 elements'),
      );

      await expect(controller.create({ tickets: [] })).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.create({ tickets: [] })).rejects.toMatchObject({
        message: 'tickets must contain at least 1 elements',
      });
    });

    it('should throw BadRequestException for missing "from" field', async () => {
      service.createAndSort.mockRejectedValue(
        new BadRequestException('tickets[0].from should not be empty'),
      );

      await expect(
        controller.create({
          tickets: [{ to: 'Street 02' } as CreateTicketDto],
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.create({
          tickets: [{ to: 'Street 02' } as CreateTicketDto],
        }),
      ).rejects.toMatchObject({
        message: 'tickets[0].from should not be empty',
      });
    });

    it('should throw BadRequestException for missing "to" field', async () => {
      service.createAndSort.mockRejectedValue(
        new BadRequestException('tickets.0.to must be a string'),
      );

      await expect(
        controller.create({
          tickets: [{ from: 'Street 01' } as CreateTicketDto],
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.create({
          tickets: [{ from: 'Street 01' } as CreateTicketDto],
        }),
      ).rejects.toMatchObject({
        message: 'tickets.0.to must be a string',
      });
    });

    it('should throw BadRequestException for non-sequential tickets', async () => {
      service.createAndSort.mockRejectedValue(
        new BadRequestException(
          'Incomplete itinerary: some tickets are not sequentially connected.',
        ),
      );

      await expect(
        controller.create({
          tickets: [
            { from: 'Street 01', to: 'Street 02' },
            { from: 'Street 03', to: 'Street 04' },
          ] as CreateTicketDto[],
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.create({
          tickets: [
            { from: 'Street 01', to: 'Street 02' },
            { from: 'Street 03', to: 'Street 04' },
          ] as CreateTicketDto[],
        }),
      ).rejects.toMatchObject({
        message:
          'Incomplete itinerary: some tickets are not sequentially connected.',
      });
    });

    it('should throw BadRequestException for cyclic itinerary', async () => {
      service.createAndSort.mockRejectedValue(
        new BadRequestException(
          "Itinerary contains a cycle: the route loops back to a previous location and never reaches a final destination. \nDetected loop starting at 'Street 01'.",
        ),
      );

      await expect(
        controller.create({
          tickets: [
            { from: 'Street 01', to: 'Street 02' },
            { from: 'Street 02', to: 'Street 01' },
          ] as CreateTicketDto[],
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.create({
          tickets: [
            { from: 'Street 01', to: 'Street 02' },
            { from: 'Street 02', to: 'Street 01' },
          ] as CreateTicketDto[],
        }),
      ).rejects.toMatchObject({
        message:
          "Itinerary contains a cycle: the route loops back to a previous location and never reaches a final destination. \nDetected loop starting at 'Street 01'.",
      });
    });
  });

  describe('findAll', () => {
    it('should return all itineraries', async () => {
      service.findAll.mockResolvedValue(mockItineraries);

      const result = await controller.findAll();

      expect(result).toEqual(mockItineraries);
      expect(service.findAll).toHaveBeenCalled();
    });

    it('should return empty array when no itineraries exist', async () => {
      service.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return an itinerary by id', async () => {
      service.findById.mockResolvedValue(mockItinerary);

      const result = await controller.findOne(1);

      expect(result).toEqual(mockItinerary);
      expect(service.findById).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when itinerary is not found', async () => {
      service.findById.mockRejectedValue(
        new NotFoundException('Itinerary with id [1234] not found'),
      );

      await expect(controller.findOne(1234)).rejects.toThrow(NotFoundException);
      await expect(controller.findOne(1234)).rejects.toMatchObject({
        message: 'Itinerary with id [1234] not found',
      });
      expect(service.findById).toHaveBeenCalledWith(1234);
    });
  });
});
