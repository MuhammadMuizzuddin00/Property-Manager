import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isPlatformAdmin } from "@/lib/auth";
import DashboardShell from "./dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const isAdmin = await isPlatformAdmin();

  return <DashboardShell isAdmin={isAdmin}>{children}</DashboardShell>;
}
