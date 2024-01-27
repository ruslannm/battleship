import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
// import { RuleDto } from './dto/rule.dto';

// const includeSelect = {
//   ship: {
//     select: {
//       name: true,
//       length: true,
//     },
//   },
// };

@Injectable()
export class DockService {
  constructor(private readonly prisma: PrismaService) { }

  async findMany() {
    return this.prisma.dock.findMany({});
  }

  // async findById(id: number) {
  //   return await this.prisma.dock.findFirst({
  //     where: {
  //       id,
  //     },
  //   });
  // }

  // async findByShipLength(shipLength: number) {
  //   return await this.prisma.dock.findFirst({
  //     where: {
  //       shipLength,
  //     },
  //   });
  // }

  // async getRenderedGameRules(gameRules: RuleDto[]) {
  //   const allRules = await this.findMany();
  //   const addDisabledStatusRules = allRules.map((item) => {
  //     const ruleId = item.id;
  //     const usedRules = gameRules.filter(
  //       (usedRuleItem) => usedRuleItem.id === ruleId,
  //     );
  //     if (usedRules.length > 0) {
  //       item['isDisabled'] = true;
  //     }
  //     return item;
  //   });
  //   const unusedRules = addDisabledStatusRules.filter(
  //     (item) => !('isDisabled' in item),
  //   );
  //   const usedRules = addDisabledStatusRules.filter(
  //     (item) => 'isDisabled' in item,
  //   );
  //   return { unusedRules, gameRules: [...unusedRules, ...usedRules] };
  // }

  // async findManyAllSheeps() {
  //   const allRules = await this.prisma.rule.groupBy({
  //     by: ['shipId'],
  //     _count: {
  //       _all: true,
  //     },
  //   });
  //   return allRules.map((item) => {
  //     return {
  //       shipId: item.shipId,
  //       count: item._count._all,
  //     };
  //   });
  // }
}
