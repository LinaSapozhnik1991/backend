import type { CatalogItemDto } from "./catalog.service";
import { CatalogService } from "./catalog.service";
import { PutCatalogDto } from "./dto/put-catalog.dto";
export declare class CatalogController {
    private readonly catalog;
    constructor(catalog: CatalogService);
    listWidgets(): Promise<{
        items: CatalogItemDto[];
    }>;
    putWidgets(body: PutCatalogDto): Promise<{
        items: CatalogItemDto[];
    }>;
    listScripts(): Promise<{
        items: CatalogItemDto[];
    }>;
    putScripts(body: PutCatalogDto): Promise<{
        items: CatalogItemDto[];
    }>;
}
