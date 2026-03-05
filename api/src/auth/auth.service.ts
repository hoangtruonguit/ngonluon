import { Injectable, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(private usersService: UsersService) { }

    async register(registerDto: RegisterDto) {
        const { email, password, confirmPassword, fullName, termsAccepted } = registerDto;

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

        return {
            id: user.id,
            email: user.email,
            fullName: user.fullName
        };
    }
}
