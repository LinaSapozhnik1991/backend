import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import type { JwtUser } from "./jwt.util";

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ user?: JwtUser }>();
    const u = req.user;
    if (!u || u.role !== "admin") {
      throw new ForbiddenException({ error: "Недостаточно прав: нужна роль администратора" });
    }
    return true;
  }
}
