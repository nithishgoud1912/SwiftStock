import { getTransactions } from "@/app/lib/actions/inventory";
import TransactionTable from "@/components/dashboard/TransactionTable";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function TransactionsPage() {
  const { userId, orgId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const activeOrgId = orgId || userId;

  // Fetch all transactions for this organization
  const transactions = await getTransactions(activeOrgId);

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

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Activity
          </h2>
        </div>
        <div className="p-6">
          <TransactionTable transactions={transactions} />
        </div>
      </div>
    </div>
  );
}
