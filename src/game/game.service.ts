import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Game } from '@prisma/client';
import { RuleService } from 'src/rule/rule.service';
import { MapUserStartUpdateDto } from 'src/map/dto/map.dto';

const defaultMap = '0'.repeat(12 * 11);
const defaultStatus = 'placement';

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
        status: defaultStatus,
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

  async getGameByUserId(userId: number) {
    const game = await this.findByUserId(userId);
    if (game) {
      return game;
    }
    return await this.create(userId);
  }

  async update(id: number, data: MapUserStartUpdateDto) {
    try {
      const result = await this.prisma.game.update({
        where: { id },
        data: {
          ...data,
          Log: {
            create: { description: 'set sheep' },
          },
        },
        include: {
          Log: true,
          rules: {
            select: {
              Sheep: {
                select: {
                  name: true,
                  length: true,
                },
              },
            },
          },
        },
      });
      return result;
    } catch {
      throw new BadRequestException('Foreign key constraint failed');
    }
  }
}
