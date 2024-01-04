import { Transform } from 'class-transformer';
import { IsArray, IsInt, IsNotEmpty } from 'class-validator';

export class MapDto {
  @IsNotEmpty()
  @IsInt()
  @Transform(({ value }) => Number(value))
  rule: number;
  @IsArray()
  @Transform(({ value }) =>
    typeof value === 'string'
      ? [Number(value)]
      : value.map((item) => Number(item)),
  )
  cells: number[];
}

export class MapUserStartUpdateDto {
  mapUserStart: string;
}
