import { UsersService } from '@/users/users.service';
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
@Injectable()
export class AuthService {
  constructor(
    protected readonly usersService: UsersService,
    protected readonly jwtService: JwtService,
    protected readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 10);

    return this.usersService.create({
      name: registerDto.name,
      email: registerDto.email,
      passwordHash,
      role: registerDto.role,
    });
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    const hashRefreshToken = await bcrypt.hash(tokens.refreshToken, 10);
    await this.usersService.updateRefreshToken(user.id, hashRefreshToken);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    };
  }

  async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const refreshPayload = { sub: userId };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
        expiresIn: '15m',
      }),

      this.jwtService.signAsync(refreshPayload, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async refresh(refreshDto: RefreshDto) {
    try {
      const payload = await this.jwtService.verifyAsync<{ sub: string }>(
        refreshDto.refreshToken,
        {
          secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        },
      );
      const user = await this.usersService.findByIdRaw(payload.sub);

      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      const isRefreshTokenMatching = await bcrypt.compare(
        refreshDto.refreshToken,
        user.refreshToken,
      );

      if (!isRefreshTokenMatching) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      const tokens = await this.generateTokens(user.id, user.email, user.role);
      const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 10);
      await this.usersService.updateRefreshToken(user.id, hashedRefreshToken);

      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
