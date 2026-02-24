import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Use Resend to send the emails. (Requires process.env.RESEND_API_KEY)
// We will mock the client creation if the key doesn't exist to prevent crash during development.
let resend: any = null;
try {
  const { Resend } = require("resend");
  resend = new Resend(process.env.RESEND_API_KEY || "dummy_key");
} catch (e) {
  // Resend optional
}

export async function GET(request: Request) {
  // 1. Authenticate the Cron Request
  // In a real Vercel environment, we check the authorization header against CRON_SECRET
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. Fetch all products that are currently below their threshold
    // We group them by organization so we only send one email per org.
    // Prisma doesn't support column-to-column comparisons in findMany,
    // so we use a raw query to compare quantity < lowStockThreshold on the same row.
    const lowStockProducts: any[] = await prisma.$queryRaw`
      SELECT p.*, c.id as "categoryId", c.name as "categoryName"
      FROM "Product" p
      LEFT JOIN "Category" c ON p."categoryId" = c.id
      WHERE p.quantity < p."lowStockThreshold"
    `;

    if (lowStockProducts.length === 0) {
      return NextResponse.json({ message: "No low stock items today." });
    }

    // 3. Group the products by Organization ID
    const groupedByOrg = lowStockProducts.reduce((acc: any, product) => {
      if (!acc[product.organizationId]) {
        acc[product.organizationId] = [];
      }
      acc[product.organizationId].push(product);
      return acc;
    }, {});

    const emailsSent = [];

    // 4. For each organization, find the Admins/Owners and dispatch an email
    for (const [orgId, products] of Object.entries(groupedByOrg)) {
      // In a real-world scenario with Clerk, you would fetch the Organization's Admin list via Clerk SDK.
      // E.g., const admins = await clerkClient.organizations.getOrganizationMembershipList(...)
      // For this SaaS MVP snippet, we assume a designated notification email exists or we mock it.

      const emailHtml = generateEmailHtml(products as any[]);

      if (resend && process.env.RESEND_API_KEY) {
        // Send actual email via Resend
        await resend.emails.send({
          from: "SwiftStock Alerts <onboarding@resend.dev>", // Or your verified domain
          to: ["admin@your-company.com"], // Replace with dynamic org admin emails
          subject: "⚠️ Daily Low Stock Digest",
          html: emailHtml,
        });
        emailsSent.push(orgId);
      } else {
        // Mock sending for development/demonstration
        emailsSent.push(orgId);
      }
    }

    return NextResponse.json({
      success: true,
      notifiedOrgs: emailsSent.length,
      message: `Digest sent for ${emailsSent.length} organizations.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
}

// 5. Helper function to generate clean, responsive HTML for the email
function generateEmailHtml(products: any[]) {
  const trs = products.map(
    (p) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #111827; font-weight: 500;">
        ${p.name} <br/>
        <span style="font-size: 12px; color: #6b7280; font-weight: normal;">${p.sku}</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #ef4444; font-weight: bold; text-align: right;">
        ${p.quantity} 
        <span style="font-size: 12px; color: #6b7280; font-weight: normal;">(Min: ${p.lowStockThreshold})</span>
      </td>
    </tr>
  `,
  );

  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #6c47ff; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">SwiftStock Digest</h1>
      </div>
      
      <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
        <h2 style="color: #111827; margin-top: 0;">Action Required: Restock Items</h2>
        <p style="color: #4b5563; line-height: 1.5;">
          The following <strong>${products.length}</strong> products have dropped below their designated minimum stock thresholds. Please review and reorder as necessary to prevent fulfillment delays.
        </p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr>
              <th style="text-align: left; padding: 12px; border-bottom: 2px solid #e5e7eb; color: #374151;">Product</th>
              <th style="text-align: right; padding: 12px; border-bottom: 2px solid #e5e7eb; color: #374151;">Current Stock</th>
            </tr>
          </thead>
          <tbody>
            ${trs.join("")}
          </tbody>
        </table>
        
        <div style="margin-top: 30px; text-align: center;">
          <a href="https://your-domain.com/dashboard/inventory" style="display: inline-block; background-color: #6c47ff; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500;">
            View Live Inventory
          </a>
        </div>
      </div>
      
      <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px;">
        This is an automated operational alert generated by your SwiftStock Administrator settings.
      </p>
    </div>
  `;
}
