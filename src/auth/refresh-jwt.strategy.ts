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
export class RefreshJwtStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        RefreshJwtStrategy.extractJWT,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey: configService.get<string>('REFRESH_JWT_SECRET'),
      passReqToCallback: true,
    });
  }

  private static extractJWT(@Req() req: Request): string | null {
    const configService = new ConfigService();
    const cookiesName = configService.get<string>('REFRESH_COOKIE_NAME');
    if (
      req.cookies &&
      cookiesName in req.cookies &&
      req.cookies[cookiesName].length > 0
    ) {
      return req.cookies[cookiesName];
    }
    return null;
  }

  async validate(@Req() req: Request, payload: JwtPayload) {
    const configService = new ConfigService();
    const cookiesName = configService.get<string>('REFRESH_COOKIE_NAME');
    return {
      id: payload.sub,
      role: payload.role,
      refreshToken: req.cookies[cookiesName],
    };
  }
}
