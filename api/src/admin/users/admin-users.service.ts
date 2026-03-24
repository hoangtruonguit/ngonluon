import { Injectable, NotFoundException } from '@nestjs/common';
import { RoleName } from '@prisma/client';
import { AdminUsersRepository } from './admin-users.repository';
import { ListUsersParams } from './interfaces/admin-users.interfaces';

export type {
  AdminUser,
  AdminUserDetail,
  AdminUserListResponse,
  ListUsersParams,
} from './interfaces/admin-users.interfaces';

@Injectable()
export class AdminUsersService {
  constructor(private readonly repository: AdminUsersRepository) {}

  async listUsers(params: ListUsersParams) {
    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (params.search) {
      where.OR = [
        { email: { contains: params.search, mode: 'insensitive' } },
        { fullName: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.role) {
      where.roles = { some: { role: { name: params.role as RoleName } } };
    }

    const [data, total] = await Promise.all([
      this.repository.findMany({ where, skip, take: limit }),
      this.repository.count(where),
    ]);

    return {
      data: data.map((u) => ({
        ...u,
        roles: u.roles.map((r) => r.role.name),
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getUserDetail(userId: string) {
    const user = await this.repository.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    return {
      ...user,
      roles: user.roles.map((r) => r.role.name),
    };
  }

  async updateUserRoles(userId: string, roles: RoleName[]) {
    const user = await this.repository.findUserExists(userId);
    if (!user) throw new NotFoundException('User not found');

    const roleRecords = await this.repository.findRolesByNames(roles);
    await this.repository.replaceUserRoles(
      userId,
      roleRecords.map((r) => r.id),
    );

    return this.getUserDetail(userId);
  }

  async toggleUserActive(userId: string, isActive: boolean) {
    const user = await this.repository.findUserExists(userId);
    if (!user) throw new NotFoundException('User not found');

    await this.repository.updateActiveStatus(userId, isActive);
    return this.getUserDetail(userId);
  }
}
