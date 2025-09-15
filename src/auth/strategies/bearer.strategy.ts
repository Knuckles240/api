import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConstants } from '../constants';

type JwtPayload = {
  id: string;
  email: string;
};

@Injectable()
export class BearerStrategy extends PassportStrategy(Strategy, 'bearer') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwtConstants.access_token_secret,
    });
  }

  async validate(payload: JwtPayload) {
    return payload;
  }
}
