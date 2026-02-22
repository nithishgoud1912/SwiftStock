"use client";

import { SignUp } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { dark } from "@clerk/themes";

export default function SignUpPage() {
  const { resolvedTheme } = useTheme();

  return (
    <div className="flex justify-center items-center min-h-screen">
      <SignUp
        appearance={{
          baseTheme: resolvedTheme === "dark" ? dark : undefined,
          elements: {
            formButtonPrimary: "bg-[#2a2a2f] hover:bg-black text-sm",
            card: "shadow-none border-none bg-white dark:bg-[#1a1a1a]",
            headerTitle: "text-xl font-bold",
          },
        }}
        routing="path"
        path="/sign-up"
      />
    </div>
  );
}
