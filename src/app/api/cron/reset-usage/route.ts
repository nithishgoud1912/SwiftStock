import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// This route should be called daily by Vercel Cron.
// Ensure your `vercel.json` has:
// { "crons": [{ "path": "/api/cron/reset-usage", "schedule": "0 0 * * *" }] }

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    // Verify it's actually Vercel calling this, if secure cron is enabled
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return new NextResponse("Unauthorized", { status: 401 });
    // }

    // Reset daily counts for all organizations
    const result = await prisma.organization.updateMany({
      data: {
        dailyTxCount: 0,
        dailyUpdateCount: 0,
        lastResetDate: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Reset usage for ${result.count} organizations.`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[CRON] Reset Usage Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
