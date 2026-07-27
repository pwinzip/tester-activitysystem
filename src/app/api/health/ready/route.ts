import { NextResponse } from "next/server";
import { prisma } from "@/server/lib/prisma";

export const dynamic = "force-dynamic";

// Readiness: the service is ready to accept traffic only when the DB responds.
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ready" });
  } catch {
    return NextResponse.json({ status: "not-ready" }, { status: 503 });
  }
}
