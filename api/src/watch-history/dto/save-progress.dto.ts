import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SaveProgressDto {
  @ApiProperty({ example: 'uuid-movie-123' })
  @IsString()
  movieId: string;

  @ApiPropertyOptional({ example: 'uuid-episode-123' })
  @IsOptional()
  @IsString()
  episodeId?: string;

  @ApiProperty({ example: 125.5 })
  @IsNumber()
  @Min(0)
  progressSeconds: number;

  @ApiProperty({ example: false })
  @IsBoolean()
  isFinished: boolean;
}
