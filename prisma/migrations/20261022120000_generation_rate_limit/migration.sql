-- CreateTable
CREATE TABLE "GenerationRateLimit" (
    "userId" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "GenerationRateLimit_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "GenerationRateLimit" ADD CONSTRAINT "GenerationRateLimit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
