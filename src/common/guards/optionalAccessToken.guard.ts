import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Um guarda que tenta validar o usuário com a estratégia 'jwt',
 * mas NÃO lança um erro se a autenticação falhar (ex: sem token).
 * Ele simplesmente anexa o 'user' (ou 'undefined') ao objeto 'req'.
 */
@Injectable()
export class OptionalAccessTokenGuard extends AuthGuard('jwt') {
  handleRequest(err, user, info, context) {
    return user;
  }
}
