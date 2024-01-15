export const botUserId = 0;
export const defaultMap = '0'.repeat(100);
export const firstShootsChoice = 'first_shoots_choice';
export const placementStage = 'placement';
export const gamingStage = 'gaming';
export const resultStage = 'result';
export const closedStage = 'closed';
export const stages = [
  firstShootsChoice,
  placementStage,
  firstShootsChoice,
  gamingStage,
  resultStage,
  closedStage,
];
export const columnsLegend = 'ABCDEFGHKL';
export const rowsLegend = [...Array(10).keys()].map((i) => i + 1);

export const takenCellType = 'taken';
export const spaceAroundCellType = 'spaceAround';
