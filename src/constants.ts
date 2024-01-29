export const botUserId = 0;
export const userRole = 'player';
export const createGameStage = 'create game';
export const placementStage = 'placement';
export const gamingStage = 'gaming';
export const closedStage = 'closed';
export const stages = [
  createGameStage,
  placementStage,
  gamingStage,
  closedStage,
];
export const columnsLegend = 'АБВГДЕЖЗИК';
export const rowsLegend = [...Array(10).keys()].map((i) => i + 1);

export const takenCellType = 'taken';
export const spaceAroundCellType = 'spaceAround';
