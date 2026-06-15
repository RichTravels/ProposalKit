import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient();

globalForPrisma.prisma = db;

export async function ensureUser(clerkId: string, email: string) {
  await db.user.upsert({
    where: { clerkId },
    create: { clerkId, email, generationQuota: 3 },
    update: {},
  });
}
