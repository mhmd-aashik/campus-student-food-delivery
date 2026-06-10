import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

@Controller('users')
export class UsersController {
  @Get()
  getMe(@Req() req: RequestWithUser) {
    return req.user;
  }
}
