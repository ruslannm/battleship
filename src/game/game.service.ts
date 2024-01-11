import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
// import { RuleService } from 'src/rule/rule.service';
import {
  MapUserStartResetDto,
  MapUserStartUpdateDto,
} from 'src/placement/dto/placement.dto';
import { LogUpdateDto } from './dto/game.dto';
import { RuleService } from 'src/rule/rule.service';
import { defaultMap, defaultStage } from 'src/constants';

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
  logs: true,
};

const whereFilter = {
  NOT: {
    stage: 'closed',
  },
};

@Injectable()
export class GameService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ruleService: RuleService,
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
    // const rules = await this.ruleSrevice.findMany();
    const rules = await this.ruleService.findMany();
    console.log('rules', rules);
    const fleetBot = rules.map((item) => {
      return { sheepId: item.sheepId, quantity: item.quantity };
    });
    console.log('fleetBot', fleetBot);
    // return [];
    const result = await this.prisma.game.create({
      data: {
        userId,
        stage: defaultStage,

        // fleetBot: {
        //   connect: [],
        // },
      },
      include: includeSelect,
    });
    // console.log('game', result);

    return result;
  }

  async getGameByUserId(userId: number) {
    const game = await this.findByUserId(userId);
    // console.log('getGameByUserId', game);

    if (game) {
      return game;
    }
    return await this.create(userId);
  }

  // async update(
  //   id: number,
  //   data: MapUserStartUpdateDto | MapUserStartResetDto | LogUpdateDto,
  // ) {
  //   try {
  //     const result = await this.prisma.game.update({
  //       where: { id },
  //       data,
  //       include: includeSelect,
  //     });
  //     return result;
  //   } catch {
  //     throw new BadRequestException('Foreign key constraint failed');
  //   }
  // }

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
}
