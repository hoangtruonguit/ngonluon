// SearchQueryDto and SuggestQueryDto have been moved to common/dto/search-query.dto.ts
// Re-export for backward compatibility within the search module.
export {
  SearchQueryDto,
  SuggestQueryDto,
} from '../../common/dto/search-query.dto';

import { IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class ImportTmdbDto {
  @Type(() => Number)
  @IsInt()
  tmdbId: number;
}
