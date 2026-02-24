"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getAuthorizedOrgId } from "@/lib/auth-helpers";
import Papa from "papaparse";

export async function importInventoryCSV(csvText: string) {
  const organizationId = await getAuthorizedOrgId();

  try {
    const { data: rows, errors } = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    if (errors.length > 0) {
      throw new Error("Invalid CSV format");
    }

    // Process rows and insert into the database
    // For simplicity in this action, we'll iterate and upsert based on SKU
    // Assuming CSV has exact headers: "Product Name", "SKU", "Quantity", "Low Stock Threshold", "Cost Price", "Selling Price"
    // Also handling category if it exists in another column (or leaving uncategorized)

    for (const row of rows as any[]) {
      const sku = row["SKU"]?.trim();
      const name = row["Product Name"]?.trim();
      if (!sku || !name) continue; // Skip invalid rows (or the Totals row)

      if (name.toUpperCase() === "TOTALS") continue; // Skip our export totals row if they re-uploaded it

      const quantity = parseInt(row["Quantity"] || "0", 10);
      const lowStockThreshold = parseInt(
        row["Low Stock Threshold"] || "10",
        10,
      );
      const costPrice = parseFloat(row["Cost Price"] || "0");
      const sellingPrice = parseFloat(row["Selling Price"] || "0");

      let categoryName = row["Category"]?.trim();
      let category;

      if (categoryName && categoryName.toUpperCase() !== "UNCATEGORIZED") {
        category = await prisma.category.findFirst({
          where: {
            organizationId,
            name: { equals: categoryName, mode: "insensitive" },
          },
        });

        if (!category) {
          category = await prisma.category.create({
            data: {
              organizationId,
              name: categoryName,
              description: "Imported from CSV",
            },
          });
        }
      } else {
        // Fallback to Uncategorized if empty or explicitly 'Uncategorized'
        category = await prisma.category.findFirst({
          where: { organizationId, name: "Uncategorized" },
        });

        if (!category) {
          category = await prisma.category.create({
            data: {
              organizationId,
              name: "Uncategorized",
              description: "System generated for CSV imports",
            },
          });
        }
      }

      await prisma.product.upsert({
        where: { sku },
        update: {
          name,
          quantity, // Note: Direct update. In strict ledgers we might require a transaction instead.
          lowStockThreshold,
          costPrice,
          sellingPrice,
        },
        create: {
          organizationId,
          categoryId: category.id,
          name,
          sku,
          quantity,
          lowStockThreshold,
          costPrice,
          sellingPrice,
        },
      });
    }

    revalidatePath("/dashboard/inventory");
    return { success: true, count: rows.length };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to parse CSV" };
  }
}

export async function importTransactionsCSV(csvText: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const { data: rows, errors } = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    if (errors.length > 0) throw new Error("Invalid CSV format");

    let importedCount = 0;

    for (const row of rows as any[]) {
      // Remove starting/ending quotes that might appear if PapaParse doesn't strip them cleanly due to formatting
      const cleanString = (val: string) =>
        val ? val.trim().replace(/^"|"$/g, "") : "";

      const sku = cleanString(row["SKU"]);
      const action = cleanString(row["Action"]); // "Stock Added" or "Stock Removed"
      const quantityStr = cleanString(row["Quantity Change"]);

      if (!sku || !action || !quantityStr) continue;
      if (sku.toUpperCase() === '""' || row["Date & Time"] === '"TOTALS"')
        continue;

      const product = await prisma.product.findUnique({
        where: { sku },
      });

      if (!product) continue; // Skip transactions for unknown SKUs

      // parse absolute quantity
      const qtyChange = Math.abs(parseInt(quantityStr, 10));
      if (isNaN(qtyChange) || qtyChange === 0) continue;

      const txType = action.includes("Added") ? "IN" : "OUT";

      // 1. Log transaction
      await prisma.stockTransaction.create({
        data: {
          productId: product.id,
          userId,
          type: txType,
          quantity: qtyChange,
          notes: row["Notes"]?.trim() || "Imported historically via CSV",
        },
      });

      // 2. Adjust live inventory based on this import
      // Only uncomment this if the user wants historical transactions to OVERRIDE their current stock math.
      // E.g:
      /*
        await prisma.product.update({
          where: { id: product.id },
          data: { quantity: txType === "IN" ? { increment: qtyChange } : { decrement: qtyChange } }
        });
      */

      importedCount++;
    }

    revalidatePath("/dashboard/transactions");
    return { success: true, count: importedCount };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to parse" };
  }
}
