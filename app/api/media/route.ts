import { del, list } from "@vercel/blob";
import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/auth";
import { db } from "@/lib/db";

function collectUrls(value: unknown, urls = new Set<string>()) {
  if (typeof value === "string" && value.includes(".blob.vercel-storage.com/")) urls.add(value);
  else if (Array.isArray(value)) value.forEach((item) => collectUrls(item, urls));
  else if (value && typeof value === "object") Object.values(value as Record<string, unknown>).forEach((item) => collectUrls(item, urls));
  return urls;
}

export async function GET() {
  const id = await currentUserId();
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const portfolio = await db.portfolio.findUnique({ where: { userId: id } });
    const used = new Set<string>();
    if (portfolio) {
      collectUrls(portfolio.draft, used);
      collectUrls(portfolio.published, used);
    }

    const blobs = [];
    let cursor: string | undefined;
    do {
      const page = await list({ prefix: "portfolio/", limit: 1000, cursor });
      blobs.push(...page.blobs);
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);

    const media = blobs
      .map((blob) => ({
        url: blob.url,
        pathname: blob.pathname,
        size: blob.size,
        uploadedAt: blob.uploadedAt,
        used: used.has(blob.url),
      }))
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

    return NextResponse.json({ media, totalBytes: media.reduce((sum, item) => sum + item.size, 0) });
  } catch (error) {
    console.error("Media library error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load media." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const id = await currentUserId();
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { url } = (await request.json()) as { url?: string };
    if (!url || !url.includes(".blob.vercel-storage.com/")) return NextResponse.json({ error: "Invalid media URL." }, { status: 400 });

    const portfolio = await db.portfolio.findUnique({ where: { userId: id } });
    const used = new Set<string>();
    if (portfolio) {
      collectUrls(portfolio.draft, used);
      collectUrls(portfolio.published, used);
    }
    if (used.has(url)) return NextResponse.json({ error: "This file is currently used in your draft or published portfolio. Remove/replace it there and save first." }, { status: 409 });

    await del(url);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Media delete error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not delete media." }, { status: 500 });
  }
}
