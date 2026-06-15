import { SignUp } from "@clerk/nextjs";

const clerkAppearance = {
  layout: {
    unsafe_disableDevelopmentModeWarnings: true,
  },
};

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp path="/sign-up" appearance={clerkAppearance} />
    </div>
  );
}
