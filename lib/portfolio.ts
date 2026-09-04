import { db } from "./db";
import type { PortfolioData } from "./types";

function isPortfolioData(value: unknown): value is PortfolioData {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const data = value as Partial<PortfolioData>;
  return Boolean(
    data.profile &&
      typeof data.profile === "object" &&
      Array.isArray(data.folders) &&
      Array.isArray(data.projects) &&
      data.settings &&
      typeof data.settings === "object"
  );
}

export async function getPortfolio(
  slug: string,
  preview = false,
  ownerId?: string
) {
  const p = await db.portfolio.findUnique({ where: { slug } });

  if (!p || (!preview && (!p.isPublic || !p.published))) return null;
  if (preview && p.userId !== ownerId) return null;

  const selected = preview ? p.draft : p.published;
  const data = isPortfolioData(selected)
    ? selected
    : isPortfolioData(p.draft)
      ? p.draft
      : null;

  if (!data) return null;

  return {
    id: p.id,
    slug: p.slug,
    data,
    publishedAt: p.publishedAt,
    isPublic: p.isPublic,
  };
}
