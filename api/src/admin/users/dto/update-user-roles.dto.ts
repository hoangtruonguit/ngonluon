import { IsArray, IsEnum } from 'class-validator';
import { RoleName } from '@prisma/client';

export class UpdateUserRolesDto {
  @IsArray()
  @IsEnum(RoleName, { each: true })
  roles: RoleName[];
}
