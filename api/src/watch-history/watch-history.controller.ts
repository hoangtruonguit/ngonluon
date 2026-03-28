import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  UseGuards,
  Param,
  Query,
} from '@nestjs/common';
import { WatchHistoryService } from './watch-history.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../common/decorators/user.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { SaveProgressDto } from './dto/save-progress.dto';
import { ParseJsonBodyPipe } from './pipe/parse-json-body.pipe';

@ApiTags('Watch History')
@Controller('watch-history')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WatchHistoryController {
  constructor(private readonly watchHistoryService: WatchHistoryService) {}

  @Post()
  @ApiOperation({ summary: 'Save movie/episode watch progress' })
  @ApiResponse({ status: 200, description: 'Progress saved successfully.' })
  @ResponseMessage('Watch progress saved')
  async saveProgress(
    @User() user: { userId: string },
    @Body(new ParseJsonBodyPipe()) dto: SaveProgressDto,
  ) {
    return this.watchHistoryService.saveProgress(user.userId, dto);
  }

  @Get(':movieId')
  @ApiOperation({ summary: 'Get watch progress for a specific movie' })
  @ApiResponse({ status: 200, description: 'Return movie watch progress.' })
  async getProgress(
    @User() user: { userId: string },
    @Param('movieId') movieId: string,
    @Query('episodeId') episodeId?: string,
  ) {
    return this.watchHistoryService.getProgress(
      user.userId,
      movieId,
      episodeId,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get user watch history list' })
  @ApiResponse({ status: 200, description: 'Return user watch history list.' })
  async getHistory(
    @User() user: { userId: string },
    @Query('limit') limit?: number,
  ) {
    return this.watchHistoryService.getHistory(
      user.userId,
      limit ? Number(limit) : undefined,
    );
  }

  @Delete('clear')
  @ApiOperation({ summary: 'Clear watch history' })
  @ApiResponse({
    status: 200,
    description: 'Watch history cleared successfully.',
  })
  @ResponseMessage('Watch history cleared')
  async clearHistory(@User() user: { userId: string }) {
    return this.watchHistoryService.clearHistory(user.userId);
  }
}
