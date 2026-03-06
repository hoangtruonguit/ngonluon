import { Controller, Post, Body, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService,
    ) { }

    @Post('register')
    @ApiOperation({ summary: 'Register a new user' })
    @ApiResponse({ status: 201, description: 'User successfully registered.' })
    @ApiResponse({ status: 400, description: 'Bad Request.' })
    @ResponseMessage('User registered successfully')
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Post('login')
    @ApiOperation({ summary: 'Login and get access token (RS256 JWT)' })
    @ApiResponse({ status: 200, description: 'Login successful, returns access_token in cookie.' })
    @ApiResponse({ status: 401, description: 'Invalid credentials.' })
    @ResponseMessage('Login successful')
    async login(
        @Body() loginDto: LoginDto,
        @Res({ passthrough: true }) response: Response
    ) {
        const result = await this.authService.login(loginDto);

        response.cookie('access_token', result.accessToken, {
            httpOnly: true,
            secure: this.configService.get<string>('NODE_ENV') === 'production',
            sameSite: 'lax',
            maxAge: result.expiresIn * 1000,
        });

        response.cookie('refresh_token', result.refreshToken, {
            httpOnly: true,
            secure: this.configService.get<string>('NODE_ENV') === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return result;
    }

    @Post('refresh')
    @ApiOperation({ summary: 'Refresh access token' })
    @ApiResponse({ status: 200, description: 'Token refreshed successfully.' })
    @ApiResponse({ status: 401, description: 'Invalid refresh token.' })
    @ResponseMessage('Token refreshed successfully')
    async refresh(
        @Body() refreshDto: RefreshDto,
        @Res({ passthrough: true }) response: Response
    ) {
        const result = await this.authService.refresh(refreshDto.refreshToken);

        response.cookie('access_token', result.accessToken, {
            httpOnly: true,
            secure: this.configService.get<string>('NODE_ENV') === 'production',
            sameSite: 'lax',
            maxAge: result.expiresIn * 1000,
        });

        response.cookie('refresh_token', result.refreshToken, {
            httpOnly: true,
            secure: this.configService.get<string>('NODE_ENV') === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return result;
    }

    @Post('logout')
    @ApiOperation({ summary: 'Logout and clear cookies' })
    @ApiResponse({ status: 200, description: 'Logout successful.' })
    @ResponseMessage('Logged out successfully')
    async logout(@Res({ passthrough: true }) response: Response) {
        response.clearCookie('access_token');
        response.clearCookie('refresh_token');
        return { message: 'Signed out' };
    }
}
