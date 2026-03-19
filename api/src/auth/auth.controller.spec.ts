import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

const mockAuthResult = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  expiresIn: 3600,
  user: {
    id: 'user-id-1',
    email: 'test@example.com',
    fullName: 'Test User',
    avatarUrl: null,
  },
};

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  refresh: jest.fn(),
  getMe: jest.fn(),
};

const mockConfigService = {
  get: jest.fn().mockReturnValue('development'),
};

describe('AuthController', () => {
  let controller: AuthController;
  let mockResponse: Partial<Response>;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockResponse = {
      cookie: jest.fn() as unknown as Response['cookie'],
      clearCookie: jest.fn() as unknown as Response['clearCookie'],
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register()', () => {
    it('should delegate to authService.register', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        fullName: 'Test User',
        termsAccepted: true,
      };
      const expected = {
        id: 'user-id-1',
        email: 'test@example.com',
        fullName: 'Test User',
      };
      mockAuthService.register.mockResolvedValue(expected);

      const result = await controller.register(registerDto);

      expect(result).toEqual(expected);
      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('login()', () => {
    it('should login and set 3 cookies', async () => {
      mockAuthService.login.mockResolvedValue(mockAuthResult);
      const loginDto = { email: 'test@example.com', password: 'password123' };

      const result = await controller.login(loginDto, mockResponse as Response);

      expect(result).toEqual(mockAuthResult);
      expect(mockResponse.cookie).toHaveBeenCalledTimes(3);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'access_token',
        'mock-access-token',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
        }),
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refresh_token',
        'mock-refresh-token',
        expect.objectContaining({ httpOnly: true }),
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'is_logged_in',
        'true',
        expect.objectContaining({ httpOnly: false }),
      );
    });
  });

  describe('refresh()', () => {
    it('should refresh tokens and set 3 cookies', async () => {
      mockAuthService.refresh.mockResolvedValue(mockAuthResult);

      const result = await controller.refresh(
        { refreshToken: 'old-token' },
        mockResponse as Response,
      );

      expect(result).toEqual(mockAuthResult);
      expect(mockAuthService.refresh).toHaveBeenCalledWith('old-token');
      expect(mockResponse.cookie).toHaveBeenCalledTimes(3);
    });
  });

  describe('getMe()', () => {
    it('should call authService.getMe with userId', async () => {
      const userProfile = {
        id: 'user-id-1',
        email: 'test@example.com',
        fullName: 'Test User',
      };
      mockAuthService.getMe.mockResolvedValue(userProfile);

      const result = await controller.getMe({
        userId: 'user-id-1',
        email: 'test@example.com',
      });

      expect(result).toEqual(userProfile);
      expect(mockAuthService.getMe).toHaveBeenCalledWith('user-id-1');
    });
  });

  describe('logout()', () => {
    it('should clear 3 cookies and return message', () => {
      const result = controller.logout(mockResponse as Response);

      expect(result).toEqual({ message: 'Signed out' });
      expect(mockResponse.clearCookie).toHaveBeenCalledTimes(3);
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('access_token', {
        path: '/',
      });
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('refresh_token', {
        path: '/',
      });
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('is_logged_in', {
        path: '/',
      });
    });
  });
});
