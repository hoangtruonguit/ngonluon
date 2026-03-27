/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { WatchHistoryService } from './watch-history.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

const mockHistoryEntry = {
  id: 'wh-1',
  userId: 'user-1',
  movieId: 'movie-1',
  episodeId: null,
  progressSeconds: 300,
  isFinished: false,
  lastWatchedAt: new Date(),
  createdAt: new Date(),
};

const mockPrismaService = {
  watchHistory: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
  },
};

describe('WatchHistoryService', () => {
  let service: WatchHistoryService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WatchHistoryService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
      ],
    }).compile();

    service = module.get<WatchHistoryService>(WatchHistoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('saveProgress()', () => {
    const dto = {
      movieId: 'movie-1',
      progressSeconds: 600,
      isFinished: false,
    };

    it('should create new entry when no existing record', async () => {
      mockPrismaService.watchHistory.findFirst.mockResolvedValue(null);
      mockPrismaService.watchHistory.create.mockResolvedValue({
        ...mockHistoryEntry,
        progressSeconds: 600,
      });

      const result = (await service.saveProgress('user-1', dto)) as {
        progressSeconds: number;
      };

      expect(result.progressSeconds).toBe(600);
      expect(mockPrismaService.watchHistory.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          movieId: 'movie-1',
          episodeId: null,
          progressSeconds: 600,
          isFinished: false,
        },
      });
    });

    it('should update existing entry', async () => {
      mockPrismaService.watchHistory.findFirst.mockResolvedValue(
        mockHistoryEntry,
      );
      mockPrismaService.watchHistory.update.mockResolvedValue({
        ...mockHistoryEntry,
        progressSeconds: 600,
      });

      const result = (await service.saveProgress('user-1', dto)) as {
        progressSeconds: number;
      };

      expect(result.progressSeconds).toBe(600);
      expect(mockPrismaService.watchHistory.update).toHaveBeenCalledWith({
        where: { id: 'wh-1' },
        data: {
          progressSeconds: 600,
          isFinished: false,
          lastWatchedAt: expect.any(Date),
        },
      });
    });

    it('should handle episodeId correctly', async () => {
      const dtoWithEpisode = { ...dto, episodeId: 'ep-1' };
      mockPrismaService.watchHistory.findFirst.mockResolvedValue(null);
      mockPrismaService.watchHistory.create.mockResolvedValue({
        ...mockHistoryEntry,
        episodeId: 'ep-1',
      });

      await service.saveProgress('user-1', dtoWithEpisode);

      expect(mockPrismaService.watchHistory.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user-1', movieId: 'movie-1', episodeId: 'ep-1' },
      });
      expect(mockPrismaService.watchHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ episodeId: 'ep-1' }),
      });
    });
  });

  describe('getProgress()', () => {
    it('should return progress when found', async () => {
      mockPrismaService.watchHistory.findFirst.mockResolvedValue(
        mockHistoryEntry,
      );

      const result = await service.getProgress('user-1', 'movie-1');

      expect(result).toEqual(mockHistoryEntry);
      expect(mockPrismaService.watchHistory.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user-1', movieId: 'movie-1', episodeId: null },
        orderBy: { lastWatchedAt: 'desc' },
      });
    });

    it('should return null when not found', async () => {
      mockPrismaService.watchHistory.findFirst.mockResolvedValue(null);

      const result = await service.getProgress('user-1', 'movie-1');

      expect(result).toBeNull();
    });

    it('should query with episodeId when provided', async () => {
      mockPrismaService.watchHistory.findFirst.mockResolvedValue(null);

      await service.getProgress('user-1', 'movie-1', 'ep-1');

      expect(mockPrismaService.watchHistory.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user-1', movieId: 'movie-1', episodeId: 'ep-1' },
        orderBy: { lastWatchedAt: 'desc' },
      });
    });
  });

  describe('getHistory()', () => {
    it('should return paginated history with includes', async () => {
      mockPrismaService.watchHistory.findMany.mockResolvedValue([
        mockHistoryEntry,
      ]);

      const result = await service.getHistory('user-1', 10);

      expect(result).toHaveLength(1);
      expect(mockPrismaService.watchHistory.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: {
          movie: {
            select: {
              id: true,
              title: true,
              slug: true,
              posterUrl: true,
              durationMinutes: true,
            },
          },
          episode: true,
        },
        orderBy: { lastWatchedAt: 'desc' },
        take: 10,
      });
    });
  });

  describe('clearHistory()', () => {
    it('should delete all history for user', async () => {
      mockPrismaService.watchHistory.deleteMany.mockResolvedValue({ count: 5 });

      const result = await service.clearHistory('user-1');

      expect(result).toEqual({ count: 5 });
      expect(mockPrismaService.watchHistory.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });
  });
});
