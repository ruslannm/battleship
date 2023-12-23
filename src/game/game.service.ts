import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Game } from '@prisma/client';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) { }

  async findMany(): Promise<Game[]> {
    return await this.prisma.game.findMany({
      where: {
        isActive: true,
      },
    });
  }
}
