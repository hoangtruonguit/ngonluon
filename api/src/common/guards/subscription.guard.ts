import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { MoviesRepository } from '../../movies/movies.repository';

interface AuthenticatedRequest extends Request {
  user?: { id: string };
}

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly moviesRepository: MoviesRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const slug = request.params?.slug as string | undefined;

    if (!slug) return true;

    const movie = await this.moviesRepository.findBySlugWithGenres(slug);
    if (!movie || !movie.isPremium) return true;

    const user = request.user;
    if (!user?.id) {
      throw new ForbiddenException(
        'Subscription required to watch this content',
      );
    }

    const hasSubscription =
      await this.subscriptionsService.hasActiveSubscription(user.id);
    if (!hasSubscription) {
      throw new ForbiddenException(
        'Subscription required to watch this content',
      );
    }

    return true;
  }
}
