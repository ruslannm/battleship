import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserCreateDto, UserUpdateRefreshTokenDto } from './dto/user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private configService: ConfigService,
  ) { }

  async getHash(text: string) {
    const salt = await bcrypt.genSalt(
      Number(this.configService.get<number>('PASSWORD_SALT')),
    );
    const hash = await bcrypt.hash(text, salt);
    return hash;
  }

  async create(data: UserCreateDto) {
    try {
      const hashedPassword = await this.getHash(data.password);
      data.password = hashedPassword;

      const user = await this.prisma.user.create({ data });
      return user;
    } catch {
      throw new UnauthorizedException('isUsernameNotUnique');
    }
  }

  async findMany() {
    return await this.prisma.user.findMany();
  }

  async findById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
    });
    return user;
  }

  async findByUsername(username: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        username,
      },
    });
    return user;
  }

  async update(id: number, data: UserUpdateRefreshTokenDto) {
    const result = await this.prisma.user.update({
      where: { id },
      data,
    });
    return result;
  }
}
