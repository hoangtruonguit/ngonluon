import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  @Expose()
  email: string;

  @ApiProperty({ example: 'John Doe' })
  @Expose()
  fullName: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg' })
  @Expose()
  avatarUrl?: string;
}

export class AuthResponseDto {
  @ApiProperty()
  @Expose()
  user: UserResponseDto;

  @ApiProperty()
  @Expose()
  accessToken: string;

  @ApiProperty()
  @Expose()
  refreshToken: string;

  @ApiProperty()
  @Expose()
  expiresIn: number;
}
