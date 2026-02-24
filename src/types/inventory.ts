export interface Product {
  id: string;
  name: string;
  description: string | null;
  sku: string;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  imageUrl: string | null;
  lowStockThreshold: number;
  categoryId: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  category: {
    id: string;
    name: string;
  };
}
