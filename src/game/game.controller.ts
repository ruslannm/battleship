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
    const game = await this.gameService.getGameByUserId(user.id);
    if (game.stage === placementStage) {
      res.redirect(`/placement`);
    } else {
      res.redirect(`/game/${game.id}`);
    }
  }

  @Post('')
  async post(@Req() req: Request, @Res() res: Response): Promise<void> {
    const user = req.user as UserValidatedDto;
    const isAdmin = user.role === 'admin';
    if (isAdmin) {
      res.redirect('/');
    } else {
      // const player = await this.userService.findById(user.id);
      const game = await this.gameService.getGameByUserId(user.id);
      // console.log('game', game);
      if (game.stage === placementStage) {
        res.redirect(`/placement`);
      } else {
        res.redirect(`/game/${game.id}`);
      }
    }
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
