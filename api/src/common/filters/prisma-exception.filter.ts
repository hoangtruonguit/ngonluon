import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status: number;
    let message: string;

    switch (exception.code) {
      // Unique constraint violation
      case 'P2002': {
        status = HttpStatus.CONFLICT;
        const fields = (exception.meta?.target as string[])?.join(', ');
        message = fields
          ? `A record with this ${fields} already exists`
          : 'A record with this value already exists';
        break;
      }

      // Record not found
      case 'P2025':
        status = HttpStatus.NOT_FOUND;
        message =
          (exception.meta?.cause as string) ||
          'The requested record was not found';
        break;

      // Foreign key constraint violation
      case 'P2003': {
        status = HttpStatus.BAD_REQUEST;
        const field = exception.meta?.field_name as string;
        message = field
          ? `Related ${field} does not exist`
          : 'Related record does not exist';
        break;
      }

      // Required relation violation
      case 'P2014':
        status = HttpStatus.BAD_REQUEST;
        message = 'The required relation is missing';
        break;

      // Value too long for column
      case 'P2000':
        status = HttpStatus.BAD_REQUEST;
        message = 'The provided value is too long';
        break;

      default:
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'An unexpected database error occurred';
    }

    this.logger.error(
      `Prisma error ${exception.code}: ${exception.message}`,
      exception.stack,
    );

    response.status(status).json({
      statusCode: status,
      message,
      data: null,
      timestamp: new Date().toISOString(),
    });
  }
}
