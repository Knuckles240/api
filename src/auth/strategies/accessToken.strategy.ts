import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConstants } from '../constants';

type JwtPayload = {
  id: string;
  email: string;
};

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    if (!jwtConstants.access_token_secret) {
      throw new Error('ENV não configurado.');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwtConstants.access_token_secret,
    });
  }

  validate(payload: JwtPayload) {
    return payload;
  }
}
