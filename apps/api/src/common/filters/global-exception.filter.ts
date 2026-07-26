import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'Não foi possível concluir a solicitação.';
    let details: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else {
        const payload = body as Record<string, unknown>;
        code = String(payload.code ?? this.codeFromStatus(status));
        message = Array.isArray(payload.message) ? 'Os dados enviados são inválidos.' : String(payload.message ?? message);
        details = payload.details ?? (Array.isArray(payload.message) ? { errors: payload.message } : undefined);
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        code = 'DUPLICATE_RESOURCE';
        message = 'Já existe um registro com esses dados.';
      } else if (exception.code === 'P2003' || exception.code === 'P2014') {
        status = HttpStatus.CONFLICT;
        code = 'RELATED_RESOURCE_CONFLICT';
        message = 'A operação conflita com registros relacionados.';
      } else if (exception.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        code = 'RESOURCE_NOT_FOUND';
        message = 'Registro não encontrado.';
      } else if (exception.code === 'P2024') {
        status = HttpStatus.SERVICE_UNAVAILABLE;
        code = 'DATABASE_BUSY';
        message = 'O banco de dados está temporariamente ocupado. Tente novamente.';
      } else if (exception.code === 'P2034') {
        status = HttpStatus.CONFLICT;
        code = 'TRANSACTION_CONFLICT';
        message = 'A operação encontrou uma atualização simultânea. Tente novamente.';
      }
    }

    if (status >= 500) {
      this.logger.error(`${request.method} ${request.url}`, exception instanceof Error ? exception.stack : String(exception));
    }

    response.status(status).json({
      statusCode: status,
      code,
      message,
      ...(details ? { details } : {}),
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private codeFromStatus(status: number): string {
    return (
      {
        400: 'BAD_REQUEST',
        401: 'UNAUTHORIZED',
        403: 'FORBIDDEN',
        404: 'NOT_FOUND',
        409: 'CONFLICT',
        422: 'UNPROCESSABLE_ENTITY',
        429: 'TOO_MANY_REQUESTS',
        503: 'SERVICE_UNAVAILABLE',
      } as Record<number, string>
    )[status] ?? 'REQUEST_ERROR';
  }
}
