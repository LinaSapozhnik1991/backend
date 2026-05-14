import { PrismaService } from "./prisma.service";
export declare class CounterService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    next(key: string): Promise<number>;
}
