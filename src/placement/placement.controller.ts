import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Response, Request } from 'express';
import { AccessJwtGuard } from 'src/auth/access-jwt.guard';
import { UserValidatedDto } from 'src/user/dto/user.dto';
import { GameService } from 'src/game/game.service';
import { PlacementService } from './placement.service';
import { PlacementDto } from 'src/placement/dto/placement.dto';
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
    const user = req.user as UserValidatedDto;
    const game = await this.gameService.findByUserId(user.id);
    const shipCells = getShipCells(dto.firstCell, dto.secondCell);
    const placement = await this.placementService.placeShip(game.id, user.id, {
      shipLength: dto.shipLength,
      shipCells,
    });
    if (placement) {
      res.status(200).json({ success: true });
    } else {
      res.status(200).json({ success: false });
    }
  }
}
