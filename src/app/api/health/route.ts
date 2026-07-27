import { NextResponse } from "next/server";
import { prisma } from "@/server/lib/prisma";

export const dynamic = "force-dynamic";

// Public minimal health: verifies DB connectivity. Never leaks connection
// strings, container names, or stack traces (spec v2 §34.1).
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      database: "connected",
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      {
        status: "degraded",
        database: "unavailable",
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
