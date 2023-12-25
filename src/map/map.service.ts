import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Game } from '@prisma/client';
import { RuleService } from 'src/rule/rule.service';

const defaultMap = '0'.repeat(100);

@Injectable()
export class MapService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ruleService: RuleService,
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
        isActive: false,
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

  private getCellText(row: number, column: number): string {
    if (
      column === 0 ||
      (column === 1 && row === 0) ||
      (column > 1 && row > 0)
    ) {
      return ' ';
    }
    if (row == 0) {
      return 'ABCDEFGHKL'.charAt(column - 2);
    }
    if (column == 1) {
      return [...Array(10).keys()]
        .map((i) => i + 1)
        .at(row - 1)
        .toString();
    }
    return ' ';
  }

  private getCellProps(
    row: number,
    column: number,
    cellValue: string,
  ): { isButton: boolean; isDisabled: boolean } {
    if (column < 2 || row < 1) {
      return { isButton: false, isDisabled: true };
    }
    if (cellValue === '-') {
      return { isButton: true, isDisabled: true };
    }
    if (cellValue === '0') {
      return { isButton: true, isDisabled: false };
    }
    return { isButton: true, isDisabled: true };
  }

  private getCellIdx(rowIdx: number, columnIdx: number) {
    return rowIdx * 12 + columnIdx;
  }

  getMapForRender(mapStart: string, mapCurrent: string, isUserMap: boolean) {
    const result = [];
    for (let rowIdx: number = 0; rowIdx < 11; rowIdx++) {
      const row = [];
      for (let columnIdx = 0; columnIdx < 12; columnIdx++) {
        const id = this.getCellIdx(rowIdx, columnIdx);
        const text = this.getCellText(rowIdx, columnIdx);
        const { isButton, isDisabled } = this.getCellProps(
          rowIdx,
          columnIdx,
          mapStart.at(id),
        );
        row.push({ id, text, isButton, isDisabled });
      }
      result.push({ row });
    }
    console.log(result.at(1).row);
    return result;

    //   row: [
    //     { id: '00', text: '', isButton: false, isDisabled: true },
    //     { id: '01', text: '', isButton: false, isDisabled: true },
    //     { id: '0A', text: 'A', isButton: false, isDisabled: true },
    //     { id: '0B', text: 'B', isButton: false, isDisabled: false },
    //     { id: '0C', text: 'C', isButton: false, isDisabled: false },
    //     { id: '0D', text: 'D', isButton: false, isDisabled: false },
    //     { id: '0E', text: 'E', isButton: false, isDisabled: false },
    //     { id: '0F', text: 'F', isButton: false, isDisabled: false },
    //     { id: '0G', text: 'G', isButton: false, isDisabled: false },
    //     { id: '0H', text: 'H', isButton: false, isDisabled: false },
    //     { id: '0K', text: 'K', isButton: false, isDisabled: false },
    //     { id: '0L', text: 'L', isButton: false, isDisabled: false },
    //   ],
    // },
    // {
    // row: [
    //   { id: '10', text: '', isButton: false, isDisabled: false },
    //   { id: '11', text: '1', isButton: false, isDisabled: false },
    //   { id: '1A', text: '', isButton: true, isDisabled: false },
    //   { id: '1B', text: ' ', isButton: true, isDisabled: false },
    //   { id: '1C', text: ' ', isButton: true, isDisabled: false },
    //   { id: '1D', text: ' ', isButton: true, isDisabled: false },
    //   { id: '1E', text: ' ', isButton: true, isDisabled: false },
    //   { id: '1F', text: ' ', isButton: true, isDisabled: false },
    //   { id: '1G', text: ' ', isButton: true, isDisabled: false },
    //   { id: '1H', text: ' ', isButton: true, isDisabled: false },
    //   { id: '1K', text: ' ', isButton: true, isDisabled: false },
    //   { id: '1L', text: ' ', isButton: true, isDisabled: false },
    // ],
    // },
    // }
  }
}
