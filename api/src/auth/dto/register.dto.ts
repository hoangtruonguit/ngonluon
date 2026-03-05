import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, Equals } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
    @ApiProperty({ example: 'user@example.com', description: 'The email of the user' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: 'password123', description: 'The password (min 8 chars)' })
    @IsString()
    @IsNotEmpty()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    password: string;

    @ApiProperty({ example: 'password123', description: 'Confirm password must match password' })
    @IsString()
    @IsNotEmpty()
    confirmPassword: string;

    @ApiProperty({ example: 'John Doe', description: 'Full name of the user' })
    @IsString()
    @IsNotEmpty()
    fullName: string;

    @ApiProperty({ example: true, description: 'Must accept terms and conditions' })
    @IsBoolean()
    @Equals(true, { message: 'Terms must be accepted' })
    termsAccepted: boolean;
}
