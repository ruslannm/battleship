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
import * as utils from 'src/placement//placement.utils';
import { UserService } from 'src/user/user.service';

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
    private readonly userService: UserService,
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

  async findManyClosedByUserId(userId: number) {
    return await this.prisma.game.findMany({
      where: {
        users: {
          some: {
            userId: userId,
          },
        },
        stage: closedStage,
      },
      include: {
        users: {
          select: {
            isFirstShooter: true,
            user: {
              select: {
                username: true,
              },
            },
          },
        },
        winner: {
          select: {
            username: true,
          },
        },
      },
    });
  }

  async findBestPlayers() {
    const participatedInGames = await this.prisma.usersInGames.groupBy({
      where: {
        game: {
          stage: closedStage,
        },
      },
      by: ['userId'],
      _count: {
        gameId: true,
      },
      having: {
        gameId: {
          _count: { gte: 10 },
        },
      },
    });
    const winInGames = await this.prisma.game.groupBy({
      where: {
        stage: closedStage,
      },
      by: ['winnerId'],
      _count: {
        id: true,
      },
    });
    const users = (await this.userService.findMany()).map((item) => {
      return {
        id: item.id,
        username: item.username,
      };
    });
    const bestPlayers = participatedInGames.map((item) => {
      const userId = item.userId;
      const username = users.filter((el) => el.id === userId).at(0).username;
      const amountWin = winInGames
        .filter((el) => {
          return el.winnerId === userId;
        })
        .at(0)._count.id;
      return { username, amountWin };
    });
    bestPlayers.sort((a, b) => b.amountWin - a.amountWin);
    return bestPlayers;
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
      if (resultShot) {
        const isWin = await this.checkAndUpdateWinner(
          gameId,
          botUserId,
          playerUserId,
        );
        if (isWin) {
          resultShot = false;
        }
      }
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

  /** Проверить что установлены все корабли и перейти на игру */
  async checkAndUpdateStage(
    gameId: number,
    userId: number,
    stage: string,
    opponentId: number,
  ) {
    if (
      stage === placementStage &&
      (await this.isFullPlacement(gameId, userId))
    ) {
      const game = await this.update(gameId, { stage: gamingStage });
      if (game) {
        const firstShooterId = game.users
          .filter((item) => item.isFirstShooter)
          .at(0).userId;
        if (firstShooterId === opponentId) {
          await this.makeBotShot(gameId, opponentId, userId);
        }
        return game.stage;
      }
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

  //** После каждого выстрела проверить и зафиксировать выигрыш */
  async checkAndUpdateWinner(
    gameId: number,
    userId: number,
    opponentId: number,
  ) {
    const appliedCells = await this.placementService.getAppliedCells(
      gameId,
      opponentId,
    );
    const takenCells = appliedCells['takenCells'].map((item) => item.cell);
    const game = await this.findById(gameId);
    const userShots = game.shots
      .filter((item) => item.user.id === userId)
      .map((item) => item.cell);

    const opponentGoodShips = takenCells.filter(
      (cell) => !userShots.includes(cell),
    );

    if (opponentGoodShips.length === 0) {
      await this.update(gameId, { stage: closedStage });
      await this.update(gameId, { winnerId: userId });
      return true;
    }
    return false;
  }

  /** Ячейки которые можно нажимать при установке корабля и при выстрелах */
  getButtons(
    stage: string,
    userId: number,
    takenCells: number[],
    spaceAroundCells: number[],
    opponentShots: number[],
  ) {
    if (stage === placementStage && userId !== botUserId) {
      return [...Array(100).keys()]
        .filter((cell) => !takenCells.includes(cell))
        .filter((cell) => !spaceAroundCells.includes(cell));
    }
    if (stage === gamingStage && userId === botUserId) {
      return [...Array(100).keys()].filter(
        (cell) => !opponentShots.includes(cell),
      );
    }
    return [];
  }

  /** корабли */
  getShips(
    stage: string,
    userId: number,
    takenCells: number[],
    opponentShots: number[],
  ) {
    if (stage === placementStage && userId !== botUserId) {
      return {
        goodShips: takenCells,
        badShips: [],
      };
    }
    if (stage === gamingStage) {
      const goodShips = takenCells.filter(
        (cell) => !opponentShots.includes(cell),
      );
      const badShips = takenCells.filter((cell) =>
        opponentShots.includes(cell),
      );
      if (userId === botUserId) {
        return {
          goodShips: [],
          badShips,
        };
      }
      return {
        goodShips,
        badShips,
      };
    }
    return {
      goodShips: [],
      badShips: [],
    };
  }

  /** промахи */
  getMissingCells(
    stage: string,
    takenCells: number[],
    opponentShots: number[],
  ) {
    if (stage === gamingStage) {
      return opponentShots.filter((cell) => !takenCells.includes(cell));
    }
    return [];
  }

  async getMap(
    gameId: number,
    userId: number,
    opponentId: number,
    stage: string,
  ) {
    let takenCells = [];
    let spaceAroundCells = [];
    let opponentShots = [];
    if (stage !== createGameStage) {
      const appliedCells = await this.placementService.getAppliedCells(
        gameId,
        userId,
      );
      takenCells = appliedCells['takenCells'].map((item) => item.cell);
      spaceAroundCells = appliedCells['spaceAroundCells'].map(
        (item) => item.cell,
      );
    }
    if (stage === gamingStage) {
      const game = await this.find({ id: gameId, userId });
      opponentShots = game.shots
        .filter((item) => item.user.id === opponentId)
        .map((item) => item.cell);
    }
    const result = [];
    const buttons = this.getButtons(
      stage,
      userId,
      takenCells,
      spaceAroundCells,
      opponentShots,
    );
    const ships = this.getShips(stage, userId, takenCells, opponentShots);
    const missingCells = this.getMissingCells(stage, takenCells, opponentShots);
    console.log(gameId, userId, opponentId, stage);
    // console.log('takenCells', takenCells);
    // console.log('spaceAroundCells', spaceAroundCells);
    console.log(buttons, ships, missingCells);

    for (let rowIdx: number = 0; rowIdx < 10; rowIdx++) {
      const row = [];
      for (let columnIdx = 0; columnIdx < 10; columnIdx++) {
        const cell = utils.getCellIdx(rowIdx, columnIdx);
        const cellProps = {
          isButton: buttons.includes(cell),
          isGoodShip: ships['goodShips'].includes(cell),
          isBadShip: ships['badShips'].includes(cell),
          isMissingCell: missingCells.includes(cell),
        };
        row.push({
          cell,
          ...cellProps,
        });
      }
      result.push({ row, rowNumber: rowIdx + 1 });
    }
    // console.log(result.at(1).row);
    return result;

    // console.log('takenCells, spaceAroundCells', takenCells, spaceAroundCells);
  }
}
