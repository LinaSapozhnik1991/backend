export declare const JWT_TTL_SEC: number;
export type JwtUserPayload = {
    id: number;
    login: string;
    role: "admin" | "manager" | "editor";
};
export type JwtUser = JwtUserPayload;
export declare function signAccessToken(payload: JwtUserPayload, secret: string): string;
export declare function verifyAccessToken(token: string, secret: string): JwtUserPayload | null;
