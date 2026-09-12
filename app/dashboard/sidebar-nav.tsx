"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  Wallet,
  Wrench,
  UserPlus,
  CreditCard,
  ShieldCheck,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/properties", label: "Properties", icon: Building2 },
  { href: "/dashboard/tenants", label: "Tenants", icon: Users },
  { href: "/dashboard/rent", label: "Rent", icon: Wallet },
  { href: "/dashboard/maintenance", label: "Maintenance", icon: Wrench },
  { href: "/dashboard/team", label: "Team", icon: UserPlus },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
];

export default function SidebarNav({
  onNavigate,
  isAdmin,
}: {
  onNavigate?: () => void;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const items = isAdmin
    ? [...NAV_ITEMS, { href: "/admin/requests", label: "Admin", icon: ShieldCheck }]
    : NAV_ITEMS;

  return (
    <ul className="space-y-0.5 text-sm">
      {items.map(({ href, label, icon: Icon }) => {
        const isActive = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors ${
                isActive
                  ? "bg-brand-50 font-medium text-brand-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Icon size={17} className={isActive ? "text-brand-600" : "text-gray-400"} />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
