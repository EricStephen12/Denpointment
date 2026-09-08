import { NextRequest, NextResponse } from "next/server";
import { runDailyAutomations } from "@/lib/automations";

/**
 * Cron Endpoint: Runs the daily Birthday and Smile Anniversary automated sweeps.
 *
 * Trigger daily via Vercel Cron or GitHub Actions:
 * Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (process.env.NODE_ENV === "production" && !secret) {
    console.error("[automations:cron] CRON_SECRET is required in production");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 503 });
  }

  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const results = await runDailyAutomations();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...results,
    });
  } catch (error: any) {
    console.error("[automations:cron] Sweep failed:", error);
    return NextResponse.json(
      { error: error?.message || "Internal automation error" },
      { status: 500 }
    );
  }
}
