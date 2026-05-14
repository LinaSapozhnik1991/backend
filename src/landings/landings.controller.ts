import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  UseGuards
} from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import type { JwtUser } from "../auth/jwt.util";
import { CurrentUser } from "../common/current-user.decorator";
import type { SaveLandingBody } from "./landings.service";
import { LandingsService } from "./landings.service";

@Controller("landings")
@UseGuards(AuthGuard)
export class LandingsController {
  constructor(private readonly landings: LandingsService) {}

  @Get()
  list(@CurrentUser() user: JwtUser) {
    return this.landings.list("landing", user);
  }

  @Post(":id/clone")
  @HttpCode(201)
  clone(@CurrentUser() user: JwtUser, @Param("id") id: string) {
    return this.landings.clone("landing", user, +id);
  }

  @Get(":id")
  one(@CurrentUser() user: JwtUser, @Param("id") id: string) {
    return this.landings.getOne("landing", user, +id);
  }

  @Post()
  @HttpCode(201)
  create(@CurrentUser() user: JwtUser, @Body() body: SaveLandingBody) {
    return this.landings.create("landing", user, body);
  }

  @Put(":id")
  update(@CurrentUser() user: JwtUser, @Param("id") id: string, @Body() body: SaveLandingBody) {
    return this.landings.update("landing", user, +id, body);
  }

  @Delete(":id")
  remove(@CurrentUser() user: JwtUser, @Param("id") id: string) {
    return this.landings.remove("landing", user, +id);
  }
}
