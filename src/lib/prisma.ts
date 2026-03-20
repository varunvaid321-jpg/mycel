import { PrismaClient } from "@prisma/client";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createClient() {
  // Use Neon adapter in production
  if (process.env.NODE_ENV === "production" || process.env.DATABASE_URL?.includes("neon")) {
    neonConfig.fetchConnectionCache = true;
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaNeon(pool);
    return new PrismaClient({ adapter });
  }

  // Plain Prisma for local dev (direct Postgres connection)
  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma || createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
