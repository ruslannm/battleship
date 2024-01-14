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
import { gamingStage, placementStage, resultStage } from 'src/constants';
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
      res.render('game', {
        placementUser: [],
        placementOpponent: [],
        isAuth: true,
      });
    }
    // console.log('game', game);

    // const sheepsUser = [
    //   { name: null, count: 0 },
    //   { name: null, count: 0 },
    //   { name: null, count: 0 },
    //   { name: null, count: 0 },
    // ];
    // game.rules.forEach((item) => {
    //   sheepsUser[item.Sheep.length - 1].count += 1;
    //   sheepsUser[item.Sheep.length - 1].name =
    //     item.Sheep.name + ', ' + item.Sheep.length + 'кл.';
    // });
    // console.log('sheepsUser', sheepsUser, game.rules[0].Sheep.name);

    //console.log('findManySheeps', await this.ruleService.findManyAllSheeps());
    // const mapUser = this.mapService.getMapForRender(
    //   game.mapUserStart,
    //   game.mapUser,
    //   true,
    // );
    // const rules = await this.ruleService.findMany();
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
    console.log('Put', user, 'id', id);

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
      console.log('update');
      res.redirect(`/game/${game.id}`);
      return;
    } else if (game.stage === gamingStage) {
      await this.gameService.update(id, { stage: resultStage });
    }
    console.log('game');
    return true;
    // res.render('game', {
    //   placementUser: [],
    //   placementOpponent: [],
    //   isAuth: true,
    // });
  }
}
