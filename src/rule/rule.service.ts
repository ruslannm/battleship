import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RuleService {
  constructor(private readonly databaseService: PrismaService) { }

  findMany() {
    return this.databaseService.rule.findMany({
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
