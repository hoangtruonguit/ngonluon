import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly usersService: UsersService,
    private readonly redisService: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request: any) => {
          return request?.cookies?.access_token || null;
        },
      ]),
      ignoreExpiration: false,
      // We use secretOrKeyProvider to get per-user public key
      secretOrKeyProvider: async (
        request: any,
        rawJwtToken: string,
        done: Function,
      ) => {
        try {
          // Decode the token payload (without verifying) to get the userId
          const parts = rawJwtToken.split('.');
          if (parts.length !== 3)
            return done(new UnauthorizedException('Invalid token'), null);

          const payload = JSON.parse(
            Buffer.from(parts[1], 'base64url').toString('utf8'),
          );
          const userId: string = payload?.sub;
          if (!userId)
            return done(
              new UnauthorizedException('Invalid token payload'),
              null,
            );

          // Try Redis first (cache-aside)
          const redisKey = `user:${userId}:public_key`;
          let publicKey = await redisService.get(redisKey);

          if (!publicKey) {
            // Fallback to DB
            const user: any = await usersService.findById(userId);
            if (!user || !user.publicKey) {
              return done(
                new UnauthorizedException('No public key found'),
                null,
              );
            }
            publicKey = user.publicKey as string;
            // Re-populate Redis cache (TTL = 1 day)
            await redisService.set(redisKey, publicKey, 86400);
          }

          done(null, publicKey);
        } catch (e) {
          done(new UnauthorizedException('Token verification failed'), null);
        }
      },
      algorithms: ['RS256'],
    });
  }

  async validate(payload: { sub: string; email: string }) {
    return { userId: payload.sub, email: payload.email };
  }
}
