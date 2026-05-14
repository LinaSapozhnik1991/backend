import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { verifyAccessToken, type JwtUser } from "./jwt.util";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined>; user?: JwtUser }>();
    const disabled = String(this.config.get("DISABLE_AUTH") ?? "false").toLowerCase() === "true";
    if (disabled) {
      req.user = { id: 1, login: "dev_admin", role: "admin" };
      return true;
    }
    const raw = req.headers.authorization ?? req.headers.Authorization;
    const token = raw?.startsWith("Bearer ") ? raw.slice(7).trim() : null;
    const secret = this.config.get<string>("JWT_SECRET") || "dev_secret";
    const payload = token ? verifyAccessToken(token, secret) : null;
    if (!payload) {
      throw new UnauthorizedException({ error: "Не авторизован" });
    }
    req.user = payload;
    return true;
  }
}
