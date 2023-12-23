import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { AccessJwtStrategy } from './access-jwt.strategy';
import { RefreshJwtStrategy } from './refresh-jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/user/user.service';

@Module({
  imports: [PrismaModule, PassportModule, JwtModule.register({})],
  providers: [
    AuthService,
    AccessJwtStrategy,
    RefreshJwtStrategy,
    ConfigService,
    UserService,
  ],
  exports: [AuthService],
})
export class AuthModule { }
