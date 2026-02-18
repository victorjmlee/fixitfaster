import { NextResponse } from "next/server";
import { clearSubmissions } from "@/lib/store";

export async function POST() {
  clearSubmissions();
  return NextResponse.json({ ok: true });
}
