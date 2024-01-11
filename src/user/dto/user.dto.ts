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
  role: string;
  username: string;
}

export class UserCreateDto extends UserSigninDto {
  @IsString()
  @IsNotEmpty()
  role: string;
}

export class UserSignupDto extends UserCreateDto {
  @IsString()
  @IsNotEmpty()
  passwordConfirm: string;
}

export class UserUpdateRefreshTokenDto {
  refreshToken: string;
}
