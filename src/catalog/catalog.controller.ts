import { Body, Controller, Get, Put, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import type { CatalogItemDto } from "./catalog.service";
import { CatalogService } from "./catalog.service";
import { PutCatalogDto } from "./dto/put-catalog.dto";

@Controller("catalog")
@UseGuards(AuthGuard)
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get("widgets")
  async listWidgets(): Promise<{ items: CatalogItemDto[] }> {
    const items = await this.catalog.listWidgets();
    return { items };
  }

  @Put("widgets")
  async putWidgets(@Body() body: PutCatalogDto): Promise<{ items: CatalogItemDto[] }> {
    const items = await this.catalog.replaceWidgets(body.items);
    return { items };
  }

  @Get("scripts")
  async listScripts(): Promise<{ items: CatalogItemDto[] }> {
    const items = await this.catalog.listScripts();
    return { items };
  }

  @Put("scripts")
  async putScripts(@Body() body: PutCatalogDto): Promise<{ items: CatalogItemDto[] }> {
    const items = await this.catalog.replaceScripts(body.items);
    return { items };
  }
}
