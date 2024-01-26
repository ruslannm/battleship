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
import { botUserId, placementStage, stages } from 'src/constants';
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
    const game = await this.gameService.findByUserId(user.id);
    if (!game) {
      const data = {
        isAuth: true,
        playername,
        opponentname,
        userPlacement: {
          map: await this.placementService.getPlacementForRenderNewGame(),
        },
        opponentPlacement: {
          map: await this.placementService.getPlacementForRenderNewGame(),
        },
        isCreateGame: true,
      };
      res.render('game', data);
      return;
    }
    // if (game.stage === placementStage) {
    //   res.redirect(`/placement`);
    // } else {
    //   const userPlacement = await this.gameService.getUserCurrentPlacement(
    //     game.id,
    //     user.id,
    //     opponentId,
    //   );

    //   const opponentPlacement =
    //     await this.gameService.getOpponentCurrentPlacement(
    //       game.id,
    //       opponentId,
    //       user.id,
    //     );

    //   if (!(userPlacement && opponentPlacement)) {
    //     res.render('not-found', { isAuth: true });
    //     return;
    //   }
    const availableShips = await this.placementService.getAvailableShips(
      game.id,
      user.id,
    );

    res.render('game', {
      playername,
      opponentname,
      userPlacement: {
        map: await this.placementService.getPlacementForRender(
          game.id,
          user.id,
        ),
      },
      opponentPlacement: {
        map: await this.placementService.getPlacementForRenderNewGame(),
      },
      isAuth: true,
      shots: (await this.gameService.getShotReverseOrder(game.id)).slice(0, 15),
      // isPlacementCompleted,
      // isAllShipHit:
      //   userPlacement.isAllShipHit || opponentPlacement.isAllShipHit,
      winner: game.winner?.username,
      gameId: game.id,
      availableShips: { docks: availableShips },
    });
  }

  @Post('')
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
      res.render('not-found', { isAuth: true });
      return;
    }
    const opponentId = botUserId;
    const newGame = await this.gameService.create(
      user.id,
      opponentId,
      first_shooter === 'player' ? user.id : opponentId,
    );
    console.log('newGame', newGame);

    // Бот размещает корабли и делает отметку что готов к игре
    await this.placementService.placeShipsByBot(newGame.id, opponentId);
    await this.gameService.updateUsersInGames(
      newGame.id,
      opponentId,
      first_shooter !== 'player',
      { isPlacementCompleted: true },
    );
    res.cookie('gameId', newGame.id, {
      httpOnly: true,
    });
    res.redirect(`/`);
  }

  @Put('/:id')
  async goNextStage(
    @Req() req: Request,
    @Res() res: Response,
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_FOUND }),
    )
    id: number,
  ) {
    const user = req.user as UserValidatedDto;
    // console.log('Put', user, 'id', id);

    const game = await this.gameService.find({ id, userId: user.id });
    if (!game) {
      res.render('not-found', { isAuth: true });
      return;
    }
    const stageIdx = stages.indexOf(game.stage);
    // console.log('stageIdx', stageIdx, game.stage);

    if (game.stage === placementStage) {
      const availableShips = await this.placementService.getAvailableShips(
        game.id,
        user.id,
      );
      if (availableShips.length > 0) {
        res.render('not-found', { isAuth: true });
        return;
      }
      const userInGames = game.users
        .filter((item) => item.userId === user.id)
        .at(0);
      await this.gameService.updateUsersInGames(
        game.id,
        user.id,
        userInGames.isFirstShooter,
        { isPlacementCompleted: true },
      );
      const updatedGame = await this.gameService.find({ id, userId: user.id });
      const cntUserPlacementCompleted = updatedGame.users.filter(
        (item) => item.isPlacementCompleted,
      );
      // console.log('cntUserPlacementCompleted', cntUserPlacementCompleted);
      if (cntUserPlacementCompleted.length < 2) {
        res.status(HttpStatus.OK).json({ href: `/placement` }).send();
        return;
      }
      await this.gameService.update(id, { stage: stages.at(stageIdx + 1) });
      res
        .status(HttpStatus.OK)
        .json({ href: `/game/${game.id}` })
        .send();
    } else if (game.stage === stages.at(-1)) {
      res
        .status(HttpStatus.OK)
        .json({ href: `/game/${game.id}` })
        .send();
    } else {
      // переход в следующее состояние
      const stageIdx = stages.indexOf(game.stage);
      await this.gameService.update(id, { stage: stages.at(stageIdx + 1) });
      res
        .status(HttpStatus.OK)
        .json({ href: `/game/${game.id}` })
        .send();
    }
  }

  @Post('/shot')
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
    console.log('isHit', isHit);
    if (!isHit) {
      await this.gameService.makeBotShot(game.id, opponentId, user.id);
    }
    res.redirect(`/game/${game.id}`);
    // const { first_shooter } = dto;
    // const game = await this.gameService.findByUserId(user.id);
    // if (game) {
    //   res.render('not-found', { isAuth: true });
    //   return;
    // }
    // const opponentId = botUserId;
    // const newGame = await this.gameService.create(
    //   user.id,
    //   opponentId,
    //   first_shooter === 'player' ? user.id : opponentId,
    // );
    // // Бот размещает корабли и делает отметку что готов к игре
    // await this.placementService.placeShipsByBot(newGame.id, opponentId);
    // await this.gameService.updateUsersInGames(
    //   newGame.id,
    //   opponentId,
    //   first_shooter !== 'player',
    //   { isPlacementCompleted: true },
    // );
    // res.redirect(`/placement`);
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
