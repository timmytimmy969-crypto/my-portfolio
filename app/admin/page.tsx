import { redirect } from "next/navigation"; import { currentUserId } from "@/lib/auth"; import AdminStudio from "@/components/AdminStudio";
export default async function Admin(){if(!await currentUserId())redirect("/admin/login");return <AdminStudio/>}
