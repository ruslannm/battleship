import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RuleService {
  constructor(private readonly prisma: PrismaService) { }

  findMany() {
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
}
