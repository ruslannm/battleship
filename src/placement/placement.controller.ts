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
import { Response, Request } from 'express';
import { AccessJwtGuard } from 'src/auth/access-jwt.guard';
import { UserValidatedDto } from 'src/user/dto/user.dto';
import { GameService } from 'src/game/game.service';
import { PlacementService } from './placement.service';
import { PlacementDto } from 'src/placement/dto/placement.dto';
import { placementStage } from 'src/constants';

@UseGuards(AccessJwtGuard)
@Controller('placements')
export class MapController {
  constructor(
    private readonly gameService: GameService,
    // private readonly ruleService: RuleService,
    private readonly placementService: PlacementService,
  ) { }

  @Get()
  async render(@Req() req: Request, @Res() res: Response) {
    const user = req.user as UserValidatedDto;
    const game = await this.gameService.findByUserId(user.id);
    console.log('game', game);

    if (!game) {
      res.render('not-found', { isAuth: true });
      return;
    }
    if (!(game.stage === placementStage)) {
      res.redirect(`/game/${game.id}`);
      return;
    }

    const placement = await this.placementService.getPlacementForRender(
      game.id,
      user.id,
    );

    const availableShips = await this.placementService.getAvailableShips(
      game.id,
      user.id,
    );
    res.render('placement', {
      gameId: game.id,
      availableShips,
      isSubmitDisabled: availableShips.length === 0,
      // submitText: availableShips.length === 0 ? 'Начать игру' : 'Применить',
      isResetDisabled: game.stage !== placementStage,
      // Log: game.logs.slice(-10),
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
    // console.log('body', req.body);

    // console.log('ruleItem. cells', rule, cells, typeof cells);
    // const player = await this.userService.findById(user.id);
    const game = await this.gameService.findByUserId(user.id);
    const placement = await this.placementService.placeShip(
      game.id,
      user.id,
      dto,
    );
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

  @Delete()
  async deletePlacement(@Req() req: Request, @Res() res: Response) {
    const user = req.user as UserValidatedDto;
    const game = await this.gameService.findByUserId(user.id);
    if (!game || !(game.stage === placementStage)) {
      throw new NotFoundException();
    }
    await this.placementService.deletePlacement(game.id, user.id);
    return res.status(200).json({ success: true });
  }
}
