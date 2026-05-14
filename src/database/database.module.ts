import { Global, Module } from "@nestjs/common";
import { CounterService } from "./counter.service";
import { PrismaService } from "./prisma.service";

@Global()
@Module({
  providers: [PrismaService, CounterService],
  exports: [PrismaService, CounterService]
})
export class DatabaseModule {}
