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
  botUserId,
  closedStage,
  columnsLegend,
  createGameStage,
  gamingStage,
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
      id: true,
      cell: true,
      user: true,
    },
  },
  users: true,
  winner: true,
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

  async update(id: number, data: { stage: string } | { winnerId: number }) {
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
    console.log(
      'opponentUserId, takenCellsOpponets, data.cell',
      opponentUserId,
      takenCellsOpponets,
      data.cell,
    );
    const takenCells = takenCellsOpponets.map((item) => item.cell);
    if (takenCells.includes(data.cell)) {
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
      console.log('BOT cell, resultShot', cell, resultShot);
    } while (resultShot);
    return resultShot;
  }

  getShotCoord(cell: number) {
    const rowIdx = Math.floor(cell / 10);
    const columnIdx = cell % 10;
    return columnsLegend.charAt(columnIdx) + rowsLegend.at(rowIdx).toString();
  }

  async getShotReverseOrder(gameId: number) {
    const game = await this.findById(gameId);
    const shots = game.shots;
    shots.forEach((item, idx) => {
      item.id = idx + 1;
    });
    shots.sort((a, b) => b.id - a.id);
    return shots.map((item) => {
      return {
        id: item.id,
        username: item.user.username,
        cell: this.getShotCoord(item.cell),
        bgcolor: item.user.id === botUserId ? 'light' : 'white',
        isBot: item.user.id === botUserId,
      };
    });
  }

  getGameStage(stage: string) {
    return {
      isCreateGameStage: stage === createGameStage,
      isPlacementStage: stage === placementStage,
      isGamingStage: stage === gamingStage,
    };
  }

  async checkAndUpdateStage(gameId: number, userId: number, stage: string) {
    if (stage === placementStage) {
      if (await this.isFullPlacement(gameId, userId)) {
        const game = await this.update(gameId, { stage: gamingStage });
        if (game) {
          return game.stage;
        }
      }
    }
    if (stage === gamingStage) {
      console.log('Проверить проигрыш одного из игроков');
      return stage;
    }
    return stage;
  }

  async isFullPlacement(gameId: number, userId: number) {
    const availableShips = await this.placementService.getAvailableShips(
      gameId,
      userId,
    );
    return availableShips.length === 0;
  }

  getButtons(gameId: number, userId: number, stage: string) {
    if (stage === createGameStage) {
      return [];
    }
    if (stage === placementStage) {
      if (userId === botUserId) {
        return [];
      }
      // определить поля свободные от кораблей и отчуждений
      return [];
    }
    if (stage === gamingStage) {
      if (userId !== botUserId) {
        return [];
      }
      // поля по которым не стрелял
      return [];
    }
    return [];
  }

  getGoodShip(gameId: number, userId: number, stage: string) {
    if (stage === createGameStage) {
      return [];
    }
    if (stage === placementStage) {
      if (userId === botUserId) {
        return [];
      }
      // определить поля
      return [];
    }
    if (stage === gamingStage) {
      if (userId === botUserId) {
        return []; //всегда пусто
      }
      // неподбитые корабли
      return [];
    }
    return [];
  }

  getBadShip(gameId: number, userId: number, stage: string) {
    if (stage === createGameStage) {
      return [];
    }
    if (stage === placementStage) {
      return []; // всегда пусто
    }
    if (stage === gamingStage) {
      if (userId === botUserId) {
        return []; //рассчитать
      }
      // подбитые корабли
      return [];
    }
    return [];
  }

  getMissingCell(gameId: number, userId: number, stage: string) {
    if (stage === createGameStage) {
      return [];
    }
    if (stage === placementStage) {
      return []; // всегда пусто
    }
    if (stage === gamingStage) {
      if (userId === botUserId) {
        return []; //рассчитать
      }
      // рассчитать
      return [];
    }
    return [];
  }
}
