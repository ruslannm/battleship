import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Game } from '@prisma/client';
import { RuleService } from 'src/rule/rule.service';

const defaultMap = '0'.repeat(12 * 11);

@Injectable()
export class GameService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ruleSrevice: RuleService,
  ) { }

  async findMany(): Promise<Game[]> {
    return await this.prisma.game.findMany({
      where: {
        isActive: true,
      },
    });
  }

  async findById(id: number): Promise<Game> {
    return await this.prisma.game.findFirst({
      where: {
        id,
        isActive: true,
      },
    });
  }

  async find(data: { id: number; userId: number }): Promise<Game> {
    return await this.prisma.game.findFirst({
      where: {
        ...data,
        isActive: true,
      },
    });
  }

  async findByUserId(userId: number): Promise<Game> {
    return await this.prisma.game.findFirst({
      where: {
        userId,
        isActive: true,
      },
    });
  }

  async create(userId: number) {
    // const rules = await this.ruleSrevice.findMany();
    const result = await this.prisma.game.create({
      data: {
        userId,
        isActive: true,
        mapUserStart: defaultMap,
        mapUser: defaultMap,
        mapBotStart: defaultMap,
        mapBot: defaultMap,
        Log: {
          create: [{ description: 'init map' }],
        },
      },
    });
    console.log('game', result);

    return result;
  }

  async getGameId(userId: number) {
    const game = await this.findByUserId(userId);
    if (game) {
      return game.id;
    }
    return (await this.create(userId)).id;
  }
}
