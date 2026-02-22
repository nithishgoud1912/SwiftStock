import { create } from "zustand";

interface InventoryState {
  isAdjustModalOpen: boolean;
  selectedProductId: string | null;
  transactionType: "IN" | "OUT";

  openAdjustModal: (productId: string, type: "IN" | "OUT") => void;
  closeAdjustModal: () => void;

  isAddProductModalOpen: boolean;
  openAddProductModal: () => void;
  closeAddProductModal: () => void;
}

export const useInventoryStore = create<InventoryState>((set) => ({
  isAdjustModalOpen: false,
  selectedProductId: null,
  transactionType: "IN", 

  openAdjustModal: (productId, type) =>
    set({
      isAdjustModalOpen: true,
      selectedProductId: productId,
      transactionType: type,
    }),

  closeAdjustModal: () =>
    set({ isAdjustModalOpen: false, selectedProductId: null }),

  isAddProductModalOpen: false,
  openAddProductModal: () => set({ isAddProductModalOpen: true }),
  closeAddProductModal: () => set({ isAddProductModalOpen: false }),
}));
