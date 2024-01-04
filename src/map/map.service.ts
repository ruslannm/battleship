import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RuleService } from 'src/rule/rule.service';
import { MapDto } from './dto/map.dto';
import { GameService } from 'src/game/game.service';

const defaultMap = '0'.repeat(100);
const columnsLegend = 'ABCDEFGHKL';
const rowsLegend = [...Array(10).keys()].map((i) => i + 1);

@Injectable()
export class MapService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gameService: GameService,
    private readonly ruleService: RuleService,
  ) { }

  private async getCellText(
    mapStart: string,
    rowIdx: number,
    columnIdx: number,
  ) {
    if (columnIdx > 0 && rowIdx > 0) {
      const cellValue = mapStart.charAt(
        this.getMapCellIdx(rowIdx - 1, columnIdx - 1),
      );
      return cellValue === '0' ? '' : cellValue;
    }
    if (rowIdx == 0) {
      return 'ABCDEFGHKL'.charAt(columnIdx - 1);
    }
    if (columnIdx == 0) {
      return rowsLegend.at(rowIdx - 1).toString();
    }
    return '';
  }

  private getCellProps(
    row: number,
    column: number,
    cellValue: string,
  ): { isButton: boolean; isDisabled: boolean; isAxis: boolean } {
    if (column < 1 || row < 1) {
      return { isButton: false, isDisabled: true, isAxis: true };
    }
    if (cellValue === '-') {
      return { isButton: true, isDisabled: true, isAxis: false };
    }
    if (cellValue === '0') {
      return { isButton: true, isDisabled: false, isAxis: false };
    }
    return { isButton: false, isDisabled: true, isAxis: false };
  }

  private getMapCellIdx(rowIdx: number, columnIdx: number) {
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
    return this.getMapCellIdx(rowIdx - 1, columnIdx - 1).toString();
  }

  async getMapForRender(
    mapStart: string,
    mapCurrent: string,
    isUserMap: boolean,
  ) {
    const result = [];
    for (let rowIdx: number = 0; rowIdx < 11; rowIdx++) {
      const row = [];
      for (let columnIdx = 0; columnIdx < 11; columnIdx++) {
        const id = this.getRenderMapCellIdx(rowIdx, columnIdx);
        const text = await this.getCellText(mapStart, rowIdx, columnIdx);
        const { isButton, isDisabled, isAxis } = this.getCellProps(
          rowIdx,
          columnIdx,
          mapStart.at(this.getMapCellIdx(rowIdx - 1, columnIdx - 1)),
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
        item < 10 && item % 10 === 0 ? 0 : Number(map.charAt(item - 11));
      const topRight =
        item < 10 && (item + 1) % 10 === 0 ? 0 : Number(map.charAt(item - 9));
      const bottomLeft =
        item > 89 && item % 10 === 0 ? 0 : Number(map.charAt(item + 9));
      const bottomRight =
        item > 89 && (item + 1) % 10 === 0 ? 0 : Number(map.charAt(item + 11));

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

  async placeShip(gameId: number, dto: MapDto) {
    const { rule: ruleId, cells } = dto;
    const game = await this.gameService.findById(gameId);
    const rule = await this.ruleService.findById(ruleId);
    const cellsOrdered = [...new Set(cells)];
    cellsOrdered.sort();
    console.log('cellsOrdered.sort()', cellsOrdered.sort());
    console.log(this.isInRange(cellsOrdered));
    console.log(this.isValidForm(rule.Sheep.length, cellsOrdered));
    console.log(this.isFreeAround(game.mapUserStart, cellsOrdered));
    if (
      this.isInRange(cellsOrdered) &&
      this.isValidForm(rule.Sheep.length, cellsOrdered) &&
      this.isFreeAround(game.mapUserStart, cellsOrdered)
    ) {
      const newMap = game.mapUserStart.split('');
      cellsOrdered.forEach((item) => {
        newMap.splice(item, 1, rule.Sheep.length.toString());
      });
      console.log("newMap.join('')", newMap.join(''));

      return this.gameService.update(game.id, {
        mapUserStart: newMap.join(''),
      });
    }
    return null;
  }
}
