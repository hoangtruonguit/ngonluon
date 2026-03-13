import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCommentDto {
    @IsString()
    @IsNotEmpty()
    content: string;

    @IsBoolean()
    @IsOptional()
    isSpoiler?: boolean;
}
