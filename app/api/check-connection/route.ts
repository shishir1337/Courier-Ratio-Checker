import { NextResponse } from "next/server";
import { checkConnection } from "@/lib/bdcourier";

export async function GET() {
  try {
    const res = await checkConnection();
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        {
          status: "error",
          message: data?.error || (res.status === 401 ? "Invalid API key" : "Connection failed"),
        },
        { status: res.status >= 400 ? res.status : 502 }
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { status: "error", message: "Service temporarily unavailable" },
      { status: 502 }
    );
  }
}
