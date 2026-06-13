import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const reqiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!reqiredRoles || reqiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<{
      user?: {
        role: Role;
      };
    }>();

    if (!user || !user.role) {
      throw new ForbiddenException('Access denied : User role not found');
    }

    const hasRole = reqiredRoles.includes(user.role);

    if (!hasRole) {
      throw new ForbiddenException('Access denied : Insufficient permissions');
    }

    return true;
  }
}
