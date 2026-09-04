import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { currentUserId } from "@/lib/auth";

const initial = {
  profile: {
    name: "Ayo Okafor",
    title: "Filmmaker & Video Editor",
    bio: "I shape stories with image, rhythm and intention.",
    about: "A visual storyteller working across film, music, culture and brand.",
    email: "",
    heroImage: "",
    profileImage: "",
    skills: ["Direction", "Cinematography", "Editing"],
    socials: { instagram: "", vimeo: "", linkedin: "" },
    cvUrl: "",
    cvVisible: true,
  },
  folders: [
    { id: "reel", name: "Selected work", hidden: false, order: 0 },
  ],
  projects: [
    {
      id: "first-frame",
      folderId: "reel",
      title: "The first frame",
      summary: "A cinematic study in light, movement and place.",
      client: "Personal",
      year: "2026",
      role: "Director / Editor",
      thumbnail: "",
      videoUrl: "",
      featured: true,
      visible: true,
      order: 0,
    },
  ],
  settings: { metaDescription: "A cinematic portfolio", showContact: true },
};

export async function GET() {
  const id = await currentUserId();

  if (!id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let portfolio = await db.portfolio.findUnique({
    where: { userId: id },
  });

  // A logged-in user may exist without a Portfolio record if the database
  // was created before the seed ran. Create the CMS record automatically.
  if (!portfolio) {
    const slugExists = await db.portfolio.findUnique({ where: { slug: "ayo" } });
    const slug = slugExists ? `ayo-${id.slice(-8)}` : "ayo";

    portfolio = await db.portfolio.create({
      data: {
        userId: id,
        slug,
        draft: initial as Prisma.InputJsonValue,
        published: initial as Prisma.InputJsonValue,
        publishedAt: new Date(),
      },
    });
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
