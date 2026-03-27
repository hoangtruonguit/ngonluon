import { Test, TestingModule } from '@nestjs/testing';
import { WatchlistService } from './watchlist.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

const mockMovie = { id: 'movie-1', title: 'Test Movie' };

const mockWatchlistEntry = {
  id: 'wl-1',
  userId: 'user-1',
  movieId: 'movie-1',
  createdAt: new Date(),
  movie: mockMovie,
};

const mockPrismaService = {
  movie: {
    findUnique: jest.fn(),
  },
  watchlist: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
  },
};

describe('WatchlistService', () => {
  let service: WatchlistService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WatchlistService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
      ],
    }).compile();

    service = module.get<WatchlistService>(WatchlistService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addToWatchlist()', () => {
    it('should add movie to watchlist', async () => {
      mockPrismaService.movie.findUnique.mockResolvedValue(mockMovie);
      mockPrismaService.watchlist.create.mockResolvedValue(mockWatchlistEntry);

      const result = await service.addToWatchlist('user-1', 'movie-1');

      expect(result).toEqual(mockWatchlistEntry);
      expect(mockPrismaService.watchlist.create).toHaveBeenCalledWith({
        data: { userId: 'user-1', movieId: 'movie-1' },
        include: { movie: true },
      });
    });

    it('should throw NotFoundException when movie does not exist', async () => {
      mockPrismaService.movie.findUnique.mockResolvedValue(null);

      await expect(
        service.addToWatchlist('user-1', 'bad-movie'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException on duplicate (P2002)', async () => {
      mockPrismaService.movie.findUnique.mockResolvedValue(mockMovie);
      mockPrismaService.watchlist.create.mockRejectedValue({ code: 'P2002' });

      await expect(service.addToWatchlist('user-1', 'movie-1')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('removeFromWatchlist()', () => {
    it('should remove movie from watchlist', async () => {
      mockPrismaService.watchlist.findUnique.mockResolvedValue(
        mockWatchlistEntry,
      );
      mockPrismaService.watchlist.delete.mockResolvedValue(mockWatchlistEntry);

      const result = await service.removeFromWatchlist('user-1', 'movie-1');

      expect(result).toEqual(mockWatchlistEntry);
      expect(mockPrismaService.watchlist.findUnique).toHaveBeenCalledWith({
        where: { userId_movieId: { userId: 'user-1', movieId: 'movie-1' } },
      });
      expect(mockPrismaService.watchlist.delete).toHaveBeenCalledWith({
        where: { id: 'wl-1' },
      });
    });

    it('should throw NotFoundException when entry not found', async () => {
      mockPrismaService.watchlist.findUnique.mockResolvedValue(null);

      await expect(
        service.removeFromWatchlist('user-1', 'movie-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStatus()', () => {
    it('should return isInWatchlist true when entry exists', async () => {
      mockPrismaService.watchlist.findUnique.mockResolvedValue(
        mockWatchlistEntry,
      );

      const result = await service.getStatus('user-1', 'movie-1');

      expect(result).toEqual({ isInWatchlist: true });
    });

    it('should return isInWatchlist false when entry does not exist', async () => {
      mockPrismaService.watchlist.findUnique.mockResolvedValue(null);

      const result = await service.getStatus('user-1', 'movie-1');

      expect(result).toEqual({ isInWatchlist: false });
    });
  });

  describe('getWatchlist()', () => {
    it('should return watchlist entries with movie includes', async () => {
      mockPrismaService.watchlist.findMany.mockResolvedValue([
        mockWatchlistEntry,
      ]);

      const result = await service.getWatchlist('user-1');

      expect(result).toHaveLength(1);
      expect(mockPrismaService.watchlist.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: {
          movie: { include: { genres: { include: { genre: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });
});
