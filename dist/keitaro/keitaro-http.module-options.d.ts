import { ConfigService } from "@nestjs/config";
import type { HttpModuleOptions } from "@nestjs/axios";
export declare function createKeitaroHttpModuleOptions(cfg: ConfigService): HttpModuleOptions;
