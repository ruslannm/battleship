import { Controller, Get, Render, Req, Res, UseGuards } from '@nestjs/common';
// import { OrderService } from './order/order.service';
import { Response, Request } from 'express';
// import { UserValidatedDto } from 'src/user/dto/user.dto';
import { AccessJwtGuard } from './auth/access-jwt.guard';
import { AuthService } from './auth/auth.service';
import { ConfigService } from '@nestjs/config';

const configService = new ConfigService();
const { accessCookiesName } = {
  accessCookiesName: configService.get<string>('ACCESS_COOKIE_NAME'),
};

@Controller()
export class AppController {
  constructor(
    // private readonly orderService: OrderService,
    private readonly authService: AuthService, // private readonly gameService: GameService,
  ) { }

  // @UseGuards(AccessJwtGuard)
  // @Get()
  // @Render('index')
  // async root() {
  //   return { isAuth: true };
  // }

  @Get('not-found')
  @Render('not-found')
  async notFound(@Req() req: Request) {
    const jwtToken = req.cookies[accessCookiesName];
    const auth = await this.authService.getAuth(jwtToken);
    return auth;
  }
}
