export const defaultMap = '0'.repeat(100);
export const placementStage = 'placement';
export const gamingStage = 'gaming';
export const resultStage = 'result';
export const closedStage = 'closed';
export const stages = [placementStage, gamingStage, resultStage, closedStage];
export const columnsLegend = 'ABCDEFGHKL';
export const rowsLegend = [...Array(10).keys()].map((i) => i + 1);
