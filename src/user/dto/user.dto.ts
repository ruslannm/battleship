import { IsNotEmpty, IsString } from 'class-validator';

export class UserSigninDto {
  @IsString()
  @IsNotEmpty()
  username: string;
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class UserValidatedDto {
  id: number;
  name: string;
  role: string;
  username: string;
}

export class UserCreateDto extends UserSigninDto {
  @IsString()
  @IsNotEmpty()
  name: string;
  @IsString()
  @IsNotEmpty()
  role: string;
  // @IsString()
  // @IsNotEmpty()
  // username: string;
  // @IsString()
  // @IsNotEmpty()
  // password: string;
}

export class UserSignupDto extends UserCreateDto {
  // @IsString()
  // @IsNotEmpty()
  // name: string;
  // @IsString()
  // @IsNotEmpty()
  // role: string;
  // @IsString()
  // @IsNotEmpty()
  // username: string;
  // @IsString()
  // @IsNotEmpty()
  // password: string;
  @IsString()
  @IsNotEmpty()
  passwordConfirm: string;
}

export class UserUpdateRefreshTokenDto {
  refreshToken: string;
}
