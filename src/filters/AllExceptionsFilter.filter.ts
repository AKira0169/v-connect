import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { AppError } from './app-error';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

interface MongoDuplicateError {
  code: number;
  keyValue: Record<string, any>;
}

interface MongoValidationError {
  name: string;
  errors: Record<string, { message: string }>;
}

interface JWTError {
  name: string;
}

interface ValidationErrorResponse {
  message: string | string[];
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly config: ConfigService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isDev = this.config.get('NODE_ENV') === 'development';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof AppError) {
      status = exception.statusCode;
      message = exception.message;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const errorResponse = exception.getResponse();
      if (typeof errorResponse === 'string') {
        message = errorResponse;
      } else {
        const errorMessage = (errorResponse as ValidationErrorResponse).message;
        message = Array.isArray(errorMessage)
          ? errorMessage.join('. ')
          : errorMessage;
      }
    } else if (this.isDatabaseError(exception)) {
      const error = this.handleDatabaseError(exception);
      status = error.statusCode;
      message = error.message;
    } else if (this.isJWTError(exception)) {
      const error = this.handleJWTError(exception);
      status = error.statusCode;
      message = error.message;
    } else if (this.isValidationError(exception)) {
      const error = this.handleValidationError(exception);
      status = error.statusCode;
      message = error.message;
    }

    const logPayload = {
      statusCode: status,
      message,
      path: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
      stack: exception instanceof Error ? exception.stack : undefined,
    };

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error('Unhandled Exception', logPayload);
    } else {
      this.logger.warn('Handled Exception', logPayload);
    }

    response.status(status).json({
      success: false,
      message,
      data: null,
      error: {
        code: status.toString(),
        details: isDev
          ? exception instanceof Error
            ? exception.stack
            : null
          : null,
      },
    });
  }

  private isDatabaseError(
    exception: unknown,
  ): exception is MongoDuplicateError | MongoValidationError {
    const e = exception as Partial<{ code: number; name: string }>;

    return e?.code === 11000 || e?.name === 'ValidationError';
  }

  private handleDatabaseError(
    exception: MongoDuplicateError | MongoValidationError,
  ): AppError {
    if ((exception as MongoDuplicateError).code === 11000) {
      const duplicateField = Object.keys(
        (exception as MongoDuplicateError).keyValue,
      )[0];
      const message = `Duplicate field value: ${(exception as MongoDuplicateError).keyValue[duplicateField]}. Please use another value.`;
      return new AppError(message, HttpStatus.CONFLICT);
    }

    if ((exception as MongoValidationError).name === 'ValidationError') {
      const errors = Object.values(
        (exception as MongoValidationError).errors,
      ).map((el) => el.message);
      const message = `Invalid input data. ${errors.join('. ')}`;
      return new AppError(message, HttpStatus.BAD_REQUEST);
    }

    return new AppError('Database error', HttpStatus.INTERNAL_SERVER_ERROR);
  }

  private isJWTError(exception: unknown): exception is JWTError {
    const e = exception as JWTError;
    return e?.name === 'JsonWebTokenError' || e?.name === 'TokenExpiredError';
  }

  private handleJWTError(exception: JWTError): AppError {
    if (exception.name === 'JsonWebTokenError') {
      return new AppError(
        'Invalid token. Please log in again.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (exception.name === 'TokenExpiredError') {
      return new AppError(
        'Your token has expired. Please log in again.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return new AppError(
      'Authentication error',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  private isValidationError(
    exception: unknown,
  ): exception is BadRequestException {
    return (
      exception instanceof BadRequestException &&
      exception.message === 'Validation failed'
    );
  }

  private handleValidationError(exception: BadRequestException): AppError {
    const errors = (exception.getResponse() as ValidationErrorResponse).message;
    const message = `Validation failed: ${Array.isArray(errors) ? errors.join('. ') : errors}`;
    return new AppError(message, HttpStatus.BAD_REQUEST);
  }
}
