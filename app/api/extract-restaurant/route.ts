import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { extractRestaurantFromPlace } from "@/lib/groq";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const name = (body.name ?? "").toString().trim();
    const addressOrRegion =
      typeof body.addressOrRegion === "string" ? body.addressOrRegion : null;

    if (!name) {
      return NextResponse.json(
        { error: "Missing restaurant name" },
        { status: 400 },
      );
    }

    const data = await extractRestaurantFromPlace(name, addressOrRegion);
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Extract restaurant error:", error);
    return NextResponse.json(
      { error: "Failed to enrich restaurant" },
      { status: 500 },
    );
  }
}
