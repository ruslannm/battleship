import { Controller, Get, Render, Req, Res, UseGuards } from '@nestjs/common';
// import { OrderService } from './order/order.service';
import { Response, Request } from 'express';
// import { UserValidatedDto } from 'src/user/dto/user.dto';
import { AccessJwtGuard } from './auth/access-jwt.guard';
import { AuthService } from './auth/auth.service';
import { ConfigService } from '@nestjs/config';
import { UserValidatedDto } from './user/dto/user.dto';
import { botUserId } from './constants';
import { GameService } from './game/game.service';

const configService = new ConfigService();
const { accessCookiesName } = {
  accessCookiesName: configService.get<string>('ACCESS_COOKIE_NAME'),
};

@Controller()
export class AppController {
  constructor(
    // private readonly orderService: OrderService,
    private readonly authService: AuthService, // private readonly gameService: GameService,
    // private readonly userService: UserService,
    private readonly gameService: GameService,
  ) { }

  @UseGuards(AccessJwtGuard)
  @Get('myStats')
  @Render('myStats')
  async myStats(@Req() req: Request) {
    const user = req.user as UserValidatedDto;
    const games = await this.gameService.findManyClosedByUserId(user.id);
    console.log(games.at(-1));
    const renderGames = games.map((item) => {
      const firstShooter = item.users.filter((el) => el.isFirstShooter).at(0)
        .user.username;
      const winner = item.winner ? item.winner.username : '-';
      const data = {
        gameId: item.id,
        firstShooter,
        winner,
      };
      return data;
    });
    return { isAuth: true, games: renderGames };
  }

  @Get('not-found')
  @Render('not-found')
  async notFound(@Req() req: Request) {
    const jwtToken = req.cookies[accessCookiesName];
    const auth = await this.authService.getAuth(jwtToken);
    return auth;
  }
}
