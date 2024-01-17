import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
// import { RuleService } from 'src/rule/rule.service';
// import {
//   MapUserStartResetDto,
//   MapUserStartUpdateDto,
// } from 'src/placement/dto/placement.dto';
// import { LogUpdateDto } from './dto/game.dto';
// import { RuleService } from 'src/rule/rule.service';
import {
  closedStage,
  columnsLegend,
  placementStage,
  rowsLegend,
  stages,
} from 'src/constants';
import { PlacementService } from 'src/placement/placement.service';
import { CreateShotDto } from './dto/game.dto';

// const fleetSelect = {
//   select: {
//     Sheep: {
//       select: {
//         name: true,
//         length: true,
//       },
//     },
//     quantity: true,
//   },
// };

const includeSelect = {
  shots: {
    select: {
      cell: true,
      user: true,
    },
  },
  users: true,
};

const whereFilter = {
  NOT: {
    stage: closedStage,
  },
};

@Injectable()
export class GameService {
  constructor(
    private readonly prisma: PrismaService,
    // private readonly ruleService: RuleService,
    private readonly placementService: PlacementService,
  ) { }

  async findMany() {
    return await this.prisma.game.findMany({
      where: whereFilter,
      include: includeSelect,
    });
  }

  async findById(id: number) {
    return await this.prisma.game.findFirst({
      where: {
        id,
        ...whereFilter,
      },
      include: includeSelect,
    });
  }

  async find(data: { id: number; userId: number }) {
    const whereGameIdUserId = {
      id: data.id,
      users: {
        some: {
          userId: data.userId,
        },
      },
    };
    return await this.prisma.game.findFirst({
      where: {
        ...whereGameIdUserId,
        ...whereFilter,
      },
      include: includeSelect,
    });
  }

  async findByUserId(userId: number) {
    return await this.prisma.game.findFirst({
      where: {
        users: {
          some: {
            userId: userId,
          },
        },
        ...whereFilter,
      },
      include: includeSelect,
    });
  }

  async create(playerId: number, opponentId: number, firstShooterId: number) {
    const result = await this.prisma.game.create({
      data: {
        users: {
          create: [
            {
              user: { connect: { id: playerId } },
              isFirstShooter: firstShooterId === playerId,
            },
            {
              user: { connect: { id: opponentId } },
              isFirstShooter: firstShooterId === opponentId,
            },
          ],
        },
        stage: stages[0],
      },
      include: includeSelect,
    });
    return result;
  }
  async updateUsersInGames(
    gameId: number,
    userId: number,
    isFirstShooter: boolean,
    data: { isPlacementCompleted: boolean },
  ) {
    await this.prisma.usersInGames.update({
      where: {
        userId_gameId_isFirstShooter: {
          gameId,
          userId,
          isFirstShooter,
        },
      },
      data,
    });
  }
  // async getGameByUserId(userId: number) {
  //   let game = await this.findByUserId(userId);
  //   // console.log('getGameByUserId', game);

  //   if (!game) {
  //     game = await this.create(userId);
  //     await this.placementService.placeShipsByBot(game.id, 0);
  //   }
  //   return game;
  // }

  async update(id: number, data: { stage: string }) {
    try {
      const result = await this.prisma.game.update({
        where: { id },
        data,
        include: includeSelect,
      });
      return result;
    } catch {
      throw new BadRequestException('Foreign key constraint failed');
    }
  }

  // async resetMap(id: number) {
  //   const deleteData = {
  //     mapUserStart: defaultMap,
  //     fleetUser: {
  //       set: [],
  //     },
  //     logs: {
  //       deleteMany: {},
  //     },
  //   };
  //   await this.update(id, deleteData);
  //   const logData = {
  //     logs: {
  //       create: { description: 'startLogMessage' },
  //     },
  //   };
  //   return await this.update(id, logData);
  // }

  async makeShot(data: CreateShotDto, opponentUserId: number) {
    await this.prisma.shot.create({
      data,
    });
    const { takenCells: takenCellsOpponets } =
      await this.placementService.getAppliedCells(data.gameId, opponentUserId);
    if (takenCellsOpponets.includes(data.cell)) {
      return true;
    }
    return false;
  }

  async makeBotShot(gameId: number, botUserId: number, playerUserId: number) {
    let resultShot = false;
    do {
      const makedShots = await this.prisma.shot.findMany({
        where: {
          gameId: gameId,
          userId: botUserId,
        },
      });
      const makedShotsCells = makedShots.map((item) => item.cell);
      const cells = [...Array(100).keys()].filter(
        (item) => !makedShotsCells.includes(item),
      );
      const cellsIdx = Math.floor(Math.random() * cells.length);
      const cell = cells.at(cellsIdx);
      resultShot = await this.makeShot(
        {
          gameId: gameId,
          userId: botUserId,
          cell,
        },
        playerUserId,
      );
    } while (resultShot);
    return resultShot;
  }

  getShotCoord(cell: number) {
    const rowIdx = Math.floor(cell / 10);
    const columnIdx = cell % 10;
    return columnsLegend.charAt(columnIdx) + rowsLegend.at(rowIdx).toString();
  }

  async getUserCurrentPlacement(
    gameId: number,
    userId: number,
    opponentId: number,
  ) {
    const game = await this.find({ id: gameId, userId });
    if (!game) {
      return false;
    }
    const shots = game.shots;
    const userPlacement = await this.placementService.getPlacementForRender(
      game.id,
      userId,
    );
    const opponentShots = shots
      .filter((item) => item.user.id === opponentId)
      .map((item) => item.cell);
    userPlacement.forEach((row) => {
      row['row'].forEach((item) => {
        if (opponentShots.includes(item.cell)) {
          if (item.text === '') {
            item.text = '-';
          } else {
            item.color = 'danger';
          }
        }
      });
    });
    return userPlacement;
  }

  async getOpponentCurrentPlacement(
    gameId: number,
    opponentId: number,
    userId: number,
  ) {
    const opponentPlacement = await this.getUserCurrentPlacement(
      gameId,
      opponentId,
      userId,
    );
    if (!opponentPlacement) {
      return opponentPlacement;
    }
    opponentPlacement.forEach((row) => {
      row['row'].forEach((item) => {
        if (item.isButton) {
          item.isButton = false;
          item.isRadio = true;
        }
        if (item.isShip) {
          if (item.color !== 'danger') {
            item.isShip = false;
            item.isRadio = true;
          }
        }
      });
    });
    return opponentPlacement;
  }
}
