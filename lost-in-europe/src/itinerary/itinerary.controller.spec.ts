import { Test, TestingModule } from '@nestjs/testing';
import { ItineraryController } from './itinerary.controller';
import { ItineraryService } from './itinerary.service';
import { Itinerary } from './entities/itinerary.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';

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
    });
  });

  describe('findAll', () => {
    it('should return all itineraries', async () => {
      service.findAll.mockResolvedValue(mockItineraries);

      const result = await controller.findAll();

      expect(result).toEqual(mockItineraries);
    });
  });

  describe('findOne', () => {
    it('should return an itinerary by id', async () => {
      service.findById.mockResolvedValue(mockItinerary);

      const result = await controller.findOne(1);

      expect(result).toEqual(mockItinerary);
    });
  });
});
