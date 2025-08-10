import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { ItineraryService } from './itinerary.service';
import { CreateItineraryDto } from './dto/create-itinerary.dto';
import { Itinerary } from './entities/itinerary.entity';

const NotFoundSchema = {
  type: 'object',
  properties: {
    statusCode: { type: 'number', example: 404 },
    message: { type: 'string', example: 'Itinerary with id [1234] not found' },
    error: { type: 'string', example: 'Not Found' },
  },
};

const InternalServerErrorSchema = {
  type: 'object',
  properties: {
    statusCode: { type: 'number', example: 500 },
    message: { type: 'string', example: 'Internal server error' },
    error: { type: 'string', example: 'Internal Server Error' },
  },
};

@ApiTags('Itineraries')
@Controller('itinerary')
export class ItineraryController {
  constructor(private readonly itineraryService: ItineraryService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new itinerary',
    description:
      'Creates an itinerary with sorted tickets based on the provided data.',
  })
  @ApiBody({
    type: CreateItineraryDto,
    schema: {
      type: 'object',
      properties: {
        tickets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              from: { type: 'string' },
              to: { type: 'string' },
              details: {
                type: 'object',
                properties: {
                  transport: { type: 'string' },
                  code: { type: 'string' },
                  platform: { type: 'string' },
                  gate: { type: 'string' },
                  seat: { type: 'string' },
                  extra: { type: 'string' },
                  toExtra: { type: 'string' },
                  others: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    examples: {
      complete: {
        summary: 'Complete itinerary with multiple tickets',
        value: {
          tickets: [
            {
              from: 'Street 01',
              to: 'Street 02',
              details: {
                transport: 'train',
                code: 'RJX765',
                platform: '3',
                gate: 'A',
                seat: '17C',
                extra: 'Extra info from location',
                toExtra: 'Extra info to location',
              },
            },
            {
              from: 'Street 02',
              to: 'Street 03',
            },
          ],
        },
      },
      simple: {
        summary: 'Simple itinerary with minimal tickets',
        value: {
          tickets: [
            { from: 'Street 01', to: 'Street 02' },
            { from: 'Street 02', to: 'Street 03' },
          ],
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Itinerary created successfully',
    type: CreateItineraryDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
    examples: {
      noTickets: {
        summary: 'No tickets provided',
        value: {
          message: [
            'tickets must contain at least 1 elements',
            'tickets must be an array',
          ],
          error: 'Bad Request',
          statusCode: 400,
        },
      },
      emptyTickets: {
        summary: 'Empty tickets array',
        value: {
          message: ['tickets must contain at least 1 elements'],
          error: 'Bad Request',
          statusCode: 400,
        },
      },
      missingFrom: {
        summary: 'Missing "from" field',
        value: {
          message: ['tickets[0].from should not be empty'],
          error: 'Bad Request',
          statusCode: 400,
        },
      },
      missingTo: {
        summary: 'Missing "to" field',
        value: {
          message: ['tickets.0.to must be a string'],
          error: 'Bad Request',
          statusCode: 400,
        },
      },
      notSequential: {
        summary: 'Tickets are not sequential',
        value: {
          message:
            'Incomplete itinerary: some tickets are not sequentially connected.',
          error: 'Bad Request',
          statusCode: 400,
        },
      },
      missingUniqueFrom: {
        summary: 'Missing unique "from" field',
        value: {
          message: "duplicate 'from' detected: Street 03 (expects unique from)",
          error: 'Bad Request',
          statusCode: 400,
        },
      },
      missingUniqueTo: {
        summary: 'Missing unique "to" field',
        value: {
          message:
            "Itinerary contains a cycle: the route loops back to a previous location and never reaches a final destination. \nDetected loop starting at 'Street 10'. \nEnsure that each 'from' and 'to' sequence forms a straight path without repeating locations.",
          error: 'Bad Request',
          statusCode: 400,
        },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
    schema: InternalServerErrorSchema,
  })
  async create(@Body() dto: CreateItineraryDto) {
    return await this.itineraryService.createAndSort(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Retrieve all itineraries',
    description:
      'Returns a list of all itineraries with their tickets and human-readable descriptions.',
  })
  @ApiOkResponse({
    description: 'List of itineraries',
    type: Itinerary,
    isArray: true,
    schema: {
      example: [
        {
          id: 1,
          name: null,
          tickets: [
            {
              id: 1,
              from: 'Street 01',
              to: 'Street 02',
              details: null,
              position: 1,
              createdAt: '2025-08-10T12:24:42.508Z',
              updatedAt: '2025-08-10T12:24:42.508Z',
              deletedAt: null,
            },
          ],
          createdAt: '2025-08-10T12:24:42.508Z',
          updatedAt: '2025-08-10T12:24:42.508Z',
          deletedAt: null,
          humanReadable:
            '0. Start.\n1. From Street 01, board the transport to Street 02.\n2. Last destination reached.',
        },
      ],
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
    schema: InternalServerErrorSchema,
  })
  findAll() {
    return this.itineraryService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Retrieve a single itinerary by ID',
    description:
      'Returns an itinerary with the specified ID, including its tickets and human-readable description.',
  })
  @ApiOkResponse({
    description: 'Itinerary found',
    type: Itinerary,
    schema: {
      example: {
        id: 9,
        name: null,
        tickets: [
          {
            id: 104,
            from: 'Street 01',
            to: 'Street 02',
            details: {
              transport: 'train',
              code: 'RJX765',
              platform: '3',
              gate: 'A',
              seat: '17C',
              extra: 'Extra info from location',
              toExtra: 'Extra info to location',
            },
            position: 1,
            createdAt: '2025-08-10T16:25:30.006Z',
            updatedAt: '2025-08-10T16:25:30.006Z',
            deletedAt: null,
          },
        ],
        createdAt: '2025-08-10T16:25:30.006Z',
        updatedAt: '2025-08-10T16:25:30.006Z',
        deletedAt: null,
        humanReadable:
          '0. Start.\n1. Board train - RJX765, Platform 3 - Gate A from Street 01 to Street 02 (Extra info to location). Seat number 17C, Extra info from location\n2. Last destination reached.',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Itinerary not found',
    schema: NotFoundSchema,
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
    schema: InternalServerErrorSchema,
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.itineraryService.findById(id);
  }
}
