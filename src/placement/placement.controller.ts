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
import { GameService } from 'src/game/game.service';
import { PlacementService } from './placement.service';
import { PlacementDto } from 'src/placement/dto/placement.dto';

@UseGuards(AccessJwtGuard)
@Controller('placement')
export class MapController {
  constructor(
    private readonly gameService: GameService,
    private readonly ruleService: RuleService,
    private readonly mapService: PlacementService,
  ) { }

  @Get()
  async render(@Req() req: Request, @Res() res: Response) {
    const user = req.user as UserValidatedDto;
    // console.log('user', user, 'id', id);

    const rules = await this.ruleService.findMany();
    // console.log('rules', rules);
    const fleetBot = rules.map((item) => {
      return { sheepId: item.sheepId, quantity: item.quantity };
    });
    console.log('fleetBot', fleetBot);
    const game = await this.gameService.getGameByUserId(user.id);
    // console.log('game/ / map', game);
    // { id: 1, stage: 'placement', userId: 2, logs: [] }
    if (!game || !(game.stage === 'placement')) {
      res.render('not-found', { isAuth: true });
      return;
    }
    const placement = await this.mapService.getPlacementForRender(
      game.id,
      user.id,
    );

    const availableShips = await this.mapService.getAvailableShips(
      game.id,
      user.id,
    );

    // console.log('2 game/ / map', placement[1]['row']);
    // console.log('2 game/ / map', game);
    // const user = req.user as UserValidatedDto;
    // const { unusedRules, gameRules } = { unusedRules: null, gameRules: null };
    // await this.ruleService.getRenderedGameRules(game.rules);
    // const rulesGame = game.rules;
    // console.log('rules/ rulesGame', rules);

    // console.log(rules);
    // const map = await this.mapService.getMapForRender(
    //   game.mapUserStart,
    //   game.mapUser,
    //   true,
    // );
    res.render('placement', {
      gameId: game.id,
      availableShips,
      // isSubmitDisabled: unusedRules.length === 0,
      // submitText: unusedRules.length === 0 ? 'Начать игру' : 'Применить',
      // isResetDisabled: game.status !== defaultStatus,
      Log: game.logs.slice(-10),
      map: placement,
      isAuth: true,
    });
  }

  @Post()
  async post(
    @Req() req: Request,
    @Res() res: Response,
    @Body() dto: PlacementDto,
  ): Promise<void> {
    // const dto = req.body;
    console.log('dto', dto);
    const user = req.user as UserValidatedDto;
    const isAdmin = user.role === 'admin';
    if (isAdmin) {
      res.redirect('/');
    } else {
      // console.log('body', req.body);

      // console.log('ruleItem. cells', rule, cells, typeof cells);
      // const player = await this.userService.findById(user.id);
      const game = await this.gameService.getGameByUserId(user.id);
      const placement = await this.mapService.placeShip(game.id, user.id, dto);
      // console.log('newGame', newGame);
      if (placement) {
        res.redirect(`/placement`);
      } else {
        res.redirect(`/#game-rules`);
      }
      // console.log('game', game);
      // if (game.status === 'placement') {
      //   res.redirect(`game/${game.id}/map`);
      // }
      // res.redirect(`/map`);
    }
  }
}