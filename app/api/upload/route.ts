import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { list } from "@vercel/blob";
import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/auth";

const allowedContentTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "video/mp4",
  "video/webm",
  "application/pdf",
];

export async function GET() {
  if (!(await currentUserId())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // New Vercel Blob projects can use Vercel OIDC, so do not require the
    // legacy BLOB_READ_WRITE_TOKEN to be present in the function environment.
    await list({ limit: 1 });
    return NextResponse.json({ configured: true, tokenWorks: true });
  } catch (error) {
    console.error("Blob token diagnostic failed:", error);
    return NextResponse.json(
      {
        configured: true,
        tokenWorks: false,
        error: error instanceof Error ? error.message : "Blob authentication failed.",
      },
      { status: 502 },
    );
  }
}

export async function POST(request: Request) {
  if (!(await currentUserId())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as HandleUploadBody;

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes,
        maximumSizeInBytes: 200 * 1024 * 1024,
        addRandomSuffix: true,
      }),
      onUploadCompleted: async ({ blob }) => {
        console.log("Portfolio Blob upload completed:", blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    console.error("Blob client-token error:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
