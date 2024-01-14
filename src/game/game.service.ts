import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
// import { RuleService } from 'src/rule/rule.service';
// import {
//   MapUserStartResetDto,
//   MapUserStartUpdateDto,
// } from 'src/placement/dto/placement.dto';
// import { LogUpdateDto } from './dto/game.dto';
// import { RuleService } from 'src/rule/rule.service';
import { closedStage, placementStage } from 'src/constants';
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
  shots: true,
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
    return await this.prisma.game.findFirst({
      where: {
        ...data,
        ...whereFilter,
      },
      include: includeSelect,
    });
  }

  async findByUserId(userId: number) {
    return await this.prisma.game.findFirst({
      where: {
        userId,
        ...whereFilter,
      },
      include: includeSelect,
    });
  }

  async create(userId: number) {
    const result = await this.prisma.game.create({
      data: {
        userId,
        stage: placementStage,
      },
      include: includeSelect,
    });
    return result;
  }

  async getGameByUserId(userId: number) {
    let game = await this.findByUserId(userId);
    // console.log('getGameByUserId', game);

    if (!game) {
      game = await this.create(userId);
      await this.placementService.placeShipsByBot(game.id, 0);
    }
    return game;
  }

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
}
