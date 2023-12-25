import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UserController } from './user/user.controller';
import { UserService } from './user/user.service';
import { AppController } from './app.controller';
import { APP_FILTER } from '@nestjs/core';
import { NotFoundExceptionFilter } from './filters/not-found.filter';
import { AuthModule } from './auth/auth.module';
import { UnauthorizedExceptionFilter } from './filters/unauthorized.filter';
import { ConfigService } from '@nestjs/config';
import { BadRequestExceptionFilter } from './filters/bad-request.filter';
import { AuthController } from './auth/auth.controller';
import { ForbiddenExceptionFilter } from './filters/forbidden.filter';
import { MapController } from './map/map.controller';
import { RuleService } from './rule/rule.service';
import { MapService } from './map/map.service';
import { GameController } from './game/game.controller';
import { GameService } from './game/game.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [
    MapController,
    UserController,
    AppController,
    AuthController,
    GameController,
  ],
  providers: [
    GameService,
    MapService,
    RuleService,
    UserService,
    ConfigService,
    {
      provide: APP_FILTER,
      useClass: NotFoundExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: UnauthorizedExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: BadRequestExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: ForbiddenExceptionFilter,
    },
  ],
})
export class AppModule { }
