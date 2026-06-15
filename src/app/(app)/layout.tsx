import Header from "@/components/Header";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  let isPro = false;

  if (userId) {
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      select: { isPro: true },
    });
    isPro = user?.isPro ?? false;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <Header isPro={isPro} />
      <main className="py-8">{children}</main>
    </div>
  );
}
