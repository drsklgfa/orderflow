import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { AuthenticatedRequest } from '../types/authenticated-request';

@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return true;
    if (request.authSource === 'bearer') return true;

    const header = request.headers['x-csrf-token'];
    if (!header || Array.isArray(header) || header !== request.user.csrf) {
      throw new ForbiddenException('Token de segurança da requisição inválido.');
    }
    return true;
  }
}
