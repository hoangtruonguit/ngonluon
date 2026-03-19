import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RedisService } from '../redis/redis.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { MailProducer } from '../mail/mail.producer';
import { AuthResponseDto, UserResponseDto } from './dto/auth-response.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    private readonly mailProducer: MailProducer,
  ) {}

  async register(
    registerDto: RegisterDto,
  ): Promise<{ id: string; email: string; fullName: string }> {
    const { email, password, confirmPassword, fullName, termsAccepted } =
      registerDto;

    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    if (!termsAccepted) {
      throw new BadRequestException('Terms must be accepted');
    }

    const existingUser = await this.usersService.findOne(email);
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.usersService.create({
      email,
      password: hashedPassword,
      fullName,
    });

    // Emit welcome email event via MailProducer
    await this.mailProducer.sendWelcomeEmail(email, fullName);

    this.logger.log(`User registered: ${email}`);

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName || '',
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // 1. Find user
    const user = await this.usersService.findOne(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 2. Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 3. Generate fresh RSA-2048 key pair for this login session
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    // 4. Sign Access Token (RS256)
    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload, {
      privateKey,
      algorithm: 'RS256',
      expiresIn: '1h',
    });

    // 5. Generate Refresh Token (HS256)
    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      {
        secret:
          this.configService.get<string>('JWT_REFRESH_SECRET') ||
          'refresh_secret',
        expiresIn: '7d',
      },
    );

    // 6. Store public key in Redis and Refresh Token in DB
    const redisKey = `user:${user.id}:public_key`;
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    await Promise.all([
      this.redisService.set(redisKey, publicKey, 3600), // Cache for 1h (same as token)
      this.usersService.updatePublicKey(user.id, publicKey),
      this.usersService.updateRefreshToken(user.id, hashedRefreshToken),
    ]);

    this.logger.log(`User logged in: ${email}`);

    return plainToInstance(
      AuthResponseDto,
      {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          avatarUrl: user.avatarUrl || null,
        },
        expiresIn: 3600, // 1 hour in seconds
      },
      { excludeExtraneousValues: true },
    );
  }

  async refresh(refreshToken: string): Promise<AuthResponseDto> {
    try {
      // 1. Verify Refresh Token

      const payload = this.jwtService.verify<{ sub: string }>(refreshToken, {
        secret:
          this.configService.get<string>('JWT_REFRESH_SECRET') ||
          'refresh_secret',
      });

      const userId = payload.sub;

      const user = await this.usersService.findById(userId);

      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // 2. Compare with stored hash
      const isRefreshTokenValid = await bcrypt.compare(
        refreshToken,
        user.refreshToken,
      );
      if (!isRefreshTokenValid) {
        // Potential token reuse attack - clear token and revoke session
        this.logger.warn(`Token reuse detected for user: ${userId}`);
        await this.usersService.updateRefreshToken(userId, null);
        throw new UnauthorizedException('Token reuse detected');
      }

      // 3. Generate NEW key pair for NEW session
      const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      });

      // 4. Issue new Access and Refresh tokens
      const newAccessToken = this.jwtService.sign(
        { sub: user.id, email: user.email },
        { privateKey, algorithm: 'RS256', expiresIn: '1h' },
      );

      const newRefreshToken = this.jwtService.sign(
        { sub: user.id },
        {
          secret:
            this.configService.get<string>('JWT_REFRESH_SECRET') ||
            'refresh_secret',
          expiresIn: '7d',
        },
      );

      // 5. Update DB and Redis
      const redisKey = `user:${user.id}:public_key`;
      const hashedRefreshToken = await bcrypt.hash(newRefreshToken, 10);

      await Promise.all([
        this.redisService.set(redisKey, publicKey, 3600),
        this.usersService.updatePublicKey(user.id, publicKey),
        this.usersService.updateRefreshToken(user.id, hashedRefreshToken),
      ]);

      this.logger.log(`Token refreshed for user: ${user.id}`);

      return plainToInstance(
        AuthResponseDto,
        {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            avatarUrl: user.avatarUrl || null,
          },
          expiresIn: 3600,
        },
        { excludeExtraneousValues: true },
      );
    } catch {
      throw new UnauthorizedException('Refresh token invalid or expired');
    }
  }

  async getMe(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return plainToInstance(
      UserResponseDto,
      {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl || null,
      },
      { excludeExtraneousValues: true },
    );
  }
}
