import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { UserSigninDto, UserSignupDto } from 'src/user/dto/user.dto';
import { AccessJwtGuard } from './access-jwt.guard';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { RefreshJwtGuard } from './refresh-jwt.guard';

const configService = new ConfigService();
const {
  accessCookiesName,
  refreshCookieName,
  accessCookieMaxAgeInSeconds,
  refreshCookieMaxAgeInSeconds,
} = {
  accessCookiesName: configService.get<string>('ACCESS_COOKIE_NAME'),
  refreshCookieName: configService.get<string>('REFRESH_COOKIE_NAME'),
  accessCookieMaxAgeInSeconds: configService.get<number>(
    'ACCESS_COOKIE_MAXAGE_IN_SECONDS',
  ),
  refreshCookieMaxAgeInSeconds: configService.get<number>(
    'REFRESH_COOKIE_MAXAGE_IN_SECONDS',
  ),
};

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Get('signup')
  async signup(@Req() req: Request, @Res() res: Response) {
    const jwtToken = req.cookies[accessCookiesName];
    const auth = await this.authService.getAuth(jwtToken);
    if (auth && auth.isAuth) {
      res.redirect('/');
    } else {
      res.render('signup');
    }
  }

  @Post('signup')
  async signupPost(@Res() res: Response, @Body() body: UserSignupDto) {
    await this.authService.signup(body);
    res.redirect('/signin');
  }

  @Get('signin')
  async signin(@Req() req: Request, @Res() res: Response) {
    const accessJwtToken = req.cookies[accessCookiesName];
    const auth = await this.authService.getAuth(accessJwtToken);
    if (auth && auth.isAuth) {
      res.redirect('/');
    } else {
      res.render('signin');
    }
  }

  @Post('signin')
  async signinPost(@Body() body: UserSigninDto, @Res() res: Response) {
    const { accessToken, refreshToken } = await this.authService.signin(body);
    res
      .cookie(accessCookiesName, accessToken, {
        httpOnly: true,
        maxAge: accessCookieMaxAgeInSeconds * 1000,
      })
      .cookie(refreshCookieName, refreshToken, {
        httpOnly: true,
        maxAge: refreshCookieMaxAgeInSeconds * 1000,
      })
      .redirect('/');
    return;
  }

  @UseGuards(AccessJwtGuard)
  @Get('signout')
  signout(@Res() res: Response) {
    res
      .clearCookie(accessCookiesName, {
        httpOnly: true,
      })
      .clearCookie(refreshCookieName, {
        httpOnly: true,
      })
      .redirect('/signin');
  }

  @UseGuards(RefreshJwtGuard)
  @Get('refresh')
  async refreshTokens(@Req() req: Request, @Res() res: Response) {
    const { query, user } = req;
    const redirectBack = (query.redirectBack as string) || '/';
    const { accessToken, refreshToken } = await this.authService.refreshTokens({
      id: user['id'],
      role: user['role'],
      refreshToken: user['refreshToken'],
    });
    res
      .cookie(accessCookiesName, accessToken, {
        httpOnly: true,
        maxAge: accessCookieMaxAgeInSeconds * 1000,
      })
      .cookie(refreshCookieName, refreshToken, {
        httpOnly: true,
        maxAge: refreshCookieMaxAgeInSeconds * 1000,
      });
    res.redirect(redirectBack);
  }
}
