import * as jwt from "jsonwebtoken";

/** Как в PHP jwtEncode: 8 часов */
export const JWT_TTL_SEC = 8 * 3600;

export type JwtUserPayload = { id: number; login: string; role: "admin" | "manager" | "editor" };

/** То же, что JwtUserPayload — единый тип для guard/decorator/сервисов */
export type JwtUser = JwtUserPayload;

export function signAccessToken(payload: JwtUserPayload, secret: string): string {
  return jwt.sign(
    { id: payload.id, login: payload.login, role: payload.role },
    secret,
    { algorithm: "HS256", expiresIn: JWT_TTL_SEC }
  );
}

export function verifyAccessToken(token: string, secret: string): JwtUserPayload | null {
  try {
    const p = jwt.verify(token, secret) as jwt.JwtPayload & {
      id?: number;
      login?: string;
      role?: string;
    };
    const rawId = p.id as unknown;
    let id: number;
    if (typeof rawId === "number" && Number.isFinite(rawId)) {
      id = rawId;
    } else if (typeof rawId === "string" && rawId.trim() !== "") {
      const n = Number.parseInt(rawId, 10);
      if (!Number.isFinite(n) || n <= 0) return null;
      id = n;
    } else {
      return null;
    }
    let role = String(p.role || "editor");
    if (role !== "admin" && role !== "manager") role = "editor";
    return { id, login: String(p.login || ""), role: role as JwtUserPayload["role"] };
  } catch {
    return null;
  }
}
