
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_VERIFIED_KEY } from '../decorator/require-verified.decorator';


@Injectable()
export class EmailVerifiedGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {

        const requireVerified = this.reflector.getAllAndOverride<boolean>(REQUIRE_VERIFIED_KEY, [context.getHandler(), context.getClass()]);

        if (!requireVerified) return true;

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            throw new ForbiddenException('User not aunthenticated.')
        }
        if (!user.is_verified) {
            throw new ForbiddenException('Please verify your email')
        }
        return true;
    }
}
