import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty } from 'class-validator';

export class PlacementDto {
  @IsNotEmpty()
  @IsInt()
  @Transform(({ value }) => Number(value))
  shipLength: number;
  @IsNotEmpty()
  @IsInt()
  @Transform(({ value }) => Number(value))
  firstCell: number;
  @IsNotEmpty()
  @IsInt()
  @Transform(({ value }) => Number(value))
  secondCell: number;
}

export class PlaceShipDto {
  shipLength: number;
  shipCells: number[];
}
