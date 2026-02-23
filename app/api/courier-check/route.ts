import { NextResponse } from "next/server";
import { courierCheck, normalizeBdPhone } from "@/lib/bdcourier";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const raw = typeof body?.phone === "string" ? body.phone : "";
    const phone = normalizeBdPhone(raw);

    if (!phone) {
      return NextResponse.json(
        { status: "error", error: "Enter a valid BD number (11 digits, e.g. 01730285500 or +8801730285500)" },
        { status: 400 }
      );
    }

    const res = await courierCheck(phone);
    const data = await res.json();

    if (!res.ok) {
      const message =
        data?.error || (res.status === 401 ? "Invalid API key" : "Request failed");
      return NextResponse.json(
        { status: "error", error: message },
        { status: res.status >= 400 ? res.status : 502 }
      );
    }

    if (data?.status === "error") {
      const isNotFound =
        res.status === 404 ||
        String(data.error || "").toLowerCase().includes("not found");
      return NextResponse.json(
        { status: "error", error: data.error || "Unknown error" },
        { status: isNotFound ? 404 : 400 }
      );
    }

    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { status: "error", error: "Service temporarily unavailable" },
      { status: 502 }
    );
  }
}
