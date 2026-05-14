import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards
} from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import type { JwtUser } from "../auth/jwt.util";
import { hasLandingsFullAccess } from "../auth/roles.util";
import { CurrentUser } from "../common/current-user.decorator";
import { CreateFilterPresetDto } from "./dto/create-filter-preset.dto";
import { FilterPresetsService } from "./filter-presets.service";

@Controller("filter-presets")
@UseGuards(AuthGuard)
export class FilterPresetsController {
  constructor(private readonly filterPresets: FilterPresetsService) {}

  @Get()
  async list(@Query("context") context: string) {
    const c = String(context ?? "").trim();
    if (!c) {
      throw new BadRequestException({ error: "Укажите параметр context" });
    }
    const presets = await this.filterPresets.list(c);
    return { presets };
  }

  @Post()
  async create(@Body() body: CreateFilterPresetDto) {
    const preset = await this.filterPresets.create(body);
    return { preset };
  }

  @Delete(":id")
  async remove(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: JwtUser) {
    if (!hasLandingsFullAccess(user.role)) {
      throw new ForbiddenException({
        error: "Удалять шаблоны фильтров могут только администратор и менеджер."
      });
    }
    await this.filterPresets.delete(id);
    return { ok: true };
  }
}
