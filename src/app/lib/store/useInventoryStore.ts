import { create } from "zustand";
import { Product } from "@/types/inventory";

interface InventoryState {
  isAdjustModalOpen: boolean;
  selectedProductId: string | null;
  transactionType: "IN" | "OUT";

  openAdjustModal: (productId: string, type: "IN" | "OUT") => void;
  closeAdjustModal: () => void;

  isAddProductModalOpen: boolean;
  openAddProductModal: () => void;
  closeAddProductModal: () => void;

  isEditProductModalOpen: boolean;
  selectedProduct: Product | null; // Stores the full product so we can pre-fill the Edit form

  openEditProductModal: (product: Product) => void;
  closeEditProductModal: () => void;

  isDeleteProductModalOpen: boolean;
  productsToDelete: Product[] | string[];
  openDeleteProductModal: (
    productOrIds: Product[] | string[] | Product,
  ) => void;
  closeDeleteProductModal: () => void;

  isManageBarcodesModalOpen: boolean;
  openManageBarcodesModal: (product: Product) => void;
  closeManageBarcodesModal: () => void;
}

export const useInventoryStore = create<InventoryState>((set) => ({
  isAdjustModalOpen: false,
  selectedProductId: null,
  transactionType: "IN",

  isEditProductModalOpen: false,
  isDeleteProductModalOpen: false,
  isManageBarcodesModalOpen: false,
  selectedProduct: null,
  productsToDelete: [],

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

  openEditProductModal: (product) =>
    set({ isEditProductModalOpen: true, selectedProduct: product }),
  closeEditProductModal: () =>
    set({ isEditProductModalOpen: false, selectedProduct: null }),

  openDeleteProductModal: (payload) =>
    set({
      isDeleteProductModalOpen: true,
      productsToDelete: Array.isArray(payload) ? payload : [payload],
    }),

  closeDeleteProductModal: () =>
    set({ isDeleteProductModalOpen: false, productsToDelete: [] }),

  openManageBarcodesModal: (product) =>
    set({
      isManageBarcodesModalOpen: true,
      selectedProduct: product,
    }),
  closeManageBarcodesModal: () =>
    set({
      isManageBarcodesModalOpen: false,
      selectedProduct: null,
    }),
}));
