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

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return NextResponse.json({ configured: false }, { status: 500 });
  }

  try {
    await list({ limit: 1, token });
    return NextResponse.json({ configured: true, tokenWorks: true });
  } catch (error) {
    console.error("Blob token diagnostic failed:", error);
    return NextResponse.json(
      {
        configured: true,
        tokenWorks: false,
        error: error instanceof Error ? error.message : "Blob token test failed.",
      },
      { status: 502 },
    );
  }
}

export async function POST(request: Request) {
  if (!(await currentUserId())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    console.error("Blob upload error: BLOB_READ_WRITE_TOKEN is missing.");
    return NextResponse.json(
      { error: "Blob storage is not configured on this deployment." },
      { status: 500 },
    );
  }

  try {
    const body = (await request.json()) as HandleUploadBody;

    const jsonResponse = await handleUpload({
      token,
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
