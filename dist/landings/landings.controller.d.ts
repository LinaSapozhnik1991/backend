import type { JwtUser } from "../auth/jwt.util";
import type { SaveLandingBody } from "./landings.service";
import { LandingsService } from "./landings.service";
export declare class LandingsController {
    private readonly landings;
    constructor(landings: LandingsService);
    list(user: JwtUser): Promise<Record<string, unknown>[]>;
    clone(user: JwtUser, id: string): Promise<Record<string, unknown>>;
    one(user: JwtUser, id: string): Promise<Record<string, unknown>>;
    create(user: JwtUser, body: SaveLandingBody): Promise<Record<string, unknown>>;
    update(user: JwtUser, id: string, body: SaveLandingBody): Promise<Record<string, unknown>>;
    remove(user: JwtUser, id: string): Promise<{
        success: boolean;
    }>;
}
