import { Injectable, Inject, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserException } from "../filters/error/user-exception.error";
import { User } from "../entities/user.entity";
import { TokenService } from "../modules/auth/token.service";
import { plainToClass } from "class-transformer";

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        @Inject("TokenService") private readonly tokenService: TokenService
    ) {}

    canActivate(context: ExecutionContext): boolean {
        const req = context.switchToHttp().getRequest();
        const handler = context.getHandler();

        const roles = this.reflector.get<string[]>("roles", handler);

        if (
            req.headers.authorization &&
            (req.headers.authorization as string).split(" ")[0] === "Bearer" &&
            roles &&
            roles.length > 0
        ) {
            const token = (req.headers.authorization as string).split(" ")[1];

            if (token && this.tokenService.verify(token)) {
                const data: any = this.tokenService.decode(token);
                req["user"] = plainToClass(User, data);
            }

            const hasRole = roles ? roles.filter(roleName => req["user"] && req["user"][roleName]).length > 0 : null;

            if (hasRole === true) {
                return true;
            } else {
                throw new UserException("auth:forbidden");
            }
        } else {
            throw new UserException("request:unauthorized");
        }
    }
}
