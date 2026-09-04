import { issueSignedToken, presignUrl } from "@vercel/blob";
import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/auth";

const allowedContentTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "video/mp4",
  "video/webm",
  "application/pdf",
]);

export async function POST(request: Request) {
  if (!(await currentUserId())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      filename?: string;
      contentType?: string;
    };

    const filename = typeof body.filename === "string" ? body.filename : "";
    const contentType = typeof body.contentType === "string" ? body.contentType : "";

    if (!filename || !allowedContentTypes.has(contentType)) {
      return NextResponse.json({ error: "Unsupported file type." }, { status: 400 });
    }

    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "-");
    const pathname = `portfolio/${crypto.randomUUID()}-${safeName}`;

    const token = await issueSignedToken({ operations: ["put"] });
    const { presignedUrl } = await presignUrl(token, {
      pathname,
      operation: "put",
      validUntil: Date.now() + 15 * 60 * 1000,
    });

    return NextResponse.json({
      presignedUrl,
      blobUrl: presignedUrl.split("?")[0],
      pathname,
    });
  } catch (error) {
    console.error("Signed Blob upload URL error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not prepare upload." },
      { status: 500 },
    );
  }
}
