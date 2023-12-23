import { Injectable, Req } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

type JwtPayload = {
  sub: string;
  role: string;
};

@Injectable()
export class AccessJwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        AccessJwtStrategy.extractJWT,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey: configService.get<string>('ACCESS_JWT_SECRET'),
    });
  }

  private static extractJWT(@Req() req: Request): string | null {
    const configService = new ConfigService();
    const cookiesName = configService.get<string>('ACCESS_COOKIE_NAME');
    if (
      req.cookies &&
      cookiesName in req.cookies &&
      req.cookies[cookiesName].length > 0
    ) {
      return req.cookies[cookiesName];
    }
    return null;
  }

  async validate(payload: JwtPayload) {
    return { id: payload.sub, role: payload.role };
  }
}
