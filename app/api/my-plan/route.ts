import { NextResponse } from "next/server";
import { getMyPlan } from "@/lib/bdcourier";

export async function GET() {
  try {
    const res = await getMyPlan();
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        {
          status: "error",
          error: data?.error || (res.status === 401 ? "Invalid API key" : "Request failed"),
        },
        { status: res.status >= 400 ? res.status : 502 }
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { status: "error", error: "Service temporarily unavailable" },
      { status: 502 }
    );
  }
}
