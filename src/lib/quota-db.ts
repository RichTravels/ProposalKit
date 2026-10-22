import { db } from "@/lib/db";
import type { GenerationQuotaClient } from "@/lib/generation-quota";

/** Adapts the Prisma client so quota calls stay type-checked without pulling Prisma into tests. */
export function quotaDb(): GenerationQuotaClient {
  return {
    $queryRaw: (strings, ...values) => db.$queryRaw(strings, ...values),
    user: {
      updateMany: (args) => db.user.updateMany(args),
      findUnique: (args) => db.user.findUnique(args),
    },
  };
}
