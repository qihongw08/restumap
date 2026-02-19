import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { uploadToR2 } from "@/lib/r2";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const formData = await request.formData();
    const files = formData.getAll("files");
    if (!files.length || !(files[0] instanceof File)) {
      return NextResponse.json(
        { error: "No files. Send multipart/form-data with 'files' (one or more)." },
        { status: 400 }
      );
    }
    const restaurantId = formData.get("restaurantId");
    if (typeof restaurantId !== "string" || !restaurantId.trim()) {
      return NextResponse.json(
        { error: "restaurantId is required (form field)." },
        { status: 400 }
      );
    }
    const groupId = formData.get("groupId");
    const groupIdVal =
      typeof groupId === "string" && groupId.trim() ? groupId.trim() : null;
    const urls: string[] = [];
    for (const entry of files) {
      const file = entry as File;
      const buffer = Buffer.from(await file.arrayBuffer());
      const url = await uploadToR2(
        {
          buffer,
          mimetype: file.type || "image/jpeg",
          originalFilename: file.name,
        },
        {
          userId: user.id,
          restaurantId: restaurantId.trim(),
          groupId: groupIdVal,
        },
      );
      urls.push(url);
    }
    return NextResponse.json({ urls });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
