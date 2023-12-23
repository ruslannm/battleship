import { Controller, Get, Render, Req } from '@nestjs/common';
import { RuleService } from './rule.service';
import { Request } from 'express';
import { AuthService } from 'src/auth/auth.service';
import { ConfigService } from '@nestjs/config';

@Controller('api/rule')
export class RuleApiController {
  constructor(private readonly service: RuleService) { }

  @Get()
  async findMany() {
    return await this.service.findMany();
  }
}

@Controller('rule')
export class RuleController {
  constructor(
    private readonly service: RuleService,
    private authService: AuthService,
    private readonly configService: ConfigService,
  ) { }

  @Get()
  @Render('rule')
  async findMany(@Req() req: Request) {
    const cookiesName = this.configService.get<string>('ACCESS_COOKIE_NAME');
    const items = { items: await this.service.findMany() };
    const jwtToken = req.cookies[cookiesName];
    const auth = await this.authService.getAuth(jwtToken);
    return { ...items, ...auth };
  }
}
