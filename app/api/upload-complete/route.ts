import { head, list } from "@vercel/blob";
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

    // Vercel Blob may add a random suffix to the actual stored pathname.
    // The pathname we signed for the PUT can therefore differ from the
    // pathname returned by Blob after the upload. Find the actual object
    // using the original pathname as a prefix, then read its canonical URL.
    const result = await list({ prefix: pathname, limit: 10 });
    const match = result.blobs.find(
      (blob) => blob.pathname === pathname || blob.pathname.startsWith(`${pathname}-`),
    );

    if (!match) {
      return NextResponse.json(
        { error: "Upload completed, but the Blob could not be found yet. Please try again." },
        { status: 404 },
      );
    }

    const blob = await head(match.url);

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
