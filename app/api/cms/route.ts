import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { currentUserId } from "@/lib/auth";

export async function GET() {
  const id = await currentUserId();

  if (!id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const portfolio = await db.portfolio.findUnique({
    where: { userId: id },
  });

  if (!portfolio) {
    return NextResponse.json(
      { error: "Portfolio not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    draft: portfolio.draft,
    slug: portfolio.slug,
  });
}

export async function PUT(req: Request) {
  const id = await currentUserId();

  if (!id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const portfolio = await db.portfolio.findUnique({
    where: { userId: id },
  });

  if (!portfolio) {
    return NextResponse.json(
      { error: "Portfolio not found" },
      { status: 404 }
    );
  }

  try {
    const body = await req.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid portfolio data" },
        { status: 400 }
      );
    }

    await db.portfolio.update({
      where: { id: portfolio.id },
      data: {
        draft: body as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Could not save draft" },
      { status: 500 }
    );
  }
}
