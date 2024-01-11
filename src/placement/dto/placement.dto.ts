import { Transform } from 'class-transformer';
import { IsArray, IsInt, IsNotEmpty } from 'class-validator';

export class PlacementDto {
  @IsNotEmpty()
  @IsInt()
  @Transform(({ value }) => Number(value))
  sheepId: number;
  @IsArray()
  @Transform(({ value }) =>
    typeof value === 'string'
      ? [Number(value)]
      : value.map((item) => Number(item)),
  )
  cells: number[];
}

class RuleDto {
  id: number;
  quantity: number;
}

export class MapUserStartUpdateDto {
  mapUserStart: string;
  fleetUser: {
    set: RuleDto[];
  };
  logs: {
    create: { description: string };
  };
}

export class MapUserStartResetDto {
  mapUserStart: string;
  fleetUser: {
    set: RuleDto[];
  };
  logs: {
    // eslint-disable-next-line @typescript-eslint/ban-types
    deleteMany: {};
  };
}
