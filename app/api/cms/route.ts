import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { currentUserId } from "@/lib/auth";

export async function POST() {
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

  await db.portfolio.update({
    where: { id: portfolio.id },
    data: {
      published: portfolio.draft as Prisma.InputJsonValue,
      publishedAt: new Date(),
    },
  });

  return NextResponse.json({
    ok: true,
    publishedAt: new Date(),
  });
}
