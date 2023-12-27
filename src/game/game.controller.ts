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
import { MapService } from 'src/map/map.service';

@UseGuards(AccessJwtGuard)
@Controller('game')
export class GameController {
  constructor(
    private readonly userService: UserService,
    private readonly ruleService: RuleService,
    private readonly gameService: GameService,
    private readonly mapService: MapService,
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
    console.log('user', user, 'id', id);

    const game = await this.gameService.find({ id, userId: user.id });
    if (!game) {
      res.redirect('/');
    }
    console.log('game', game);

    const mapUser = this.mapService.getMapForRender(
      game.mapUserStart,
      game.mapUser,
      true,
    );
    const rules = await this.ruleService.findMany();
    // console.log(rules);
    // const map = [
    //   {
    //     row: [
    //       { id: '00', text: '', isButton: false, isDisabled: true },
    //       { id: '01', text: '', isButton: false, isDisabled: true },
    //       { id: '0A', text: 'A', isButton: false, isDisabled: true },
    //       { id: '0B', text: 'B', isButton: false, isDisabled: false },
    //       { id: '0C', text: 'C', isButton: false, isDisabled: false },
    //       { id: '0D', text: 'D', isButton: false, isDisabled: false },
    //       { id: '0E', text: 'E', isButton: false, isDisabled: false },
    //       { id: '0F', text: 'F', isButton: false, isDisabled: false },
    //       { id: '0G', text: 'G', isButton: false, isDisabled: false },
    //       { id: '0H', text: 'H', isButton: false, isDisabled: false },
    //       { id: '0K', text: 'K', isButton: false, isDisabled: false },
    //       { id: '0L', text: 'L', isButton: false, isDisabled: false },
    //     ],
    //   },
    //   {
    //     row: [
    //       { id: '10', text: '', isButton: false, isDisabled: false },
    //       { id: '11', text: '1', isButton: false, isDisabled: false },
    //       { id: '1A', text: '', isButton: true, isDisabled: false },
    //       { id: '1B', text: ' ', isButton: true, isDisabled: false },
    //       { id: '1C', text: ' ', isButton: true, isDisabled: false },
    //       { id: '1D', text: ' ', isButton: true, isDisabled: false },
    //       { id: '1E', text: ' ', isButton: true, isDisabled: false },
    //       { id: '1F', text: ' ', isButton: true, isDisabled: false },
    //       { id: '1G', text: ' ', isButton: true, isDisabled: false },
    //       { id: '1H', text: ' ', isButton: true, isDisabled: false },
    //       { id: '1K', text: ' ', isButton: true, isDisabled: false },
    //       { id: '1L', text: ' ', isButton: true, isDisabled: false },
    //     ],
    //   },
    //   {
    //     row: [
    //       { id: '20', text: '', isButton: false, isDisabled: false },
    //       { id: '21', text: '2', isButton: false, isDisabled: false },
    //       { id: '2A', text: '', isButton: true, isDisabled: false },
    //       { id: '2B', text: ' ', isButton: true, isDisabled: false },
    //       { id: '2C', text: ' ', isButton: true, isDisabled: false },
    //       { id: '2D', text: ' ', isButton: true, isDisabled: false },
    //       { id: '2E', text: ' ', isButton: true, isDisabled: false },
    //       { id: '2F', text: ' ', isButton: true, isDisabled: false },
    //       { id: '2G', text: ' ', isButton: true, isDisabled: false },
    //       { id: '2H', text: ' ', isButton: true, isDisabled: false },
    //       { id: '2K', text: ' ', isButton: true, isDisabled: false },
    //       { id: '2L', text: ' ', isButton: true, isDisabled: false },
    //     ],
    //   },
    // ];
    res.render('game', {
      rules,
      mapUser: { map: mapUser },
      isAuth: true,
    });
  }

  @Post('')
  async post(@Req() req: Request, @Res() res: Response): Promise<void> {
    console.log('POST -');
    const user = req.user as UserValidatedDto;
    const isAdmin = user.role === 'admin';
    if (isAdmin) {
      res.redirect('/');
    } else {
      console.log('POST');

      // const player = await this.userService.findById(user.id);
      const gameId = await this.gameService.getGameId(user.id);
      console.log('gameId', gameId);
      res.redirect(`game/${gameId}`);
    }
  }
}
