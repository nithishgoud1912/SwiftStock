"use client";

import { useInventoryStore } from "@/app/lib/store/useInventoryStore";
import { useQuery } from "@tanstack/react-query";
import { getOrganization } from "@/app/lib/actions/settings";
import toast from "react-hot-toast";

export default function AddProductButton() {
  const openAddProductModal = useInventoryStore(
    (state) => state.openAddProductModal,
  );

  const { data: org } = useQuery({
    queryKey: ["organization"],
    queryFn: () => getOrganization(),
  });

  const isLimitReached =
    org?.subscriptionTier === "FREE" && (org?._count?.products ?? 0) >= 3;

  const handleClick = () => {
    if (isLimitReached) {
      toast.error(
        "You have reached the maximum of 3 products on the FREE tier.",
        { duration: 4000 },
      );
      // In fully implemented Razorpay flow, this might open a billing modal instead
    } else {
      openAddProductModal();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`px-4 py-2 rounded-lg font-medium shadow-sm transition-colors text-white ${
        isLimitReached
          ? "bg-gray-400 cursor-not-allowed hover:bg-gray-400 opacity-80"
          : "bg-[#6c47ff] hover:bg-[#8b6fff]"
      }`}
      title={
        isLimitReached
          ? "Upgrade to PRO to add more products"
          : "Add New Product"
      }
    >
      {isLimitReached ? "Upgrade to PRO" : "+ Add New Product"}
    </button>
  );
}
