import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { DockService } from 'src/dock/dock.service';
import { PlaceShipDto } from './dto/placement.dto';
import { takenCellType, spaceAroundCellType } from 'src/constants';
import * as utils from './placement.utils';

@Injectable()
export class PlacementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dockService: DockService,
  ) { }

  async getAppliedCells(gameId: number, userId: number) {
    const placement = await this.prisma.placement.findMany({
      where: { gameId, userId },
      include: {
        cells: true,
      },
    });
    const takenCells = [];
    placement.forEach((item) => {
      item.cells
        .filter((cell) => cell.cellType == takenCellType)
        .forEach((cell) => {
          takenCells.push({ cell: cell.cell, length: item.shipLength });
        });
    });
    let spaceAroundCells = [];
    placement.forEach((item) => {
      item.cells
        .filter((cell) => cell.cellType === spaceAroundCellType)
        .forEach((cell) => {
          spaceAroundCells.push({ cell: cell.cell, length: 0 });
        });
    });
    spaceAroundCells = [...new Set(spaceAroundCells)];
    return { takenCells, spaceAroundCells };
  }

  private async getInstalledShips(gameId: number, userId: number) {
    const placement = await this.prisma.placement.groupBy({
      where: { gameId, userId },
      by: ['shipLength'],
      _count: {
        _all: true,
      },
    });
    return placement.map((item) => {
      return {
        shipLength: item.shipLength,
        quantity: item._count._all,
      };
    });
  }

  async getAvailableShips(gameId: number, userId: number) {
    const installedShips = await this.getInstalledShips(gameId, userId);
    const docks = await this.dockService.findMany();
    const availableShips = [];
    let counter = 0;
    docks.forEach((item) => {
      const isInstalled = installedShips.filter(
        (installed) => installed.shipLength === item.shipLength,
      );
      const quantity =
        isInstalled.length > 0
          ? item.quantity - isInstalled.at(0).quantity
          : item.quantity;
      if (quantity > 0) {
        const row = [];
        for (let i = 0; i < quantity; i++) {
          row.push({
            counter: counter++,
            length: item.shipLength,
          });
        }
        availableShips.push({ row });
      }
    });
    return availableShips;
  }

  async placeShip(gameId: number, userId: number, dto: PlaceShipDto) {
    const { shipLength, shipCells: shipCellsRaw } = dto;
    const shipCells = [...new Set(shipCellsRaw)].sort(utils.compareNumbers);
    if (
      utils.isInRange(shipCells) &&
      utils.isValidForm(shipLength, shipCells)
    ) {
      const { takenCells } = await this.getAppliedCells(gameId, userId);
      const { isFreeAround, shipSpaceAroundCells } = utils.isFreeAround(
        takenCells,
        shipCells,
      );
      if (!isFreeAround) {
        return null;
      }
      const shipTakenCells = shipCells.map((item) => {
        return { cell: item, cellType: takenCellType };
      });

      const placement = await this.prisma.placement.create({
        data: {
          gameId,
          shipLength,
          userId,
          cells: {
            create: [...shipTakenCells, ...shipSpaceAroundCells],
          },
        },
        include: {
          cells: true,
        },
      });
      return placement;
    }
    return null;
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
      const isEqualLenth = intersection.length === length;
      let isEqualRow = item.multiplier === 10 ? true : false;
      if (item.multiplier === 1) {
        const rowIdFirstCell = Math.floor(cells.at(0) / 10);
        const rowIdLastCell = Math.floor(cells.at(-1) / 10);
        isEqualRow = rowIdFirstCell === rowIdLastCell;
      }
      if (isEqualLenth && isEqualRow) {
        arrayShipGeneratedCells.push(cells);
      }
    });

    if (arrayShipGeneratedCells.length < 1) {
      return [];
    }
    const arrayShipGeneratedCellsIdx = Math.floor(
      Math.random() * arrayShipGeneratedCells.length,
    );
    return arrayShipGeneratedCells.at(arrayShipGeneratedCellsIdx);
  }

  private async placeShipByBot(placementShip: {
    gameId: number;
    userId: number;
    shipLength: number;
  }) {
    const { gameId, userId, shipLength } = placementShip;

    const { takenCells, spaceAroundCells } = await this.getAppliedCells(
      gameId,
      userId,
    );
    const appliedCells = [
      ...takenCells.map((item) => item.cell),
      ...spaceAroundCells.map((item) => item.cell),
    ];
    const freeCells = [...Array(100).keys()].filter(
      (cell) => !appliedCells.includes(cell),
    );
    let shipCells: number[] = [];
    do {
      shipCells = this.getShipGeneratedCells(freeCells, shipLength);
    } while (shipCells.length < 1);
    await this.placeShip(gameId, userId, { shipLength, shipCells });
    return;
  }

  async placeShipsByBot(gameId: number, userId: number) {
    const docks = await this.dockService.findMany();
    const { takenCells } = await this.getAppliedCells(gameId, userId);
    if (takenCells.length > 0) {
      return;
    }
    type placement = {
      gameId: number;
      userId: number;
      shipLength: number;
    };
    const chainShips: placement[] = [];
    docks.forEach((item) => {
      for (let i = 0; i < item.quantity; i++) {
        chainShips.push({
          gameId,
          userId,
          shipLength: item.shipLength,
        });
      }
    });
    await chainShips.reduce(async (acc: Promise<void>, placementShip) => {
      await acc;
      return await this.placeShipByBot(placementShip);
    }, Promise.resolve());
  }
}
