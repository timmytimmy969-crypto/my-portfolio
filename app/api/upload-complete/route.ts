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

    // Blob can add a random suffix to the stored filename. List the upload
    // folder and match the exact generated name, or the same filename stem
    // with Blob's random suffix inserted before the extension.
    const slash = pathname.lastIndexOf("/");
    const directory = slash >= 0 ? pathname.slice(0, slash + 1) : "";
    const filename = slash >= 0 ? pathname.slice(slash + 1) : pathname;
    const dot = filename.lastIndexOf(".");
    const stem = dot > 0 ? filename.slice(0, dot) : filename;
    const extension = dot > 0 ? filename.slice(dot) : "";

    const result = await list({ prefix: directory, limit: 1000 });
    const candidates = result.blobs.filter((blob) => blob.pathname.startsWith(directory));
    const match = candidates.find((blob) => {
      const actualName = blob.pathname.slice(directory.length);
      return (
        actualName === filename ||
        (extension && actualName.startsWith(`${stem}-`) && actualName.endsWith(extension)) ||
        (!extension && actualName.startsWith(`${stem}-`))
      );
    });

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
