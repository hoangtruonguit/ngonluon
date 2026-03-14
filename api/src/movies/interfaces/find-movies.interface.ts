import { Prisma } from '@prisma/client';

export interface FindMoviesParams {
  where?: Prisma.MovieWhereInput;
  orderBy?:
    | Prisma.MovieOrderByWithRelationInput
    | Prisma.MovieOrderByWithRelationInput[];
  include?: Prisma.MovieInclude;
  skip?: number;
  take?: number;
}
