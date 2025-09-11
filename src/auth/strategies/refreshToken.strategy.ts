import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { jwtConstants } from '../constants';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor() {
    if (!jwtConstants.refresh_token_secret) {
      throw new Error('ENV não configurado.');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwtConstants.refresh_token_secret,
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: any) {
    const refreshToken = req.get('Authorization')?.replace('Bearer', '').trim();
    if (!refreshToken) { throw new ForbiddenException()}
    return { ...payload, refreshToken };
  }
}
