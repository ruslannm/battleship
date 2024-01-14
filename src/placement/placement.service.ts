import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RuleService } from 'src/rule/rule.service';
import { PlacementDto } from './dto/placement.dto';
// import { GameService } from 'src/game/game.service';
import { columnsLegend, rowsLegend } from 'src/constants';

type appliedCell = {
  cell: number;
  length: number;
};

@Injectable()
export class PlacementService {
  constructor(
    private readonly prisma: PrismaService,
    // private readonly gameService: GameService,
    private readonly ruleService: RuleService,
  ) { }

  private async getCellText(
    rowIdx: number,
    columnIdx: number,
    takenCells: appliedCell[],
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
    takenCells: appliedCell[],
    spaceAroundCells: appliedCell[],
    isFullPlacement: boolean,
  ): { isButton: boolean; isDisabled: boolean; isAxis: boolean } {
    if (columnIdx < 1 || rowIdx < 1) {
      return { isButton: false, isDisabled: true, isAxis: true };
    }
    const takenCellsValues = takenCells.filter(
      (item) => item.cell === this.getCellIdx(rowIdx - 1, columnIdx - 1),
    );
    if (takenCellsValues.length > 0) {
      // console.log('values', takenCellsValues);
      return { isButton: false, isDisabled: true, isAxis: false };
    } else {
      const spaceAroundCellsValues = spaceAroundCells.filter(
        (item) => item.cell === this.getCellIdx(rowIdx - 1, columnIdx - 1),
      );
      if (spaceAroundCellsValues.length > 0) {
        // console.log('values', spaceAroundCellsValues);
        return { isButton: true, isDisabled: true, isAxis: false };
      }
    }
    return { isButton: true, isDisabled: isFullPlacement, isAxis: false };
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

  async getAppliedCells(gameId: number, userId: number) {
    const placement = await this.prisma.placement.findMany({
      where: { gameId, userId },
      include: {
        Ship: {
          select: {
            name: true,
            length: true,
          },
        },
        TakenCells: true,
        SpaceAroundCells: true,
      },
    });
    // console.log('placement 1', placement, placement.at(0).PlacementLog.at(0));
    const takenCells = [];
    placement.forEach((item) => {
      item.TakenCells.forEach((cell) => {
        takenCells.push({ cell: cell.cell, length: item.Ship.length });
      });
    });
    let spaceAroundCells = [];
    placement.forEach((item) => {
      item.SpaceAroundCells.forEach((cell) => {
        spaceAroundCells.push({ cell: cell.cell, length: 0 });
      });
    });
    spaceAroundCells = [...new Set(spaceAroundCells)];
    return { takenCells, spaceAroundCells };
  }

  async getPlacementForRender(gameId: number, userId: number) {
    const result = [];
    const { takenCells, spaceAroundCells } = await this.getAppliedCells(
      gameId,
      userId,
    );
    const availableShips = await this.getAvailableShips(gameId, userId);
    const isFullPlacement = availableShips.length === 0;
    for (let rowIdx: number = 0; rowIdx < 11; rowIdx++) {
      const row = [];
      for (let columnIdx = 0; columnIdx < 11; columnIdx++) {
        const id = this.getRenderMapCellIdx(rowIdx, columnIdx);
        const text = await this.getCellText(rowIdx, columnIdx, takenCells);
        const { isButton, isDisabled, isAxis } = this.getCellProps(
          rowIdx,
          columnIdx,
          takenCells,
          spaceAroundCells,
          isFullPlacement,
        );
        row.push({ id, text, isButton, isDisabled, isAxis });
      }
      result.push({ row });
    }
    // console.log(result.at(1).row);
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

  private getSpaceAroundCells(cell: number) {
    const isLeftBorder = cell % 10 === 0;
    if (isLeftBorder) {
      return [cell - 10, cell - 9, cell + 1, cell + 10, cell + 11];
    }
    const isRightBorder = (cell + 1) % 10 === 0;
    if (isRightBorder) {
      return [cell - 1, cell - 10, cell - 11, cell + 9, cell + 10];
    }
    return [
      cell - 1,
      cell - 10,
      cell - 11,
      cell - 9,
      cell + 1,
      cell + 9,
      cell + 10,
      cell + 11,
    ];
  }

  private isFreeAround(takenCells: number[], cells: number[]) {
    let intersection = cells.filter((item) => takenCells.includes(item));
    if (intersection.length > 0) {
      return { isFreeAround: false, cellsAround: null };
    }
    let shipSpaceAroundCells = [];
    cells.forEach((item) => {
      shipSpaceAroundCells.push(...this.getSpaceAroundCells(item));
    });
    shipSpaceAroundCells = [...new Set(shipSpaceAroundCells)]
      .sort(this.compareNumbers)
      .filter((item) => item >= 0 && item < 100);

    intersection = shipSpaceAroundCells.filter((item) =>
      takenCells.includes(item),
    );
    if (intersection.length > 0) {
      return { isFreeAround: false, spaceAroundCells: null };
    }

    shipSpaceAroundCells = shipSpaceAroundCells
      .filter((item) => !cells.includes(item))
      .map((item) => {
        return { cell: item };
      });

    return { isFreeAround: true, shipSpaceAroundCells };
  }

  // DeletegetShipCoordDelete(cells: number[]) {
  //   const result = cells.map((item) => {
  //     const rowIdx = Math.floor(item / 10);
  //     const columnIdx = item % 10;
  //     return columnsLegend.charAt(columnIdx) + rowsLegend.at(rowIdx).toString();
  //   });
  //   return result;
  // }

  private compareNumbers(a: number, b: number) {
    return a - b;
  }

  async getInstalledShips(gameId: number, userId: number) {
    const placement = await this.prisma.placement.groupBy({
      where: { gameId, userId },
      by: ['shipId'],
      _count: {
        _all: true,
      },
    });
    // console.log('getShips', placement);
    return placement.map((item) => {
      return {
        shipId: item.shipId,
        quantity: item._count._all,
      };
    });
  }

  async getAvailableShips(gameId: number, userId: number) {
    const installedShips = await this.getInstalledShips(gameId, userId);
    const rules = await this.ruleService.findMany();
    const availableShips = [];
    rules.forEach((item) => {
      const isInstalled = installedShips.filter(
        (installed) => installed.shipId === item.shipId,
      );
      // console.log('isInstalled', item.sheepId, isInstalled, isInstalled.length);
      const quantity =
        isInstalled.length > 0
          ? item.quantity - isInstalled.at(0).quantity
          : item.quantity;
      if (quantity > 0) {
        availableShips.push({
          shipId: item.shipId,
          quantity,
          name: item.Ship.name,
          length: item.Ship.length,
        });
      }
    });
    return availableShips;
  }

  async placeShip(gameId: number, userId: number, dto: PlacementDto) {
    const { shipId, cells } = dto;
    const rule = await this.ruleService.findByShipId(shipId);

    const shipCells = [...new Set(cells)].sort(this.compareNumbers);
    // console.log('cellsSorted', cellsSorted, typeof cellsSorted.at(0));
    // console.log('dto', dto);

    // console.log(this.isInRange(cellsSorted));
    // console.log(this.isValidForm(rule.Sheep.length, cellsSorted));
    // console.log(this.isFreeAround(game.mapUserStart, cellsSorted));
    if (
      this.isInRange(shipCells) &&
      this.isValidForm(rule.Ship.length, shipCells)
      // &&
      // this.isFreeAround(game.mapUserStart, cellsSorted)
    ) {
      const { takenCells } = await this.getAppliedCells(gameId, userId);
      const { isFreeAround, shipSpaceAroundCells } = this.isFreeAround(
        takenCells,
        shipCells,
      );
      if (!isFreeAround) {
        return null;
      }
      const shipTakenCells = shipCells.map((item) => {
        return { cell: item };
      });

      const placement = await this.prisma.placement.create({
        data: {
          gameId,
          shipId,
          userId,
          TakenCells: {
            create: shipTakenCells,
          },
          SpaceAroundCells: {
            create: shipSpaceAroundCells,
          },
        },
        include: {
          TakenCells: true,
          SpaceAroundCells: true,
        },
      });
      // console.log('placementNew', placement);
      return placement;
    }
    return null;
  }

  async deletePlacement(gameId: number, userId: number) {
    // console.log('deletePlacement');
    await this.prisma.placement.deleteMany({ where: { gameId, userId } });
  }

  private plus(a: number, b: number) {
    return a + b;
  }

  private minus(a: number, b: number) {
    return a - b;
  }

  private calculateCell(fun: any, multiplier: number) {
    return function (a: number) {
      return function (b: number) {
        return fun(a, b * multiplier);
      };
    };
  }

  private getShipGeneratedCells(freeCells: number[], length: number) {
    const arrayShipGeneratedCells = [];
    const startCellIdx = Math.floor(Math.random() * freeCells.length);
    const startCell = freeCells.at(startCellIdx);

    [
      { fun: this.plus, multiplier: 1 },
      { fun: this.minus, multiplier: 1 },
      { fun: this.plus, multiplier: 10 },
      { fun: this.minus, multiplier: 10 },
    ].forEach((item) => {
      const cells = [...Array(length).keys()].map((x) =>
        this.calculateCell(item.fun, item.multiplier)(startCell)(x),
      );
      const intersection = cells.filter((item) => freeCells.includes(item));
      if (intersection.length === length) {
        arrayShipGeneratedCells.push(cells);
      }
    });

    if (arrayShipGeneratedCells.length < 1) {
      return null;
    }
    const arrayShipGeneratedCellsIdx = Math.floor(
      Math.random() * arrayShipGeneratedCells.length,
    );
    return arrayShipGeneratedCells.at(arrayShipGeneratedCellsIdx);
  }

  async placeShipByBot(placementShip: {
    gameId: number;
    userId: number;
    shipId: number;
    length: number;
  }) {
    const { gameId, userId, shipId, length } = placementShip;
    // console.log('1');

    const { takenCells, spaceAroundCells } = await this.getAppliedCells(
      gameId,
      userId,
    );
    // console.log('2', takenCells, spaceAroundCells);
    const appliedCells = [
      ...takenCells.map((item) => item.cell),
      ...spaceAroundCells.map((item) => item.cell),
    ];
    const freeCells = [...Array(100).keys()].filter(
      (cell) => !appliedCells.includes(cell),
    );
    // console.log('3', freeCells);
    let cells: number[] = [];
    do {
      cells = this.getShipGeneratedCells(freeCells, length);
      // console.log('4', cells);
    } while (cells === null);
    // console.log('5', cells);
    await this.placeShip(gameId, userId, { shipId, cells });
    return;
  }

  async placeShipsByBot(gameId: number, userId: number) {
    const rules = await this.ruleService.findMany();
    const { takenCells } = await this.getAppliedCells(gameId, userId);
    // console.log('bot', gameId, userId, takenCells, rules);
    if (takenCells.length > 0) {
      return;
    }
    type placement = {
      gameId: number;
      userId: number;
      shipId: number;
      length: number;
    };
    const chainShips: placement[] = [];
    rules.forEach((item) => {
      for (let i = 0; i < item.quantity; i++) {
        chainShips.push({
          gameId,
          userId,
          shipId: item.shipId,
          length: item.Ship.length,
        });
      }
    });
    // console.log('chainShips', chainShips);

    // await chainShips.reduce((acc: Promise<void>, placementShip) => {
    //   // await acc;
    //   return acc.then(() => this.placeShipByBot(placementShip));
    // }, Promise.resolve());

    // const chainScripts = (chainShips: placement[]) =>
    await chainShips.reduce(async (acc: Promise<void>, placementShip) => {
      // await acc;
      await acc;
      return await this.placeShipByBot(placementShip);
    }, Promise.resolve());
  }
}
