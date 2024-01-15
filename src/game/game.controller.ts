import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
// import { OrderService } from './game.service';
// import { OrderDto } from './dto/order.dto';
import { UserService } from 'src/user/user.service';
import { RuleService } from 'src/rule/rule.service';
import { Response, Request } from 'express';
import { AccessJwtGuard } from 'src/auth/access-jwt.guard';
import { UserValidatedDto } from 'src/user/dto/user.dto';
import { GameService } from './game.service';
import {
  botUserId,
  gamingStage,
  placementStage,
  resultStage,
} from 'src/constants';
import { PlacementService } from 'src/placement/placement.service';
import { ShotDto } from './dto/game.dto';

@UseGuards(AccessJwtGuard)
@Controller('game')
export class GameController {
  constructor(
    private readonly userService: UserService,
    private readonly ruleService: RuleService,
    private readonly gameService: GameService,
    private readonly placementService: PlacementService,
  ) { }

  @Get('/:id')
  async render(
    @Req() req: Request,
    @Res() res: Response,
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_FOUND }),
    )
    id: number,
  ) {
    const user = req.user as UserValidatedDto;
    // console.log('user', user, 'id', id);

    const game = await this.gameService.find({ id, userId: user.id });
    if (!game) {
      res.render('not-found', { isAuth: true });
      return;
    }
    if (game.stage === placementStage) {
      res.redirect(`/placement`);
    } else {
      const placementUser = await this.placementService.getPlacementForRender(
        game.id,
        user.id,
      );

      const placementOpponent =
        await this.placementService.getPlacementForRender(game.id, botUserId);

      res.render('game', {
        placementUser: { map: placementUser },
        placementOpponent: { map: placementOpponent },
        isAuth: true,
      });
    }
  }

  @Get('')
  async renderMany(@Req() req: Request, @Res() res: Response) {
    const user = req.user as UserValidatedDto;
    const game = await this.gameService.findByUserId(user.id);
    if (!game) {
      res.render('game', { isPostGame: true, isAuth: true });
      return;
    }
    if (game.stage === placementStage) {
      res.redirect(`/placement`);
    } else {
      res.redirect(`/game/${game.id}`);
    }
  }

  @Post('')
  async post(@Req() req: Request, @Res() res: Response): Promise<void> {
    const user = req.user as UserValidatedDto;
    // console.log(req.body);
    const { first_shooter } = req.body;
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
    res.redirect(`/game/${newGame.id}`);
  }

  //   const userShot = await this.gameService.makeShot(
  //     {
  //       gameId: game.id,
  //       userId: user.id,
  //       cell: dto.cell,
  //     },
  //     botUserId,
  //   );
  //   if (userShot) {
  //     res.redirect(`/game/${game.id}`);
  //   }
  //   await this.gameService.makeBotShot(game.id, botUserId, user.id);
  //   res.redirect(`/game/${game.id}`);
  //   // if (isAdmin) {
  //   //   res.redirect('/');
  //   // } else {
  //   //   // const player = await this.userService.findById(user.id);
  //   //   const game = await this.gameService.getGameByUserId(user.id);
  //   //   // console.log('game', game);
  //   //   if (game.stage === placementStage) {
  //   //     res.redirect(`/placement`);
  //   //   } else {
  //   //     res.redirect(`/game/${game.id}`);
  //   //   }
  //   // }
  // }

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
    if (game.stage === placementStage) {
      const availableShips = await this.placementService.getAvailableShips(
        game.id,
        user.id,
      );
      if (availableShips.length > 0) {
        res.render('not-found', { isAuth: true });
        return;
      }
      await this.gameService.update(id, { stage: gamingStage });
      res.status(HttpStatus.OK).json({ gameId: game.id }).send();
    } else if (game.stage === gamingStage) {
      await this.gameService.update(id, { stage: resultStage });
    }
    return true;
    // res.render('game', {
    //   placementUser: [],
    //   placementOpponent: [],
    //   isAuth: true,
    // });
  }
}
