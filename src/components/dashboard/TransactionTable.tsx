"use client";

// Type definition based on our Prisma query
type Transaction = {
  id: string;
  type: string;
  quantity: number;
  notes: string | null;
  createdAt: Date;
  product: {
    name: string;
    sku: string;
  };
  user: {
    name: string | null;
    email: string;
  };
};

export default function TransactionTable({
  transactions,
}: {
  transactions: Transaction[];
}) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        No transactions found. Adjust some stock to see your history!
      </div>
    );
  }

  return (
    <div className="overflow-x-auto relative">
      <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th scope="col" className="px-6 py-3">
              Date & Time
            </th>
            <th scope="col" className="px-6 py-3">
              Product
            </th>
            <th scope="col" className="px-6 py-3">
              Type
            </th>
            <th scope="col" className="px-6 py-3">
              Quantity
            </th>
            <th scope="col" className="px-6 py-3">
              User
            </th>
            <th scope="col" className="px-6 py-3">
              Notes
            </th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr
              key={t.id}
              className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              <td className="px-6 py-4 whitespace-nowrap">
                {new Date(t.createdAt).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </td>
              <td className="px-6 py-4">
                <div className="font-medium text-gray-900 dark:text-white">
                  {t.product.name}
                </div>
                <div className="text-xs text-gray-500">{t.product.sku}</div>
              </td>
              <td className="px-6 py-4 font-bold">
                {t.type === "IN" ? (
                  <span className="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-md">
                    IN
                  </span>
                ) : (
                  <span className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded-md">
                    OUT
                  </span>
                )}
              </td>
              <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                {t.type === "IN" ? "+" : "-"}
                {t.quantity}
              </td>
              <td className="px-6 py-4">
                <div className="font-medium text-gray-900 dark:text-white">
                  {t.user.name || "Unknown"}
                </div>
                <div className="text-xs text-gray-500">{t.user.email}</div>
              </td>
              <td className="px-6 py-4 italic text-gray-500">
                {t.notes || "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
