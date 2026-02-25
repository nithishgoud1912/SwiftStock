import { z } from "zod";

// ================================
// Inventory Action Schemas
// ================================

/** Schema for stock adjustments (add/remove inventory) */
export const adjustStockSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantityChange: z
    .number()
    .int("Quantity must be a whole number")
    .positive("Quantity must be greater than 0"),
  type: z.enum(["IN", "OUT"], {
    error: "Type must be 'IN' or 'OUT'",
  }),
});

/** Schema for adding a new product */
export const addProductSchema = z.object({
  name: z
    .string()
    .min(1, "Product name is required")
    .max(255, "Product name too long"),
  sku: z.string().min(1, "SKU is required").max(100, "SKU too long"),
  categoryId: z.string().min(1, "Category is required"),
  description: z.string().max(500, "Description too long").optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  quantity: z
    .number()
    .int("Quantity must be a whole number")
    .min(0, "Quantity cannot be negative"),
  lowStockThreshold: z
    .number()
    .int("Threshold must be a whole number")
    .min(0, "Threshold cannot be negative")
    .default(10),
  costPrice: z.number().min(0, "Cost price cannot be negative"),
  sellingPrice: z.number().min(0, "Selling price cannot be negative"),
});

/** Schema for updating an existing product */
export const updateProductSchema = z.object({
  name: z
    .string()
    .min(1, "Product name is required")
    .max(255, "Product name too long"),
  sku: z.string().min(1, "SKU is required").max(100, "SKU too long"),
  categoryId: z.string().min(1, "Category is required"),
  description: z.string().max(500, "Description too long").optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  costPrice: z.number().min(0, "Cost price cannot be negative"),
  sellingPrice: z.number().min(0, "Selling price cannot be negative"),
  lowStockThreshold: z
    .number()
    .int("Threshold must be a whole number")
    .min(0, "Threshold cannot be negative"),
});

/** Schema for pagination cursor-based queries */
export const paginationSchema = z.object({
  cursor: z.string().optional(),
  take: z
    .number()
    .int()
    .min(1, "Must take at least 1")
    .max(100, "Cannot take more than 100")
    .default(20),
});

/** Schema for a generic entity ID (products, adjustments, etc.) */
export const entityIdSchema = z.string().min(1, "ID is required");

// ================================
// Category Schemas
// ================================

/** Schema for creating a category */
export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Category name is required")
    .max(100, "Category name too long"),
  description: z.string().max(500, "Description too long").optional(),
});

/** Schema for updating a category */
export const updateCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Category name is required")
    .max(100, "Category name too long"),
  description: z.string().max(500, "Description too long").optional(),
});

// ================================
// Webhook Schemas
// ================================

/** Schema for creating a webhook */
export const createWebhookSchema = z.object({
  url: z
    .string()
    .url("Must be a valid URL")
    .refine(
      (url) => url.startsWith("http://") || url.startsWith("https://"),
      "URL must use HTTP or HTTPS protocol",
    ),
  secret: z.string().max(255, "Secret too long").optional(),
});

/** Schema for toggling a webhook */
export const toggleWebhookSchema = z.object({
  id: z.string().min(1, "Webhook ID is required"),
  isActive: z.boolean(),
});

export const updateOrgProfileSchema = z.object({
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  contact: z.string().optional().nullable(),
  logoUrl: z.string().url().optional().nullable().or(z.literal("")),
});
