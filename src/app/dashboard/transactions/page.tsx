import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import TransactionsClient from "@/components/dashboard/TransactionsClient";
import { prisma } from "@/lib/prisma";


export const metadata: Metadata = {
  title: "Transactions | SwiftStock",
  description: "View and manage stock movement history and CSV imports.",
};

export default async function TransactionsPage() {
  const { userId, orgId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const organization = await prisma.organization.findUnique({
    where: { id: orgId },
  });

  if (!organization) {
    redirect("/dashboard");
  }

  return (
    <div className="p-6 space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Transaction Ledger
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          A complete audit trail of all inventory movements.
        </p>
      </header>

      <TransactionsClient organization={organization}/>
    </div>
  );
}
