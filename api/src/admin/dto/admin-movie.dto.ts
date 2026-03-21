import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsIn,
  Min,
  Max,
} from 'class-validator';

export class CreateMovieDto {
  @ApiProperty({ example: 'Inception' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'A mind-bending thriller' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'https://image.tmdb.org/t/p/w780/poster.jpg',
  })
  @IsOptional()
  @IsString()
  posterUrl?: string;

  @ApiPropertyOptional({
    example: 'https://image.tmdb.org/t/p/w1280/backdrop.jpg',
  })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ example: 2010 })
  @IsOptional()
  @IsNumber()
  releaseYear?: number;

  @ApiPropertyOptional({ example: 8.8 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  rating?: number;

  @ApiPropertyOptional({ example: 148 })
  @IsOptional()
  @IsNumber()
  durationMinutes?: number;

  @ApiPropertyOptional({ example: 'https://youtube.com/embed/xxx' })
  @IsOptional()
  @IsString()
  trailerUrl?: string;

  @ApiProperty({ example: 'MOVIE', enum: ['MOVIE', 'SERIES'] })
  @IsIn(['MOVIE', 'SERIES'])
  type: 'MOVIE' | 'SERIES';
}

export class UpdateMovieDto {
  @ApiPropertyOptional({ example: 'Inception' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'A mind-bending thriller' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'https://image.tmdb.org/t/p/w780/poster.jpg',
  })
  @IsOptional()
  @IsString()
  posterUrl?: string;

  @ApiPropertyOptional({
    example: 'https://image.tmdb.org/t/p/w1280/backdrop.jpg',
  })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ example: 2010 })
  @IsOptional()
  @IsNumber()
  releaseYear?: number;

  @ApiPropertyOptional({ example: 8.8 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  rating?: number;

  @ApiPropertyOptional({ example: 148 })
  @IsOptional()
  @IsNumber()
  durationMinutes?: number;

  @ApiPropertyOptional({ example: 'https://youtube.com/embed/xxx' })
  @IsOptional()
  @IsString()
  trailerUrl?: string;
}
