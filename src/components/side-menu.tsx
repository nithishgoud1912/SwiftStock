import React, { Dispatch, SetStateAction, useEffect } from "react";
import { SignInButton, SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "./ui/button";

interface SideMenuProps {
  isMenuOpen: boolean;
  setIsMenuOpen: Dispatch<SetStateAction<boolean>>;
}

const SideMenu = ({ isMenuOpen, setIsMenuOpen }: SideMenuProps) => {
  // Prevent scrolling when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  return (
    <>
      {/* Overlay Backdrop */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-60 bg-black/50"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <div
        className={`fixed top-0 left-0 z-70 h-full w-64 md:w-80 bg-background border-r border-border/40 shadow-xl transition-transform duration-300 ease-in-out`}
        style={{
          transform: isMenuOpen ? "translateX(0)" : "translateX(-100%)",
        }}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-border/40 min-h-16 h-16">
            <div className="flex items-center gap-2 font-bold tracking-tight">
              <div className="h-8 w-8 rounded-lg bg-[#6c47ff] flex items-center justify-center text-white">
                S
              </div>
              <span className="text-xl">
                Swift<span className="text-[#6c47ff]">Stock</span>
              </span>
            </div>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                className="fill-current"
              >
                <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
              </svg>
            </button>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
            <SignedIn>
              <nav className="flex flex-col gap-2">
                <Link
                  href="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className="px-4 py-3 rounded-md hover:bg-muted font-medium transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/inventory"
                  onClick={() => setIsMenuOpen(false)}
                  className="px-4 py-3 rounded-md hover:bg-muted font-medium transition-colors"
                >
                  Inventory
                </Link>
                <Link
                  href="/dashboard/transactions"
                  onClick={() => setIsMenuOpen(false)}
                  className="px-4 py-3 rounded-md hover:bg-muted font-medium transition-colors"
                >
                  Transaction Ledger
                </Link>
                <Link
                  href="/dashboard/approvals"
                  onClick={() => setIsMenuOpen(false)}
                  className="px-4 py-3 rounded-md hover:bg-muted font-medium transition-colors border-t border-border/40 mt-1 pt-3"
                >
                  Approvals
                </Link>
                <Link
                  href="/dashboard/audit"
                  onClick={() => setIsMenuOpen(false)}
                  className="px-4 py-3 rounded-md hover:bg-muted font-medium transition-colors"
                >
                  Audit Trail
                </Link>
              </nav>
            </SignedIn>

            <SignedOut>
              <div className="flex flex-col gap-3 mt-4">
                <p className="text-sm text-muted-foreground mb-2 px-2">
                  Sign in to access your inventory and dashboard.
                </p>
                <SignInButton
                  mode="modal"
                  forceRedirectUrl="/dashboard"
                  signUpForceRedirectUrl="/dashboard"
                >
                  <Button variant="outline" className="w-full justify-start">
                    Log in
                  </Button>
                </SignInButton>
                <SignUpButton
                  mode="modal"
                  forceRedirectUrl="/dashboard"
                  signInForceRedirectUrl="/dashboard"
                >
                  <Button className="w-full justify-start bg-[#6c47ff] hover:bg-[#6c47ff]/90">
                    Get Started
                  </Button>
                </SignUpButton>
              </div>
            </SignedOut>
          </div>
        </div>
      </div>
    </>
  );
};

export default SideMenu;
