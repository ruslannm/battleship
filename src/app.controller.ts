import { Controller, Get, Render, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AccessJwtGuard } from './auth/access-jwt.guard';
import { AuthService } from './auth/auth.service';
import { ConfigService } from '@nestjs/config';
import { UserValidatedDto } from './user/dto/user.dto';
import { GameService } from './game/game.service';

const configService = new ConfigService();
const { accessCookiesName } = {
  accessCookiesName: configService.get<string>('ACCESS_COOKIE_NAME'),
};

@Controller()
export class AppController {
  constructor(
    private readonly authService: AuthService,
    private readonly gameService: GameService,
  ) { }

  @UseGuards(AccessJwtGuard)
  @Get('myStats')
  @Render('myStats')
  async myStats(@Req() req: Request) {
    const user = req.user as UserValidatedDto;
    const games = await this.gameService.findManyClosedByUserId(user.id);
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

  @UseGuards(AccessJwtGuard)
  @Get('bestPlayers')
  @Render('bestPlayers')
  async bestPlayers() {
    const bestPlayers = await this.gameService.findBestPlayers();
    return { isAuth: true, bestPlayers };
  }

  @Get('not-found')
  @Render('not-found')
  async notFound(@Req() req: Request) {
    const jwtToken = req.cookies[accessCookiesName];
    const auth = await this.authService.getAuth(jwtToken);
    return auth;
  }
}
