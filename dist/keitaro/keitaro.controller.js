"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeitaroController = void 0;
const common_1 = require("@nestjs/common");
const keitaro_service_1 = require("./keitaro.service");
const prisma_service_1 = require("../database/prisma.service");
let KeitaroController = class KeitaroController {
    constructor(keitaro, prisma) {
        this.keitaro = keitaro;
        this.prisma = prisma;
    }
    async runSync() {
        return this.keitaro.syncLandings();
    }
    async setupDatabase() {
        await this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        login VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'editor',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
        await this.prisma.$executeRaw `
      INSERT INTO users (login, password_hash, role)
      SELECT 'admin', '$2y$10$A5pWaf9phnWz7gzf5c4n6e5wmW8EuLhIwJr4fIFQdy6.G7zLJjL4e', 'admin'
      WHERE NOT EXISTS (SELECT 1 FROM users WHERE login = 'admin');
    `;
        return { message: '✅ База данных инициализирована. Теперь можно войти admin/admin123' };
    }
};
exports.KeitaroController = KeitaroController;
__decorate([
    (0, common_1.Post)("keitaro"),
    (0, common_1.HttpCode)(200),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], KeitaroController.prototype, "runSync", null);
__decorate([
    (0, common_1.Get)("setup-db"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], KeitaroController.prototype, "setupDatabase", null);
exports.KeitaroController = KeitaroController = __decorate([
    (0, common_1.Controller)("sync"),
    __metadata("design:paramtypes", [keitaro_service_1.KeitaroService,
        prisma_service_1.PrismaService])
], KeitaroController);
//# sourceMappingURL=keitaro.controller.js.map