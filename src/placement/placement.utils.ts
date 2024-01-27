import { spaceAroundCellType } from 'src/constants';

type appliedCell = {
  cell: number;
  length: number;
};

export function compareNumbers(a: number, b: number) {
  return a - b;
}

export function isHorizontalPosition(cells: number[]): boolean {
  if (cells.length <= 1) {
    return true;
  }
  if (cells.at(1) - cells.at(0) === 1) {
    return true;
  }
  return false;
}

export function isInRange(cells: number[]) {
  if (cells.at(0) < 0 || cells.at(-1) > 99) {
    return false;
  }
  return true;
}

export function isOnOneRow(cells: number[]) {
  return Math.floor(cells.at(0) / 10) === Math.floor(cells.at(-1) / 10);
}

export function isOnOneColumn(cells: number[]) {
  return cells.at(0) % 10 === cells.at(-1) % 10;
}

export function isValidForm(length: number, cells: number[]) {
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

function getSpaceAroundCells(cell: number) {
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

export function isFreeAround(takenCells: number[], cells: number[]) {
  let intersection = cells.filter((item) => takenCells.includes(item));
  if (intersection.length > 0) {
    return { isFreeAround: false, cellsAround: null };
  }
  let shipSpaceAroundCells = [];
  cells.forEach((item) => {
    shipSpaceAroundCells.push(...getSpaceAroundCells(item));
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
      return { cell: item, cellType: spaceAroundCellType };
    });

  return { isFreeAround: true, shipSpaceAroundCells };
}

export function getCellProps(
  rowIdx: number,
  columnIdx: number,
  takenCells: appliedCell[],
  spaceAroundCells: appliedCell[],
  isFullPlacement: boolean,
): {
  isButton: boolean;
  isDisabledCell: boolean;
  isShip: boolean;
} {
  const takenCellsValues = takenCells.filter(
    (item) => item.cell === this.getCellIdx(rowIdx, columnIdx),
  );
  if (takenCellsValues.length > 0) {
    return {
      isButton: false,
      isDisabledCell: false,
      isShip: true,
    };
  } else {
    const spaceAroundCellsValues = spaceAroundCells.filter(
      (item) => item.cell === this.getCellIdx(rowIdx, columnIdx),
    );
    if (spaceAroundCellsValues.length > 0) {
      // console.log('values', spaceAroundCellsValues);
      return {
        isButton: false,
        isDisabledCell: true,
        isShip: false,
      };
    }
  }
  return {
    isButton: !isFullPlacement,
    isDisabledCell: isFullPlacement,
    isShip: false,
  };
}

export function getCellIdx(rowIdx: number, columnIdx: number) {
  return rowIdx * 10 + columnIdx;
}

export function getCellText(
  rowIdx: number,
  columnIdx: number,
  takenCells: appliedCell[],
) {
  const values = takenCells.filter(
    (item) => item.cell === this.getCellIdx(rowIdx, columnIdx),
  );
  if (values.length > 0) {
    return values.at(0).length.toString();
  } else {
    return '';
  }
}

export function getShipCells(firstCell: number, secondCell: number) {
  if (firstCell === secondCell) {
    return [firstCell];
  }
  const shipCells = [firstCell, secondCell].sort(compareNumbers);
  if (isOnOneRow(shipCells)) {
    for (let i = shipCells.at(0); i < shipCells.at(1); i++) {
      shipCells.push(i);
    }
  } else if (isOnOneColumn(shipCells)) {
    for (let i = shipCells.at(0) + 10; i < shipCells.at(1); i = i + 10) {
      shipCells.push(i);
    }
  }
  return shipCells;
}

