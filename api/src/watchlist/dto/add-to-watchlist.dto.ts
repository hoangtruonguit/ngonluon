import { IsNotEmpty, IsString } from 'class-validator';

export class AddToWatchlistDto {
  @IsString()
  @IsNotEmpty()
  movieId: string;
}
