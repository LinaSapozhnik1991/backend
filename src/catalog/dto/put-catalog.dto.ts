import { Transform, Type } from "class-transformer";
import { IsArray, IsString, MinLength, ValidateNested } from "class-validator";

export class PutCatalogItemDto {
  @Transform(({ value }) => String(value ?? "").trim())
  @IsString()
  @MinLength(1, { message: "Ключ не может быть пустым" })
  key!: string;

  @Transform(({ value }) => String(value ?? "").trim())
  @IsString()
  @MinLength(1, { message: "Название не может быть пустым" })
  name!: string;
}

export class PutCatalogDto {
  @IsArray({ message: "Поле items должно быть массивом" })
  @ValidateNested({ each: true })
  @Type(() => PutCatalogItemDto)
  items!: PutCatalogItemDto[];
}
