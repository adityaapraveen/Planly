import { PrismaClient } from "@prisma/client";
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { config } from './config.js'

const globalForPrisma = globalThis;
const pool = new Pool({
    connectionString: config.DATABASE_URL
})
const adapter = new PrismaPg(pool)

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        adapter,
        log:
            process.env.NODE_ENV === "dev"
                ? ["query", "error", "warn"]
                : ["error"],
    });

if (process.env.NODE_ENV !== "prod") {
    globalForPrisma.prisma = prisma;
}
