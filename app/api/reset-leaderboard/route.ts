import { NextResponse } from "next/server";
import { clearSubmissions } from "@/lib/store";

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  if (!token || token !== process.env.ADMIN_RESET_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  clearSubmissions();
  return NextResponse.json({ ok: true });
}
