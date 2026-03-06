import { Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { Prisma, User } from '@prisma/client';

@Injectable()
export class UsersService {
    constructor(private readonly usersRepository: UsersRepository) { }

    async create(data: Prisma.UserCreateInput): Promise<User> {
        return this.usersRepository.create(data);
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

    async updateRefreshToken(id: string, refreshToken: string | null): Promise<void> {
        await this.usersRepository.updateRefreshToken(id, refreshToken);
    }
}
