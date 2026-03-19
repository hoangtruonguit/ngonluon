/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../redis/redis.service';
import { ConfigService } from '@nestjs/config';
import { MailProducer } from '../mail/mail.producer';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('$2b$10$hashed'),
  compare: jest.fn(),
}));

jest.mock('crypto', () => {
  const actual = jest.requireActual('crypto');
  return {
    ...actual,
    generateKeyPairSync: jest.fn().mockReturnValue({
      publicKey: 'mock-public-key-pem',
      privateKey: 'mock-private-key-pem',
    }),
  };
});

import * as bcrypt from 'bcrypt';

const mockUser = {
  id: 'user-id-1',
  email: 'test@example.com',
  password: '$2b$10$existinghash',
  fullName: 'Test User',
  avatarUrl: null,
  isActive: true,
  refreshToken: '$2b$10$hashedRefreshToken',
  publicKey: 'mock-public-key',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockUsersService = {
  findOne: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  updatePublicKey: jest.fn().mockResolvedValue(undefined),
  updateRefreshToken: jest.fn().mockResolvedValue(undefined),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
  verify: jest.fn(),
};

const mockRedisService = {
  set: jest.fn().mockResolvedValue(undefined),
  get: jest.fn(),
  del: jest.fn(),
};

const mockConfigService = {
  get: jest.fn().mockReturnValue('mock_secret'),
};

const mockMailProducer = {
  sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
  sendResetPasswordEmail: jest.fn().mockResolvedValue(undefined),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: MailProducer, useValue: mockMailProducer },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register()', () => {
    const registerDto = {
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      fullName: 'Test User',
      termsAccepted: true,
    };

    it('should register a new user successfully', async () => {
      mockUsersService.findOne.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(mockUser);

      const result = await service.register(registerDto);

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        fullName: mockUser.fullName,
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockUsersService.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: '$2b$10$hashed',
        fullName: 'Test User',
      });
      expect(mockMailProducer.sendWelcomeEmail).toHaveBeenCalledWith(
        'test@example.com',
        'Test User',
      );
    });

    it('should throw BadRequestException when passwords do not match', async () => {
      await expect(
        service.register({ ...registerDto, confirmPassword: 'different' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when terms not accepted', async () => {
      await expect(
        service.register({ ...registerDto, termsAccepted: false }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when user already exists', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('login()', () => {
    const loginDto = { email: 'test@example.com', password: 'password123' };

    it('should login successfully and return tokens', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(result).toBeDefined();
      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
      expect(mockRedisService.set).toHaveBeenCalledWith(
        `user:${mockUser.id}:public_key`,
        'mock-public-key-pem',
        3600,
      );
      expect(mockUsersService.updatePublicKey).toHaveBeenCalledWith(
        mockUser.id,
        'mock-public-key-pem',
      );
      expect(mockUsersService.updateRefreshToken).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockUsersService.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when password is wrong', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refresh()', () => {
    it('should refresh tokens successfully', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 'user-id-1' });
      mockUsersService.findById.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.refresh('valid-refresh-token');

      expect(result).toBeDefined();
      expect(mockJwtService.verify).toHaveBeenCalled();
      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
      expect(mockRedisService.set).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when verify fails', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refresh('bad-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException on token reuse', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 'user-id-1' });
      mockUsersService.findById.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.refresh('reused-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 'user-id-1' });
      mockUsersService.findById.mockResolvedValue(null);

      await expect(service.refresh('token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('getMe()', () => {
    it('should return user profile', async () => {
      mockUsersService.findById.mockResolvedValue(mockUser);

      const result = await service.getMe('user-id-1');

      expect(result).toBeDefined();
      expect(mockUsersService.findById).toHaveBeenCalledWith('user-id-1');
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockUsersService.findById.mockResolvedValue(null);

      await expect(service.getMe('non-existent')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
