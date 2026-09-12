import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="mx-auto min-h-screen max-w-2xl bg-[#FAF8F4] px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="font-display text-lg font-medium text-gray-900">Ruang Kita — Tenant Portal</div>
        <UserButton afterSignOutUrl="/" />
      </div>
      {children}
    </div>
  );
}
