import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add it to .env.local (or .env) for Prisma to connect.",
    );
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

/** Returns true if this client has Session model (from our generated schema). */
function hasSessionModel(client: PrismaClient): boolean {
  return typeof (client as unknown as { session?: { findFirst?: unknown } }).session?.findFirst === "function";
}

function getPrisma(): PrismaClient {
  const cached = globalForPrisma.prisma;
  if (cached && hasSessionModel(cached)) {
    return cached;
  }
  if (cached && !hasSessionModel(cached)) {
    globalForPrisma.prisma = undefined;
  }
  const client = createPrismaClient();
  if (!hasSessionModel(client)) {
    throw new Error(
      "Prisma client missing Session model. Run: npx prisma generate"
    );
  }
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }
  return client;
}

export const prisma = getPrisma();
