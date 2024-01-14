import { Controller, Get, Render, Req, Res, UseGuards } from '@nestjs/common';
// import { OrderService } from './order/order.service';
import { Response, Request } from 'express';
// import { UserValidatedDto } from 'src/user/dto/user.dto';
import { AccessJwtGuard } from './auth/access-jwt.guard';
import { AuthService } from './auth/auth.service';
import { ConfigService } from '@nestjs/config';
import { UserValidatedDto } from './user/dto/user.dto';
import { GameService } from './game/game.service';
import { placementStage } from './constants';

const configService = new ConfigService();
const { accessCookiesName } = {
  accessCookiesName: configService.get<string>('ACCESS_COOKIE_NAME'),
};

@Controller()
export class AppController {
  constructor(
    // private readonly orderService: OrderService,
    private readonly authService: AuthService,
    private readonly gameService: GameService,
  ) { }

  @UseGuards(AccessJwtGuard)
  @Get()
  async root(@Req() req: Request, @Res() res: Response) {
    const user = req.user as UserValidatedDto;
    const game = await this.gameService.getGameByUserId(user.id);
    const gameButtonText =
      game.stage === placementStage ? 'Поставить корабли' : 'Играть';
    res.render('index', {
      isAuth: true,
      gameButtonText,
    });

    // const user = req.user as UserValidatedDto;
    // const isAdmin = user.role === 'admin';
    // if (isAdmin) {
    //   const orders = await this.orderService.findMany();
    //   res.render('index-admin', {
    //     isAuth: true,
    //     isAdmin,
    //     isOrders: orders.length > 0,
    //     orders,
    //   });
    // } else {
    //   const orders = await this.orderService.findByUserId(user.id);
    //   res.render('index-waiter', {
    //     isAuth: true,
    //     isUserId: true,
    //     userId: user.id,
    //     isOrders: orders.length > 0,
    //     orders,
    //   });
    // }
  }

  @Get('not-found')
  @Render('not-found')
  async notFound(@Req() req: Request) {
    const jwtToken = req.cookies[accessCookiesName];
    const auth = await this.authService.getAuth(jwtToken);
    return auth;
  }
}
