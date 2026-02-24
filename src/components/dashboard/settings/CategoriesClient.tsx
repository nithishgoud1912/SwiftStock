"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCategories,
  createCategory,
  deleteCategory,
} from "@/app/lib/actions/settings";
import { Plus, Trash2, Edit } from "lucide-react";
import toast from "react-hot-toast";

export default function CategoriesClient() {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDesc, setNewCategoryDesc] = useState("");

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createCategory({
        name: newCategoryName,
        description: newCategoryDesc,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setIsAddOpen(false);
      setNewCategoryName("");
      setNewCategoryDesc("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete category");
    },
  });

  if (isLoading)
    return (
      <div className="animate-pulse flex space-x-4">
        <div className="flex-1 space-y-4 py-1">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );

  return (
    <div className="flex-1 flex flex-col">
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 bg-[#6c47ff] hover:bg-[#5a38e8] text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus size={18} />
          New Category
        </button>
      </div>

      {isAddOpen && (
        <div className="mb-6 bg-gray-50 dark:bg-gray-800/50 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            Create Category
          </h3>
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              placeholder="Category Name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="flex-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#6c47ff]"
            />
            <input
              type="text"
              placeholder="Description (Optional)"
              value={newCategoryDesc}
              onChange={(e) => setNewCategoryDesc(e.target.value)}
              className="flex-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#6c47ff]"
            />
            <button
              onClick={() => createMutation.mutate()}
              disabled={!newCategoryName || createMutation.isPending}
              className="bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 font-medium px-4 py-2 rounded-md transition-colors disabled:opacity-50"
            >
              {createMutation.isPending ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => setIsAddOpen(false)}
              className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 px-4 py-2 rounded-md transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden flex-1 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">
              <th className="p-4">Name</th>
              <th className="p-4">Description</th>
              <th className="p-4 w-32">Products</th>
              <th className="p-4 w-24 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
            {categories?.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="p-8 text-center text-gray-500 dark:text-gray-400"
                >
                  No categories found. Create one to get started!
                </td>
              </tr>
            )}
            {categories?.map((category: any) => (
              <tr
                key={category.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <td className="p-4 font-medium text-gray-900 dark:text-white">
                  {category.name}
                </td>
                <td className="p-4 text-sm text-gray-500 dark:text-gray-400">
                  {category.description || "-"}
                </td>
                <td className="p-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs font-medium">
                    {category._count?.products || 0} items
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          `Are you sure you want to delete "${category.name}"?`,
                        )
                      ) {
                        deleteMutation.mutate(category.id);
                      }
                    }}
                    disabled={
                      category._count?.products > 0 || deleteMutation.isPending
                    }
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
                    title={
                      category._count?.products > 0
                        ? "Cannot delete category containing products"
                        : "Delete category"
                    }
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
