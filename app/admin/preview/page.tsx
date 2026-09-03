import { redirect } from "next/navigation";
import { currentUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import PortfolioView from "@/components/PortfolioView";

export default async function Preview(){
  const id=await currentUserId(); if(!id)redirect("/admin/login");
  const p=await db.portfolio.findUnique({where:{userId:id}}); if(!p)redirect("/admin");
  return <><div className="preview-bar">PREVIEW MODE — NOT PUBLISHED <a href="/admin">Return to editor</a></div><PortfolioView slug={p.slug} portfolio={p.draft as never}/></>;
}
