import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus, Logger } from '@nestjs/common';
import { Response, Request } from 'express';
import { Prisma } from '@prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Ocorreu um erro interno no servidor.';

    this.logger.error(`Erro do Prisma: ${exception.code} em ${request.url}`, exception.message);

    switch (exception.code) {
      case 'P2002': {
        status = HttpStatus.CONFLICT; // 409
        const target = (exception.meta?.target as string[])?.join(', ');
        message = `Um registro com este ${target} já existe.`;
        break;
      }
      case 'P2025': {
        status = HttpStatus.NOT_FOUND; // 404
        message = 'O registro que você tentou operar não foi encontrado.';
        break;
      }
      default:
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = `Erro no banco de dados. (Código: ${exception.code})`;
        break;
    }

    response.status(status).json({
      statusCode: status,
      message: message,
      error: HttpStatus[status],
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
