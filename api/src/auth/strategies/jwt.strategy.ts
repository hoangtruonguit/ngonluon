import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { RedisService } from '../../redis/redis.service';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly usersService: UsersService,
    private readonly redisService: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request: Request) => {
          const cookies = (
            request as unknown as { cookies?: Record<string, string> }
          ).cookies;
          return cookies?.access_token || null;
        },
      ]),
      ignoreExpiration: false,
      passReqToCallback: true,
      // We use secretOrKeyProvider to get per-user public key
      secretOrKeyProvider: (
        request: Request,
        rawJwtToken: string,
        done: (err: any, secretOrKey?: string) => void,
      ) => {
        const getSecret = async () => {
          // Decode the token payload (without verifying) to get the userId
          const parts = rawJwtToken.split('.');
          if (parts.length !== 3) throw new Error('Invalid token');

          const payload = JSON.parse(
            Buffer.from(parts[1], 'base64url').toString('utf8'),
          ) as { sub?: string };
          const userId = payload?.sub;
          if (!userId) throw new Error('Invalid token payload');

          // Try Redis first (cache-aside)
          const redisKey = `user:${userId}:public_key`;
          let publicKey = await redisService.get(redisKey);

          if (!publicKey) {
            // Fallback to DB
            const user = (await usersService.findById(userId)) as {
              publicKey: string | null;
            } | null;
            if (!user || !user.publicKey)
              throw new Error('No public key found');
            publicKey = user.publicKey;
            // Re-populate Redis cache (TTL = 1 day)
            await redisService.set(redisKey, publicKey, 86400);
          }
          return publicKey;
        };

        getSecret()
          .then((key) => done(null, key || undefined))
          .catch((err: Error) =>
            done(new UnauthorizedException(err.message), undefined),
          );
      },
      algorithms: ['RS256'],
    });
  }

  validate(payload: { sub: string; email: string }) {
    return { userId: payload.sub, email: payload.email };
  }
}
