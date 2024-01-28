import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/user/user.service';
import { UserSigninDto, UserSignupDto } from 'src/user/dto/user.dto';
import { userRole } from 'src/constants';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) { }

  async signup(body: UserSignupDto) {
    const { username, password, passwordConfirm } = body;
    const role = userRole;
    if (password !== passwordConfirm) {
      throw new BadRequestException('isPasswordError');
    }
    const userExists = await this.userService.findByUsername(username);
    if (userExists) {
      throw new BadRequestException('isUsernameNotUnique');
    }
    const user = await this.userService.create({
      role,
      username,
      password,
    });
    return user;
  }

  async validateUser(body: UserSigninDto) {
    const { username, password } = body;
    const user = await this.userService.findByUsername(username);
    if (!user) {
      throw new UnauthorizedException('Username or password is incorrect');
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Username or password is incorrect');
    }
    return { id: user.id, role: user.role };
  }

  async signin(body: UserSigninDto) {
    const user = await this.validateUser(body);
    const tokens = await this.getTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: number) {
    return await this.userService.update(userId, { refreshToken: null });
  }

  async updateRefreshToken(userId: number, refreshToken: string) {
    const hashedRefreshToken = await this.userService.getHash(refreshToken);
    await this.userService.update(userId, {
      refreshToken: hashedRefreshToken,
    });
  }

  async decodeJwt(token: string) {
    try {
      return await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('ACCESS_JWT_SECRET'),
      });
    } catch {
      return null;
    }
  }

  async getAuth(token: string | null | undefined) {
    if (token) {
      const decoded = await this.decodeJwt(token);
      if (decoded) {
        return { isAuth: true, isAdmin: decoded.role == 'admin' };
      }
    } else {
      return {};
    }
  }

  async getTokens(payload: { id: number; role: string }) {
    const jwtPayload = { sub: payload.id, role: payload.role };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(jwtPayload, {
        secret: this.configService.get<string>('ACCESS_JWT_SECRET'),
        expiresIn: `${this.configService.get<number>(
          'ACCESS_COOKIE_MAXAGE_IN_SECONDS',
        )}s`,
      }),
      this.jwtService.signAsync(jwtPayload, {
        secret: this.configService.get<string>('REFRESH_JWT_SECRET'),
        expiresIn: `${this.configService.get<number>(
          'REFRESH_COOKIE_MAXAGE_IN_SECONDS',
        )}s`,
      }),
    ]);
    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshTokens(payload: {
    id: number;
    role: string;
    refreshToken: string;
  }) {
    const user = await this.userService.findById(payload.id);
    if (!user || !user.refreshToken)
      throw new ForbiddenException('Access Denied');
    const isTokenValid = await bcrypt.compare(
      payload.refreshToken,
      user.refreshToken,
    );
    if (!isTokenValid) {
      throw new ForbiddenException('Access Denied');
    }
    const tokens = await this.getTokens({ id: payload.id, role: payload.role });
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }
}
