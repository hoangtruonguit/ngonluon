import {
  IsString,
  IsOptional,
  IsEnum,
  MinLength,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum SortByOption {
  POPULARITY = 'popularity',
  NEWEST = 'newest',
  RATING = 'rating',
}

export class SearchQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  genre?: string;

  /** Filter by media type ('MOVIE' | 'SERIES') */
  @IsOptional()
  @IsString()
  type?: string;

  /** Release year — exact match when yearTo is omitted, lower bound of range otherwise */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  yearFrom?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  yearTo?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  @Max(10)
  minRating?: number;

  @IsOptional()
  @IsEnum(SortByOption)
  sortBy?: SortByOption;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class SuggestQueryDto {
  @IsString()
  @MinLength(1)
  q: string;
}
