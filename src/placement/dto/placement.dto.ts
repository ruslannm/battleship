import { Transform } from 'class-transformer';
import { IsArray, IsInt, IsNotEmpty } from 'class-validator';

export class PlacementDto {
  @IsNotEmpty()
  @IsInt()
  @Transform(({ value }) => Number(value))
  length: number;
  @IsNotEmpty()
  @IsInt()
  @Transform(({ value }) => Number(value))
  firstCell: number;
  @IsNotEmpty()
  @IsInt()
  @Transform(({ value }) => Number(value))
  secondCell: number;
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
