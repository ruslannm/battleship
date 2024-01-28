import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Render,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
// import { OrderService } from './game.service';
// import { OrderDto } from './dto/order.dto';
import { UserService } from 'src/user/user.service';
import { Response, Request } from 'express';
import { AccessJwtGuard } from 'src/auth/access-jwt.guard';
import { UserValidatedDto } from 'src/user/dto/user.dto';
import { GameService } from './game.service';
import {
  botUserId,
  createGameStage,
  gamingStage,
  placementStage,
  stages,
} from 'src/constants';
import { PlacementService } from 'src/placement/placement.service';
import { CreateGameDto, ShotDto } from './dto/game.dto';

@UseGuards(AccessJwtGuard)
@Controller()
export class GameController {
  constructor(
    private readonly userService: UserService,
    private readonly gameService: GameService,
    private readonly placementService: PlacementService,
  ) { }

  @Get()
  async render(@Req() req: Request, @Res() res: Response) {
    const user = req.user as UserValidatedDto;
    // const req.cookies['gameId'];
    console.log(user);
    const opponentId = botUserId;
    const playername = (await this.userService.findById(user.id)).username;
    const opponentname = (await this.userService.findById(opponentId)).username;
    const data = { isAuth: true, playername, opponentname };
    const game = await this.gameService.findByUserId(user.id);
    if (!game) {
      data['gameId'] = 0;
      data['stage'] = createGameStage;
    } else {
      data['gameId'] = game.id;
      console.log('Проверить окончание состояния и перевести в следующее');
      data['stage'] = await this.gameService.checkAndUpdateStage(
        game.id,
        user.id,
        game.stage,
      );
      if (data['stage'] === placementStage) {
        const availableShips = await this.placementService.getAvailableShips(
          game.id,
          user.id,
        );
        data['availableShips'] = { docks: availableShips };
      } else if (data['stage'] === gamingStage) {
        data['shots'] = (
          await this.gameService.getShotReverseOrder(game.id)
        ).slice(0, 15);
      }
    }
    data['userMap'] = {
      map: await this.gameService.getMap(
        data['gameId'],
        user.id,
        opponentId,
        data['stage'],
      ),
      userType: 'user',
    };
    data['opponentMap'] = {
      map: await this.gameService.getMap(
        data['gameId'],
        opponentId,
        user.id,
        data['stage'],
      ),
      userType: 'bot',
    };
    data['isStage'] = this.gameService.getGameStage(data['stage']);
    // console.log('data', data);
    res.render('game', data);
  }

  @Post('games')
  async post(
    @Body() dto: CreateGameDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const user = req.user as UserValidatedDto;
    console.log(user);

    const { first_shooter } = dto;
    const game = await this.gameService.findByUserId(user.id);
    if (game) {
      console.log('есть игра');
      res.redirect(`/`);
      return;
    }
    console.log('нет игры');
    const opponentId = botUserId;
    const newGame = await this.gameService.create(
      user.id,
      opponentId,
      first_shooter === 'player' ? user.id : opponentId,
    );
    // Бот размещает корабли и делает отметку что готов к игре
    await this.placementService.placeShipsByBot(newGame.id, opponentId);
    await this.gameService.updateUsersInGames(
      newGame.id,
      opponentId,
      first_shooter !== 'player',
      { isPlacementCompleted: true },
    );
    await this.gameService.update(newGame.id, { stage: placementStage });
    res.cookie('gameId', newGame.id, {
      httpOnly: true,
    });
    res.redirect(`/`);
  }

  @Post('/shots')
  async shot(
    @Body() dto: ShotDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const user = req.user as UserValidatedDto;
    console.log(dto);
    // console.log(user.id);
    const game = await this.gameService.findByUserId(user.id);
    // if (!game) {
    //   res.render('not-found', { isAuth: true });
    //   return;
    // }
    const opponentId = botUserId;
    const isHit = await this.gameService.makeShot(
      { userId: user.id, gameId: game.id, cell: dto.cell },
      opponentId,
    );
    const isWin = await this.gameService.checkAndUpdateWinner(
      game.id,
      user.id,
      opponentId
    )
    console.log('isHit', isHit, 'isWin', isWin);
    if (!(isHit || isWin)) {
      await this.gameService.makeBotShot(game.id, opponentId, user.id);
    }
    res.redirect(``);

  }

  @Delete('/:id')
  async close(
    @Req() req: Request,
    @Res() res: Response,
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_FOUND }),
    )
    id: number,
  ) {
    const user = req.user as UserValidatedDto;
    // console.log('Delete', user, 'id', id);

    const game = await this.gameService.find({ id, userId: user.id });
    if (!game) {
      res.render('not-found', { isAuth: true });
      return;
    }
    const stage = stages.at(-1);
    await this.gameService.update(id, { stage });
    res.status(HttpStatus.OK).json({ href: `/game` }).send();
  }
}
