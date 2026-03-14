import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { User } from '@prisma/client';

const mockUser: User = {
  id: 'user-id-1',
  email: 'test@example.com',
  password: 'hashedpassword',
  fullName: 'Test User',
  avatarUrl: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockUsersRepository = {
  create: jest.fn().mockResolvedValue(mockUser),
  findByEmail: jest.fn().mockResolvedValue(mockUser),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: mockUsersRepository },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a user', async () => {
    const result = await service.create({
      email: 'test@example.com',
      password: 'hashedpassword',
      fullName: 'Test User',
    });
    expect(result).toEqual(mockUser);
    expect(mockUsersRepository.create).toHaveBeenCalled();
  });

  it('should find a user by email', async () => {
    const result = await service.findOne('test@example.com');
    expect(result).toEqual(mockUser);
    expect(mockUsersRepository.findByEmail).toHaveBeenCalledWith(
      'test@example.com',
    );
  });
});
