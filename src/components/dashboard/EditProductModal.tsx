"use client";

import { useState, useEffect } from "react";
import { useInventoryStore } from "@/app/lib/store/useInventoryStore";
import { updateProductAction } from "@/app/lib/actions/inventory";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { getCategories, createCategory } from "@/app/lib/actions/settings";
import { UploadDropzone } from "@/lib/uploadthing";
import { X } from "lucide-react";
import toast from "react-hot-toast";

export default function EditProductModal() {
  const { isEditProductModalOpen, selectedProduct, closeEditProductModal } =
    useInventoryStore();

  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [imageUrl, setImageUrl] = useState<string>("");

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    categoryId: "",
    description: "",
    costPrice: 0,
    sellingPrice: 0,
    lowStockThreshold: 10,
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
    enabled: isEditProductModalOpen,
  });
  const [errorMsg, setErrorMsg] = useState("");

  const queryClient = useQueryClient();

  const createCategoryMutation = useMutation({
    mutationFn: () => createCategory({ name: newCategoryName }),
    onSuccess: (newCat) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setFormData((prev) => ({ ...prev, categoryId: newCat.id }));
      setIsCreatingCategory(false);
      setNewCategoryName("");
    },
  });

  // Populate form when a product is selected
  useEffect(() => {
    if (selectedProduct) {
      setFormData({
        name: selectedProduct.name,
        sku: selectedProduct.sku,
        categoryId: selectedProduct.categoryId || "",
        description: selectedProduct.description || "",
        costPrice: Number(selectedProduct.costPrice),
        sellingPrice: Number(selectedProduct.sellingPrice),
        lowStockThreshold: selectedProduct.lowStockThreshold,
      });
      setImageUrl(selectedProduct.imageUrl || "");
      setErrorMsg("");
    }
  }, [selectedProduct]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!selectedProduct) throw new Error("No product selected");
      return updateProductAction(selectedProduct.id, {
        ...formData,
        imageUrl,
      });
    },
    onSuccess: (result) => {
      if (!result.success) {
        setErrorMsg(result.error || "Failed to update product.");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      closeEditProductModal();
    },
  });

  if (!isEditProductModalOpen || !selectedProduct) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ["costPrice", "sellingPrice", "lowStockThreshold"].includes(name)
        ? Number(value)
        : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <div
      className="fixed inset-0 z-100 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeEditProductModal();
      }}
    >
      <div className="relative w-full max-w-[calc(100vw-2rem)] md:max-w-lg rounded-xl bg-white dark:bg-gray-800 p-6 shadow-2xl border border-transparent dark:border-gray-700 max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold dark:text-white">Edit Product</h2>
          <button
            onClick={closeEditProductModal}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 rounded-md bg-red-50 p-4 border border-red-200">
            <p className="text-sm text-red-700 font-medium">{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* PRODUCT IMAGE UPLOAD */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Product Image (Optional)
            </label>
            {imageUrl ? (
              <div className="relative inline-block">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="h-32 w-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                />
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm hover:bg-red-600 focus:outline-none"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            ) : (
              <UploadDropzone
                endpoint="productImage"
                className="mt-2 ut-label:text-blue-600 ut-button:bg-blue-600 ut-button:ut-readying:bg-blue-500/50 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 shadow-sm items-center justify-center ut-upload-icon:w-6 ut-upload-icon:h-6 ut-label:text-sm ut-allowed-content:text-xs py-4"
                onClientUploadComplete={(res) => {
                  if (res && res.length > 0) {
                    setImageUrl(res[0].url);
                    toast.success("Image uploaded successfully!");
                  }
                }}
                onUploadError={(error: Error) => {
                  toast.error(`Upload failed: ${error.message}`);
                }}
              />
            )}
          </div>

          <div>
            <label className="block tracking-wide text-sm font-medium text-gray-700 dark:text-gray-300">
              Name
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block tracking-wide text-sm font-medium text-gray-700 dark:text-gray-300">
              SKU
            </label>
            <input
              type="text"
              name="sku"
              required
              value={formData.sku}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description (Optional)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="e.g., Wireless ergonomic mouse with 2.4GHz connectivity..."
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Category
              </label>
              {!isCreatingCategory && (
                <button
                  type="button"
                  onClick={() => setIsCreatingCategory(true)}
                  className="text-xs font-medium text-[#6c47ff] hover:text-[#5a38e8] dark:text-[#8b6fff] dark:hover:text-[#a08aff] transition-colors"
                >
                  + Create New
                </button>
              )}
            </div>

            {isCreatingCategory ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="New category name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => createCategoryMutation.mutate()}
                  disabled={
                    !newCategoryName || createCategoryMutation.isPending
                  }
                  className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-3 py-2 rounded-md text-sm font-medium disabled:opacity-50 transition-colors"
                >
                  {createCategoryMutation.isPending ? "..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingCategory(false);
                    setNewCategoryName("");
                  }}
                  className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <select
                name="categoryId"
                required
                value={formData.categoryId}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    categoryId: e.target.value,
                  }))
                }
                className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                disabled={isCreatingCategory}
              >
                <option value="" disabled>
                  Select a category
                </option>
                {categories?.map((cat: { id: string; name: string }) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Cost Price
              </label>
              <input
                type="number"
                name="costPrice"
                step="0.01"
                required
                value={formData.costPrice}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Selling Price
              </label>
              <input
                type="number"
                name="sellingPrice"
                step="0.01"
                required
                value={formData.sellingPrice}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-8">
            <button
              type="button"
              onClick={closeEditProductModal}
              className="rounded-lg px-4 py-2 font-medium bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white"
              disabled={mutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              {mutation.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
