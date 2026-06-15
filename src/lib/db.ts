import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/** Supavisor transaction pooler (6543) does not support Prisma prepared statements. */
function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");

  if (!url.includes(":6543/")) return url;

  let next = url;
  if (!next.includes("pgbouncer=true")) {
    next += next.includes("?") ? "&" : "?";
    next += "pgbouncer=true";
  }
  if (!next.includes("connection_limit=")) {
    next += next.includes("?") ? "&" : "?";
    next += "connection_limit=1";
  }
  return next;
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: { url: getDatabaseUrl() },
    },
  });

globalForPrisma.prisma = db;

export async function ensureUser(clerkId: string, email: string) {
  await db.user.upsert({
    where: { clerkId },
    create: { clerkId, email, generationQuota: 3 },
    update: {},
  });
}
