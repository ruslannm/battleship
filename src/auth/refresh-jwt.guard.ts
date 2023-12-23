import { ForbiddenException, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class RefreshJwtGuard extends AuthGuard('jwt-refresh') {
  handleRequest(err, user) {
    if (err || !user) {
      throw err || new ForbiddenException();
    }
    return user;
  }
}
