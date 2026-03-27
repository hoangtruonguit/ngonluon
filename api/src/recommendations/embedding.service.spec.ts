import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmbeddingService } from './embedding.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  movie: { findUnique: jest.fn(), findMany: jest.fn() },
  $queryRaw: jest.fn(),
  $executeRaw: jest.fn(),
};

const mockConfig = {
  get: jest.fn((key: string) => {
    if (key === 'EMBEDDING_MODEL') return 'Xenova/all-MiniLM-L6-v2';
    if (key === 'EMBEDDING_DIMENSIONS') return 384;
    if (key === 'EMBEDDING_BATCH_SIZE') return 50;
    return undefined;
  }),
};

describe('EmbeddingService', () => {
  let service: EmbeddingService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmbeddingService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<EmbeddingService>(EmbeddingService);
    // Do NOT call onModuleInit — model is not loaded, isReady = false
  });

  // ─── isReady ──────────────────────────────────────────────────────────────

  describe('isReady', () => {
    it('returns false before model is loaded', () => {
      expect(service.isReady).toBe(false);
    });
  });

  // ─── generateMovieText ────────────────────────────────────────────────────

  describe('generateMovieText', () => {
    it('includes title, genres, director, cast, and description', () => {
      const text = service.generateMovieText({
        title: 'Inception',
        description:
          'A thief who steals corporate secrets through dream-sharing technology.',
        genres: [{ genre: { name: 'Sci-Fi' } }, { genre: { name: 'Action' } }],
        cast: [
          { role: 'DIRECTOR', person: { name: 'Christopher Nolan' } },
          { role: 'ACTOR', person: { name: 'Leonardo DiCaprio' } },
          { role: 'ACTOR', person: { name: 'Joseph Gordon-Levitt' } },
        ],
      });

      expect(text).toContain('Title: Inception');
      expect(text).toContain('Genres: Sci-Fi, Action');
      expect(text).toContain('Director: Christopher Nolan');
      expect(text).toContain('Cast: Leonardo DiCaprio, Joseph Gordon-Levitt');
      expect(text).toContain('Description: A thief who steals');
    });

    it('works with minimal data (title only)', () => {
      const text = service.generateMovieText({ title: 'Unknown Movie' });
      expect(text).toBe('Title: Unknown Movie.');
    });

    it('omits missing fields gracefully', () => {
      const text = service.generateMovieText({
        title: 'No Cast Movie',
        genres: [{ genre: { name: 'Drama' } }],
      });
      expect(text).toContain('Genres: Drama');
      expect(text).not.toContain('Director:');
      expect(text).not.toContain('Cast:');
      expect(text).not.toContain('Description:');
    });

    it('truncates description to 200 chars', () => {
      const longDesc = 'A'.repeat(300);
      const text = service.generateMovieText({
        title: 'Long Movie',
        description: longDesc,
      });
      // Description part should be truncated
      expect(text).toContain('Description: ' + 'A'.repeat(200));
      expect(text).not.toContain('A'.repeat(201));
    });

    it('includes only up to 5 actors', () => {
      const text = service.generateMovieText({
        title: 'Big Cast Movie',
        cast: Array.from({ length: 8 }, (_, i) => ({
          role: 'ACTOR',
          person: { name: `Actor ${i + 1}` },
        })),
      });
      expect(text).toContain('Actor 5');
      expect(text).not.toContain('Actor 6');
    });

    it('separates directors from actors correctly', () => {
      const text = service.generateMovieText({
        title: 'Movie',
        cast: [
          { role: 'DIRECTOR', person: { name: 'Dir One' } },
          { role: 'ACTOR', person: { name: 'Actor One' } },
          { role: 'ACTOR', person: { name: 'Actor Two' } },
        ],
      });
      expect(text).toContain('Director: Dir One');
      expect(text).toContain('Cast: Actor One, Actor Two');
      expect(text).not.toContain('Cast: Dir One');
    });
  });

  // ─── embedText / embedMany ────────────────────────────────────────────────

  describe('embedText', () => {
    it('throws when model is not loaded', async () => {
      await expect(service.embedText('test text')).rejects.toThrow(
        'Embedding model not loaded',
      );
    });
  });

  describe('embedMany', () => {
    it('throws when model is not loaded', async () => {
      await expect(service.embedMany(['text 1', 'text 2'])).rejects.toThrow(
        'Embedding model not loaded',
      );
    });
  });
});
