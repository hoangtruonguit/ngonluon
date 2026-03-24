import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RoleName } from '@prisma/client';

@Injectable()
export class AdminUsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly userSelect = {
    id: true,
    email: true,
    fullName: true,
    avatarUrl: true,
    isActive: true,
    createdAt: true,
    roles: { include: { role: true } },
    _count: {
      select: {
        reviews: true,
        comments: true,
        watchHistory: true,
      },
    },
  } as const;

  private readonly userDetailSelect = {
    ...this.userSelect,
    _count: {
      select: {
        reviews: true,
        comments: true,
        watchHistory: true,
        watchlist: true,
      },
    },
  } as const;

  async findMany(params: {
    where: Record<string, unknown>;
    skip: number;
    take: number;
  }) {
    return this.prisma.user.findMany({
      where: params.where,
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: 'desc' },
      select: this.userSelect,
    });
  }

  async count(where: Record<string, unknown>) {
    return this.prisma.user.count({ where });
  }

  async findById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: this.userDetailSelect,
    });
  }

  async findUserExists(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  async findRolesByNames(roles: RoleName[]) {
    return this.prisma.role.findMany({
      where: { name: { in: roles } },
    });
  }

  async replaceUserRoles(userId: string, roleIds: number[]) {
    await this.prisma.$transaction([
      this.prisma.userRole.deleteMany({ where: { userId } }),
      ...roleIds.map((roleId) =>
        this.prisma.userRole.create({
          data: { userId, roleId },
        }),
      ),
    ]);
  }

  async updateActiveStatus(userId: string, isActive: boolean) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });
  }
}
