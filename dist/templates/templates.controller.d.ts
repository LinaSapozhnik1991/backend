import type { Response } from "express";
import { PrismaService } from "../database/prisma.service";
export declare class TemplatesController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private validateEntity;
    private validateKey;
    downloadFile(entity: string, templateKey: string, res: Response): Promise<void>;
    meta(entity: string, templateKey: string): Promise<{
        size_bytes: number;
        original_filename: string | null;
        mime_type: string;
        body_text: string | null;
    }>;
    putBody(entity: string, templateKey: string, body: {
        body?: string;
    }): Promise<{
        success: boolean;
    }>;
    del(entity: string, templateKey: string): Promise<{
        success: boolean;
    }>;
    upload(entity: string, templateKey: string, file?: Express.Multer.File): Promise<{
        size_bytes: number;
        original_filename: string | null;
        mime_type: string;
        body_text: null;
    }>;
    private saveTemplate;
    private safeFilename;
}
