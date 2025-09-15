import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { jwtConstants } from '../constants';
import { Request } from 'express';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class CookieStrategy extends PassportStrategy(Strategy, 'cookie') {
  constructor(private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies[jwtConstants.access_token];
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.access_token_secret,
    });
  }

  async validate(payload: any) {
    const { user } = await this.usersService.findOne(payload.id);

    if (!user) {
      throw new UnauthorizedException("Usúario não existe.");
    }

    const { password, ...safeUser } = user;

    return safeUser;  }
}
