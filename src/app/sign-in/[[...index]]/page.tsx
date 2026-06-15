import { SignIn } from "@clerk/nextjs";

const clerkAppearance = {
  layout: {
    unsafe_disableDevelopmentModeWarnings: true,
  },
};

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn path="/sign-in" appearance={clerkAppearance} />
    </div>
  );
}
