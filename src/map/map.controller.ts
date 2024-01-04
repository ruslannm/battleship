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
import { MapService } from './map.service';
import { MapDto } from 'src/map/dto/map.dto';

@UseGuards(AccessJwtGuard)
@Controller('map')
export class MapController {
  constructor(
    private readonly gameService: GameService,
    private readonly ruleService: RuleService,
    private readonly mapService: MapService,
  ) { }

  @Get()
  async render(@Req() req: Request, @Res() res: Response) {
    const user = req.user as UserValidatedDto;
    // console.log('user', user, 'id', id);

    const game = await this.gameService.getGameByUserId(user.id);
    // console.log('game/ / map', game);
    if (!game) {
      res.render('not-found', { isAuth: true });
      return;
    }
    // console.log('2 game/ / map', game);
    // const user = req.user as UserValidatedDto;
    const rules = await this.ruleService.findMany();
    // console.log(rules);
    const map = await this.mapService.getMapForRender(
      game.mapUserStart,
      game.mapUser,
      true,
    );
    res.render('map', {
      rules,
      map,
      isAuth: true,
    });
  }

  @Post()
  async post(
    @Req() req: Request,
    @Res() res: Response,
    @Body() dto: MapDto,
  ): Promise<void> {
    // console.log('dto', dto);
    const user = req.user as UserValidatedDto;
    const isAdmin = user.role === 'admin';
    if (isAdmin) {
      res.redirect('/');
    } else {
      // console.log('body', req.body);
      const { rule, cells } = dto;
      if (typeof cells === 'string') {
      }
      console.log('ruleItem. cells', rule, cells, typeof cells);
      // const player = await this.userService.findById(user.id);
      const game = await this.gameService.getGameByUserId(user.id);
      const newGame = await this.mapService.placeShip(game.id, dto);
      console.log('newGame', newGame);
      if (newGame) {
        res.redirect(`/map`);
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
