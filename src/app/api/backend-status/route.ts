import { NextResponse } from "next/server";
import { apiFetch } from "@/lib/api/client";

export async function GET() {
  try {
    const users = await apiFetch<unknown[]>("/users");
    return NextResponse.json({ connected: true, userCount: users.length });
  } catch (error) {
    return NextResponse.json(
      { connected: false, error: error instanceof Error ? error.message : String(error) },
      { status: 502 },
    );
  }
}
