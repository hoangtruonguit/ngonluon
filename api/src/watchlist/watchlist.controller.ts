import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  UseGuards,
  Body,
} from '@nestjs/common';
import { WatchlistService } from './watchlist.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../common/decorators/user.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { AddToWatchlistDto } from './dto/add-to-watchlist.dto';

@ApiTags('Watchlist')
@Controller('watchlist')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WatchlistController {
  constructor(private readonly watchlistService: WatchlistService) {}

  @Post()
  @ApiOperation({ summary: 'Add movie to watchlist' })
  @ApiResponse({ status: 201, description: 'Added to watchlist successfully.' })
  @ResponseMessage('Added to watchlist successfully')
  async addToWatchlist(
    @User() user: { userId: string },
    @Body() dto: AddToWatchlistDto,
  ) {
    return this.watchlistService.addToWatchlist(user.userId, dto.movieId);
  }

  @Delete(':movieId')
  @ApiOperation({ summary: 'Remove movie from watchlist' })
  @ApiResponse({
    status: 200,
    description: 'Removed from watchlist successfully.',
  })
  @ResponseMessage('Removed from watchlist successfully')
  async removeFromWatchlist(
    @User() user: { userId: string },
    @Param('movieId') movieId: string,
  ) {
    return this.watchlistService.removeFromWatchlist(user.userId, movieId);
  }

  @Get('status/:movieId')
  @ApiOperation({ summary: 'Check if movie is in watchlist' })
  @ApiResponse({ status: 200, description: 'Return watchlist status.' })
  async getStatus(
    @User() user: { userId: string },
    @Param('movieId') movieId: string,
  ) {
    return this.watchlistService.getStatus(user.userId, movieId);
  }

  @Get()
  @ApiOperation({ summary: 'Get user watchlist' })
  @ApiResponse({ status: 200, description: 'Return user watchlist.' })
  async getWatchlist(@User() user: { userId: string }) {
    return this.watchlistService.getWatchlist(user.userId);
  }
}
