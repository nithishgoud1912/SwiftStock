"use client";

import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
  useAuth,
} from "@clerk/nextjs";
import NotificationBell from "./dashboard/NotificationBell";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { dark } from "@clerk/themes";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import SideMenu from "./side-menu";

export function HeaderAuth() {
  const { resolvedTheme } = useTheme();
  const { orgId, userId } = useAuth();
  const activeOrgId = orgId || userId;

  // Avoid hydration mismatch by only rendering after mount
  const [mounted, setMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-[120px] h-8" />; // Placeholder width to prevent layout shift
  }

  const clerkAppearance = {
    baseTheme: resolvedTheme === "dark" ? dark : undefined,
    elements: {
      formButtonPrimary: "bg-[#2a2a2f] hover:bg-black text-sm",
      card: "shadow-none border-none bg-white dark:bg-[#1a1a1a]",
      headerTitle: "text-xl font-bold",
    },
  };

  return (
    <>
      <SideMenu isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
      <header className="p-2 sticky  top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          {/* Left Side: Logo */}
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                className="fill-black dark:fill-white"
              >
                <path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z" />
              </svg>
            </button>
            <Link href="/dashboard">
              <div className="flex items-center gap-2 font-bold tracking-tight">
                <div className="h-8 w-8 rounded-lg bg-[#6c47ff] flex items-center justify-center text-white">
                  S
                </div>
                <span className="text-xl font-bold tracking-tight">
                  Swift<span className="text-[#6c47ff]">Stock</span>
                </span>
              </div>
            </Link>
          </div>

          {/* Right Side: Actions */}
          <div className="flex items-center gap-4">
            <SignedOut>
              <div className="flex items-center gap-2">
                <SignInButton
                  mode="modal"
                  forceRedirectUrl="/dashboard"
                  signUpForceRedirectUrl="/dashboard"
                >
                  <Button variant="ghost" size="sm">
                    Log in
                  </Button>
                </SignInButton>
                <SignUpButton
                  mode="modal"
                  forceRedirectUrl="/dashboard"
                  signInForceRedirectUrl="/dashboard"
                >
                  <Button
                    size="sm"
                    className="bg-[#6c47ff] hover:bg-[#6c47ff]/90"
                  >
                    Get Started
                  </Button>
                </SignUpButton>
              </div>
            </SignedOut>

            <SignedIn>
              <div className="flex items-center gap-4">
                <nav className="flex gap-4 text-sm font-medium text-muted-foreground items-center">
                  <Link href="/dashboard" className="hover:text-primary">
                    Dashboard
                  </Link>
                  <Link
                    href="/dashboard/inventory"
                    className="hover:text-primary"
                  >
                    Inventory
                  </Link>
                  <Link
                    href="/dashboard/transactions"
                    className="hover:text-primary"
                  >
                    Transactions
                  </Link>
                  <Link href="/dashboard/audit" className="hover:text-primary">
                    Audit Trail
                  </Link>
                  <Link
                    href="/dashboard/settings/organization"
                    className="hover:text-primary"
                  >
                    Settings
                  </Link>
                </nav>
                <div className="flex items-center gap-4">
                  {activeOrgId && <NotificationBell />}
                  <ThemeToggle />
                  <UserButton appearance={clerkAppearance} />
                </div>
              </div>
            </SignedIn>
          </div>
        </div>
      </header>
    </>
  );
}
