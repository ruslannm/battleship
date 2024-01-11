import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RuleService } from 'src/rule/rule.service';
import { PlacementDto } from './dto/placement.dto';
import { GameService } from 'src/game/game.service';
import { columnsLegend, rowsLegend } from 'src/constants';

type takenCell = {
  cell: number;
  length: number;
};

@Injectable()
export class PlacementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gameService: GameService,
    private readonly ruleService: RuleService,
  ) { }

  private async getCellText(
    rowIdx: number,
    columnIdx: number,
    takenCells: takenCell[],
  ) {
    if (columnIdx > 0 && rowIdx > 0) {
      const values = takenCells.filter(
        (item) => item.cell === this.getCellIdx(rowIdx - 1, columnIdx - 1),
      );
      if (values.length > 0) {
        return values.at(0).length.toString();
      } else {
        return '';
      }
    }
    if (rowIdx == 0) {
      return columnsLegend.charAt(columnIdx - 1);
    }
    if (columnIdx == 0) {
      return rowsLegend.at(rowIdx - 1).toString();
    }
    return '';
  }

  private getCellProps(
    rowIdx: number,
    columnIdx: number,
    takenCells: takenCell[],
  ): { isButton: boolean; isDisabled: boolean; isAxis: boolean } {
    if (columnIdx < 1 || rowIdx < 1) {
      return { isButton: false, isDisabled: true, isAxis: true };
    }
    const values = takenCells.filter(
      (item) => item.cell === this.getCellIdx(rowIdx - 1, columnIdx - 1),
    );
    if (values.length > 0) {
      console.log('values', values);
      return { isButton: false, isDisabled: true, isAxis: false };
    } else {
      return { isButton: true, isDisabled: false, isAxis: false };
    }
  }

  private getCellIdx(rowIdx: number, columnIdx: number) {
    return rowIdx * 10 + columnIdx;
  }

  private getRenderMapCellIdx(rowIdx: number, columnIdx: number) {
    if (rowIdx === 0) {
      if (columnIdx === 0) {
        return 'map-row-col';
      }
      return 'map-col-' + columnsLegend.charAt(columnIdx - 1);
    }
    if (columnIdx === 0) {
      return 'map-row-' + rowsLegend.at(rowIdx - 1);
    }
    return this.getCellIdx(rowIdx - 1, columnIdx - 1).toString();
  }

  async getTakenCells(gameId: number, userId: number) {
    const placement = await this.prisma.placement.findMany({
      where: { gameId, userId },
      include: {
        Sheep: {
          select: {
            name: true,
            length: true,
          },
        },
        PlacementLog: true,
      },
    });
    // console.log('placement 1', placement, placement.at(0).PlacementLog.at(0));
    const takenCells = [];
    placement.forEach((item) => {
      item.PlacementLog.forEach((cell) => {
        takenCells.push({ cell: cell.cell, length: item.Sheep.length });
      });
    });
    return takenCells;
  }

  async getPlacementForRender(gameId: number, userId: number) {
    const result = [];
    const takenCells = await this.getTakenCells(gameId, userId);
    console.log('takenCells', takenCells);

    for (let rowIdx: number = 0; rowIdx < 11; rowIdx++) {
      const row = [];
      for (let columnIdx = 0; columnIdx < 11; columnIdx++) {
        const id = this.getRenderMapCellIdx(rowIdx, columnIdx);
        const text = await this.getCellText(rowIdx, columnIdx, takenCells);
        const { isButton, isDisabled, isAxis } = this.getCellProps(
          rowIdx,
          columnIdx,
          takenCells,
        );
        row.push({ id, text, isButton, isDisabled, isAxis });
      }
      result.push({ row });
    }
    console.log(result.at(1).row);
    return result;
  }

  private isHorizontalPosition(cells: number[]): boolean {
    if (cells.length <= 1) {
      return true;
    }
    if (cells.at(1) - cells.at(0) === 1) {
      return true;
    }
    return false;
  }

  private isInRange(cells: number[]) {
    if (cells.at(0) < 0 || cells.at(-1) > 99) {
      return false;
    }
    return true;
  }

  private isOnOneRow(cells: number[]) {
    return Math.floor(cells.at(0) / 10) === Math.floor(cells.at(-1) / 10);
  }

  private isValidForm(length: number, cells: number[]) {
    if (length !== cells.length) {
      return false;
    }
    if (length === 1) {
      return true;
    }
    const diff = cells.at(-1) - cells.at(0);
    if (this.isHorizontalPosition(cells)) {
      return diff === length - 1 && this.isOnOneRow(cells);
    } else {
      return diff === (length - 1) * 10;
    }
  }

  private isFreeAround(map: string, cells: number[]) {
    const result = cells.reduce((acc: number, item: number) => {
      const top = item < 10 ? 0 : Number(map.charAt(item - 10));
      const bottom = item > 89 ? 0 : Number(map.charAt(item + 10));
      const left = item % 10 === 0 ? 0 : Number(map.charAt(item - 1));
      const rigth = (item + 1) % 10 === 0 ? 0 : Number(map.charAt(item + 1));
      const topLeft =
        item < 10 || item % 10 === 0 ? 0 : Number(map.charAt(item - 11));
      const topRight =
        item < 10 || (item + 1) % 10 === 0 ? 0 : Number(map.charAt(item - 9));
      const bottomLeft =
        item > 89 || item % 10 === 0 ? 0 : Number(map.charAt(item + 9));
      const bottomRight =
        item > 89 || (item + 1) % 10 === 0 ? 0 : Number(map.charAt(item + 11));

      // console.log(
      //   item,
      //   'item',
      //   top,
      //   bottom,
      //   left,
      //   rigth,
      //   topLeft,
      //   topRight,
      //   bottomLeft,
      //   bottomRight,
      // );

      return (
        acc +
        top +
        bottom +
        left +
        rigth +
        topLeft +
        topRight +
        bottomLeft +
        bottomRight
      );
    }, 0);
    return result === 0;
  }

  getSheepCoord(cells: number[]) {
    const result = cells.map((item) => {
      const rowIdx = Math.floor(item / 10);
      const columnIdx = item % 10;
      return columnsLegend.charAt(columnIdx) + rowsLegend.at(rowIdx).toString();
    });
    return result;
  }

  private compareNumbers(a: number, b: number) {
    return a - b;
  }

  async getInstalledShips(gameId: number, userId: number) {
    const placement = await this.prisma.placement.groupBy({
      where: { gameId, userId },
      by: ['sheepId'],
      _count: {
        _all: true,
      },
    });
    // console.log('getShips', placement);
    return placement.map((item) => {
      return {
        sheepId: item.sheepId,
        quantity: item._count._all,
      };
    });
  }

  async getAvailableShips(gameId: number, userId: number) {
    const installedSheeps = await this.getInstalledShips(gameId, userId);
    // console.log('installedSheeps', installedSheeps);
    const rules = await this.ruleService.findMany();
    const availableShips = [];
    rules.forEach((item) => {
      const isInstalled = installedSheeps.filter(
        (installed) => installed.sheepId === item.sheepId,
      );
      // console.log('isInstalled', item.sheepId, isInstalled, isInstalled.length);
      const quantity =
        isInstalled.length > 0
          ? item.quantity - isInstalled.at(0).quantity
          : item.quantity;
      if (quantity > 0) {
        availableShips.push({
          sheepId: item.sheepId,
          quantity,
          name: item.Sheep.name,
          length: item.Sheep.length,
        });
      }
    });
    return availableShips;
  }

  async placeShip(gameId: number, userId: number, dto: PlacementDto) {
    const { sheepId, cells } = dto;
    // const game = await this.gameService.findById(gameId);
    const rule = await this.ruleService.findBySheepId(sheepId);
    const cellsSorted = [...new Set(cells)].sort(this.compareNumbers);
    // console.log('cellsSorted', cellsSorted, typeof cellsSorted.at(0));
    console.log('dto', dto);

    // console.log(this.isInRange(cellsSorted));
    // console.log(this.isValidForm(rule.Sheep.length, cellsSorted));
    // console.log(this.isFreeAround(game.mapUserStart, cellsSorted));
    if (
      this.isInRange(cellsSorted) &&
      this.isValidForm(rule.Sheep.length, cellsSorted)
      // &&
      // this.isFreeAround(game.mapUserStart, cellsSorted)
    ) {
      // const newMap = game.mapUserStart.split('');
      // cellsSorted.forEach((item) => {
      //   newMap.splice(item, 1, rule.Sheep.length.toString());
      // });
      // console.log("newMap.join('')", newMap.join(''));
      const cells = cellsSorted.map((item) => {
        return { cell: item };
      });

      const placement = await this.prisma.placement.create({
        data: {
          gameId,
          sheepId,
          userId,
          PlacementLog: {
            create: cells,
          },
        },
        include: {
          PlacementLog: true,
        },
      });
      console.log('placementNew', placement);
      return placement;
    }
    return null;
  }
}
