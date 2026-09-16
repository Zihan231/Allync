import { NextResponse } from "next/server";
import { api, isApiError } from "@/lib/api/axios";

export async function GET() {
  try {
    const res = await api.get<unknown[]>("/users");
    return NextResponse.json({ connected: true, userCount: res.data.length });
  } catch (error) {
    return NextResponse.json(
      { connected: false, error: isApiError(error) ? error.message : String(error) },
      { status: 502 },
    );
  }
}
