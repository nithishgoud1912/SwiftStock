"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function getBarcodes(productId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  return prisma.barcode.findMany({
    where: { productId },
    orderBy: { createdAt: "desc" },
  });
}

export async function addBarcode(
  productId: string,
  code: string,
  type: string,
) {
  const { userId, orgRole, orgId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  if (orgId && orgRole !== "org:admin")
    throw new Error("Only admins can manage barcodes.");

  try {
    const barcode = await prisma.barcode.create({
      data: {
        productId,
        code,
        type,
        isPrimary: false,
      },
    });
    return { success: true, barcode };
  } catch (error: any) {
    if (error.code === "P2002") {
      return {
        success: false,
        error: "This barcode already exists in the system.",
      };
    }
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function deleteBarcode(id: string) {
  const { userId, orgRole, orgId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  if (orgId && orgRole !== "org:admin")
    throw new Error("Only admins can manage barcodes.");

  await prisma.barcode.delete({ where: { id } });
  return { success: true };
}
