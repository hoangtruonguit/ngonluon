import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminUsersService } from './admin-users.service';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { UpdateUserRolesDto } from './dto/update-user-roles.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

@ApiTags('Admin - Users')
@ApiBearerAuth()
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminUsersController {
  constructor(
    private readonly adminUsersService: AdminUsersService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  @Get()
  listUsers(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('search') search?: string,
    @Query('role') role?: string,
  ) {
    return this.adminUsersService.listUsers({
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20,
      search,
      role,
    });
  }

  @Get(':id')
  getUserDetail(@Param('id') id: string) {
    return this.adminUsersService.getUserDetail(id);
  }

  @Patch(':id/roles')
  updateUserRoles(@Param('id') id: string, @Body() dto: UpdateUserRolesDto) {
    return this.adminUsersService.updateUserRoles(id, dto.roles);
  }

  @Patch(':id/status')
  toggleUserStatus(@Param('id') id: string, @Body() dto: UpdateUserStatusDto) {
    return this.adminUsersService.toggleUserActive(id, dto.isActive);
  }

  @Post(':id/grant-subscription')
  grantSubscription(@Param('id') id: string) {
    return this.subscriptionsService.grantComplimentary(id);
  }
}
