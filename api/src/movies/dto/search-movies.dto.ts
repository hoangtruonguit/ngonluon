import {
  IsOptional,
  IsString,
  IsNumberString,
  IsNumber,
} from 'class-validator';

export class SearchMoviesDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  genre?: string;

  @IsOptional()
  @IsNumberString()
  year?: string;

  @IsOptional()
  @IsNumberString()
  rating?: string;

  @IsOptional()
  @IsString()
  sortBy?: string; // 'popularity', 'newest', 'rating'

  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;
}
