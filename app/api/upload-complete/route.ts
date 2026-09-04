import { head } from "@vercel/blob";
import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/auth";

export async function POST(request: Request) {
  if (!(await currentUserId())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { pathname?: string };
    const pathname = typeof body.pathname === "string" ? body.pathname : "";

    if (!pathname || pathname.includes("..") || pathname.startsWith("/")) {
      return NextResponse.json({ error: "Invalid upload path." }, { status: 400 });
    }

    const blob = await head(pathname);

    return NextResponse.json({
      ok: true,
      url: blob.url,
      downloadUrl: blob.downloadUrl,
      pathname: blob.pathname,
      contentType: blob.contentType,
      size: blob.size,
    });
  } catch (error) {
    console.error("Blob upload verification error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not verify uploaded file." },
      { status: 500 },
    );
  }
}
