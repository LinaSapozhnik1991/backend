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

@Controller("offers")
@UseGuards(AuthGuard)
export class OffersController {
  constructor(private readonly landings: LandingsService) {}

  @Get()
  list(@CurrentUser() user: JwtUser) {
    return this.landings.list("offer", user);
  }

  @Post(":id/clone")
  @HttpCode(201)
  clone(@CurrentUser() user: JwtUser, @Param("id") id: string) {
    return this.landings.clone("offer", user, +id);
  }

  @Get(":id")
  one(@CurrentUser() user: JwtUser, @Param("id") id: string) {
    return this.landings.getOne("offer", user, +id);
  }

  @Post()
  @HttpCode(201)
  create(@CurrentUser() user: JwtUser, @Body() body: SaveLandingBody) {
    return this.landings.create("offer", user, body);
  }

  @Put(":id")
  update(@CurrentUser() user: JwtUser, @Param("id") id: string, @Body() body: SaveLandingBody) {
    return this.landings.update("offer", user, +id, body);
  }

  @Delete(":id")
  remove(@CurrentUser() user: JwtUser, @Param("id") id: string) {
    return this.landings.remove("offer", user, +id);
  }
}
