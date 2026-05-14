import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  UseGuards
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AdminGuard } from "../auth/admin.guard";
import { AuthGuard } from "../auth/auth.guard";
import type { JwtUser } from "../auth/jwt.util";
import { CurrentUser } from "../common/current-user.decorator";
import { UsersService } from "./users.service";

@Controller("users")
@UseGuards(AuthGuard, AdminGuard)
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly config: ConfigService
  ) {}

  @Get()
  list() {
    return this.users.list();
  }

  @Post()
  @HttpCode(201)
  create(@Body() body: { login?: string; password?: string; role?: string }) {
    return this.users.create(body);
  }

  @Get(":id")
  getOne(@Param("id") id: string) {
    return this.users.getOne(+id);
  }

  @Patch(":id")
  @Put(":id")
  updateRole(@Param("id") id: string, @Body() body: { role?: string }, @CurrentUser() actor: JwtUser) {
    const secret = this.config.get<string>("JWT_SECRET") || "dev_secret";
    return this.users.updateRole(+id, body, actor, secret);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @CurrentUser() actor: JwtUser) {
    return this.users.remove(+id, actor);
  }
}
