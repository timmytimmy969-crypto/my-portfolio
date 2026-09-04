export const dynamic = "force-dynamic";
export const revalidate = 0;

import { notFound } from "next/navigation";
import { getPortfolio } from "@/lib/portfolio";
import PortfolioView from "@/components/PortfolioView";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = await getPortfolio(slug);
  if (!p) return notFound();
  return <PortfolioView portfolio={p.data} slug={slug} />;
}
