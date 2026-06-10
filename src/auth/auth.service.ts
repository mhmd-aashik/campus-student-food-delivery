import { UsersService } from '@/users/users.service';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    protected readonly usersService: UsersService,
    protected readonly jwtService: JwtService,
  ) {}
}
