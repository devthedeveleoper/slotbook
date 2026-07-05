import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Next.js uses turbopack and global variables. If DATABASE_URL is not set at build time,
// Prisma 7 requires either an adapter or accelerateUrl.
const connectionString = process.env.DATABASE_URL
  ? process.env.DATABASE_URL.replace("?sslmode=require", "")
  : "postgresql://dummy:dummy@localhost:5432/dummy";

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
