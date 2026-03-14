import {
  IsString,
  IsOptional,
  MinLength,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SearchQueryDto {
  @IsString()
  @MinLength(1)
  q: string;

  @IsOptional()
  @IsString()
  genre?: string;

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
  @IsString()
  sortBy?: string;

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

export class ImportTmdbDto {
  @Type(() => Number)
  @IsInt()
  tmdbId: number;
}
