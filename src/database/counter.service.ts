import { Injectable } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

@Injectable()
export class CounterService {
  constructor(private readonly prisma: PrismaService) {}

  /** Следующее значение счётчика `key` (1, 2, …). */
  async next(key: string): Promise<number> {
    const rows = await this.prisma.$queryRaw<{ seq: number }[]>`
      INSERT INTO counters (key, seq) VALUES (${key}, 1)
      ON CONFLICT (key) DO UPDATE SET seq = counters.seq + 1
      RETURNING seq
    `;
    return Number(rows[0]!.seq);
  }
}
