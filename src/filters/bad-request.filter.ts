import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  BadRequestException,
} from '@nestjs/common';

@Catch(BadRequestException)
export class BadRequestExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();
    const req = ctx.getRequest();
    const { role, username } = req.body;
    const message = exception.message;

    if (['isPasswordError', 'isUsernameNotUnique'].includes(message)) {
      const data = {
        isAdmin: role === 'admin',
        name,
        username,
      };
      data[message] = true;
      res.render('signup', data);
    } else {
      res.redirect('/');
    }
  }
}
