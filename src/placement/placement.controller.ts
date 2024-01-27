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
import { getShipCells } from './placement.utils';

@UseGuards(AccessJwtGuard)
@Controller('placements')
export class MapController {
  constructor(
    private readonly gameService: GameService,
    // private readonly ruleService: RuleService,
    private readonly placementService: PlacementService,
  ) { }

  @Post()
  async post(
    @Req() req: Request,
    @Res() res: Response,
    @Body() dto: PlacementDto,
  ): Promise<void> {
    // const dto = req.body;
    // console.log('req dto', req);
    console.log('POST dto', dto);
    const user = req.user as UserValidatedDto;
    // console.log('body', req.body);

    // console.log('ruleItem. cells', rule, cells, typeof cells);
    // const player = await this.userService.findById(user.id);
    const game = await this.gameService.findByUserId(user.id);
    const shipCells = getShipCells(dto.firstCell, dto.secondCell);
    const placement = await this.placementService.placeShip(game.id, user.id, {
      shipLength: dto.shipLength,
      shipCells,
    });
    console.log('placement', placement);
    if (placement) {
      res.status(200).json({ success: true });
    } else {
      res.status(200).json({ success: false });
    }
  }

  // @Delete()
  // async deletePlacement(@Req() req: Request, @Res() res: Response) {
  //   const user = req.user as UserValidatedDto;
  //   const game = await this.gameService.findByUserId(user.id);
  //   if (!game || !(game.stage === placementStage)) {
  //     throw new NotFoundException();
  //   }
  //   await this.placementService.deletePlacement(game.id, user.id);
  //   return res.status(200).json({ success: true });
  // }
}
