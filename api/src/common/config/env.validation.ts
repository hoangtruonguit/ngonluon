import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsString,
  IsBoolean,
  IsOptional,
  validateSync,
} from 'class-validator';

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

  // Database
  @IsString()
  DATABASE_URL: string;

  // JWT
  @IsString()
  JWT_REFRESH_SECRET: string;

  // Mail
  @IsString()
  MAIL_HOST: string;

  @IsNumber()
  MAIL_PORT: number;

  @IsBoolean()
  ENABLE_MAIL: boolean;

  // RabbitMQ
  @IsString()
  RABBITMQ_URL: string;

  // TMDB
  @IsString()
  TMDB_API_KEY: string;

  // CORS (optional — defaults to localhost:3000)
  @IsOptional()
  @IsString()
  CORS_ORIGINS?: string;

  // Redis (optional — defaults handled by ioredis)
  @IsOptional()
  @IsString()
  REDIS_HOST?: string;

  @IsOptional()
  @IsNumber()
  REDIS_PORT?: number;

  // Elasticsearch (optional — defaults handled by client)
  @IsOptional()
  @IsString()
  ELASTICSEARCH_URL?: string;
}

export function validate(config: Record<string, any>) {
  const validatedConfig = plainToInstance(
    EnvironmentVariables,
    {
      ...config,
      PORT: parseInt(String(config.PORT), 10),
      MAIL_PORT: parseInt(String(config.MAIL_PORT), 10),
      ENABLE_MAIL: String(config.ENABLE_MAIL) === 'true',
      ...(config.REDIS_PORT
        ? { REDIS_PORT: parseInt(String(config.REDIS_PORT), 10) }
        : {}),
    },
    { enableImplicitConversion: true },
  );
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
