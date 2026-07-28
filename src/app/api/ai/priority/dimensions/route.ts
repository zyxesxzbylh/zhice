import { NextResponse } from "next/server";
import { PRIORITY_DIMENSIONS } from "@/lib/ai/priority-guide";

/**
 * GET /api/ai/priority/dimensions
 * 返回四维度提问配置
 */
export async function GET() {
  return NextResponse.json({
    dimensions: PRIORITY_DIMENSIONS,
  });
}
