import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, IsString, validateSync, IsBoolean } from 'class-validator';

enum Environment {
    Development = 'development',
    Production = 'production',
    Test = 'test',
}

class EnvironmentVariables {
    @IsEnum(Environment)
    NODE_ENV: Environment;

    @IsNumber()
    PORT: number;

    @IsString()
    JWT_REFRESH_SECRET: string;

    @IsString()
    MAIL_HOST: string;

    @IsNumber()
    MAIL_PORT: number;

    @IsBoolean()
    ENABLE_MAIL: boolean;
}

export function validate(config: Record<string, any>) {
    const validatedConfig = plainToInstance(
        EnvironmentVariables,
        {
            ...config,
            PORT: parseInt(config.PORT, 10),
            MAIL_PORT: parseInt(config.MAIL_PORT, 10),
            ENABLE_MAIL: config.ENABLE_MAIL === 'true',
        },
        { enableImplicitConversion: true },
    );
    const errors = validateSync(validatedConfig, { skipMissingProperties: false });

    if (errors.length > 0) {
        throw new Error(errors.toString());
    }
    return validatedConfig;
}
