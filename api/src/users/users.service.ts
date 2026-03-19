import { Injectable, Logger } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { Prisma, User } from '@prisma/client';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly usersRepository: UsersRepository) {}

  async create(data: Prisma.UserCreateInput): Promise<User> {
    const user = await this.usersRepository.create(data);
    this.logger.log(`User created: ${data.email}`);
    return user;
  }

  async findOne(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findById(id);
  }

  async updatePublicKey(id: string, publicKey: string): Promise<void> {
    await this.usersRepository.updatePublicKey(id, publicKey);
  }

  async updateRefreshToken(
    id: string,
    refreshToken: string | null,
  ): Promise<void> {
    await this.usersRepository.updateRefreshToken(id, refreshToken);
  }

  async updateProfile(id: string, data: UpdateProfileDto): Promise<User> {
    return this.usersRepository.update(id, data);
  }
}
