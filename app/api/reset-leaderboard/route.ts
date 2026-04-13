import { NextResponse } from "next/server";
import { clearSubmissions } from "@/lib/store";

export async function POST() {
  await clearSubmissions();
  return NextResponse.json({ ok: true });
}
