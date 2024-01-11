import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RuleDto } from './dto/rule.dto';

@Injectable()
export class RuleService {
  constructor(private readonly prisma: PrismaService) { }

  async findMany() {
    return this.prisma.rule.findMany({
      include: {
        Sheep: {
          select: {
            name: true,
            length: true,
          },
        },
      },
    });
  }

  async findById(id: number) {
    return await this.prisma.rule.findFirst({
      where: {
        id,
      },
      include: {
        Sheep: {
          select: {
            name: true,
            length: true,
          },
        },
      },
    });
  }

  async findBySheepId(sheepId: number) {
    return await this.prisma.rule.findFirst({
      where: {
        sheepId,
      },
      include: {
        Sheep: {
          select: {
            name: true,
            length: true,
          },
        },
      },
    });
  }

  async getRenderedGameRules(gameRules: RuleDto[]) {
    const allRules = await this.findMany();
    const addDisabledStatusRules = allRules.map((item) => {
      const ruleId = item.id;
      const usedRules = gameRules.filter(
        (usedRuleItem) => usedRuleItem.id === ruleId,
      );
      if (usedRules.length > 0) {
        item['isDisabled'] = true;
      }
      return item;
    });
    const unusedRules = addDisabledStatusRules.filter(
      (item) => !('isDisabled' in item),
    );
    const usedRules = addDisabledStatusRules.filter(
      (item) => 'isDisabled' in item,
    );
    return { unusedRules, gameRules: [...unusedRules, ...usedRules] };
  }

  async findManyAllSheeps() {
    const allRules = await this.prisma.rule.groupBy({
      by: ['sheepId'],
      _count: {
        _all: true,
      },
    });
    return allRules.map((item) => {
      return {
        sheepId: item.sheepId,
        count: item._count._all,
      };
    });
  }
}
