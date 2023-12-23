import { Body, Controller, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { UserCreateDto } from './dto/user.dto';

@Controller('waiters')
export class UserController {
  constructor(private readonly service: UserService) { }

  @Post()
  async create(@Body() data: UserCreateDto) {
    return await this.service.create(data);
  }
}
