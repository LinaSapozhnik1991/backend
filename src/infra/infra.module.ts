import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { CrmQueueProcessor } from "./crm-queue.processor";
import { CRM_QUEUE, CrmQueueService } from "./crm-queue.service";
import { InfraController } from "./infra.controller";

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const password = cfg.get<string>("REDIS_PASSWORD");
        return {
          connection: {
            host: cfg.get<string>("REDIS_HOST", "127.0.0.1"),
            port: +(cfg.get<string>("REDIS_PORT", "6379") ?? "6379"),
            ...(password ? { password } : {})
          }
        };
      }
    }),
    BullModule.registerQueue({ name: CRM_QUEUE })
  ],
  controllers: [InfraController],
  providers: [CrmQueueService, CrmQueueProcessor],
  exports: [CrmQueueService]
})
export class InfraModule {}
