import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class ShotDto {
  @IsNotEmpty()
  @IsInt()
  @Transform(({ value }) => Number(value))
  cell: number;
}

export class CreateShotDto {
  gameId: number;
  userId: number;
  cell: number;
}

export class CreateGameDto {
  @IsNotEmpty()
  @IsString()
  first_shooter: string;
}
