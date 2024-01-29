import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DockService {
  constructor(private readonly prisma: PrismaService) { }

  async findMany() {
    return this.prisma.dock.findMany({});
  }
}
