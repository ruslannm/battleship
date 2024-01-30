import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  UnauthorizedException,
} from '@nestjs/common';

@Catch(UnauthorizedException)
export class UnauthorizedExceptionFilter implements ExceptionFilter {
  catch(exception: UnauthorizedException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();
    const req = ctx.getRequest();
    const message = exception.message;
    if (message === 'Username or password is incorrect') {
      res.render('signin', { isError: true });
    } else {
      res.redirect(`/refresh?redirectBack=${req.originalUrl}`);
    }
  }
}
