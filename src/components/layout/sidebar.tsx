"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/stores/ui-store";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { mahberService } from "@/lib/api/service-factory";
import { useNotificationStore } from "@/lib/stores/notification-store";
import {
  LayoutDashboard,
  Users,
  Compass,
  Bell,
  Settings,
  User,
  MessageSquare,
  Calendar,
  Wallet,
  Activity,
  PlusCircle,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations("Sidebar");
  const { activeMahberId, sidebarOpen, setSidebarOpen } = useUIStore();
  const { unreadCount } = useNotificationStore();
  const [mounted, setMounted] = React.useState(false);

  const { data: myMahbers } = useQuery({
    queryKey: ["mahbers"],
    queryFn: () => mahberService.getMahbers(),
  });

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isGlobalRoute =
    !pathname.includes("/mahbers/") ||
    pathname === "/mahbers/create" ||
    pathname === "/mahbers/discover";

  const globalLinks = [
    { href: "/dashboard", label: t("dashboard"), icon: LayoutDashboard },
    { href: "/mahbers", label: t("myMahbers"), icon: Users },
    { href: "/mahbers/discover", label: t("discover"), icon: Compass },
    { href: "/notifications", label: t("notifications"), icon: Bell },
  ];

  const isFullyJoined =
    Array.isArray(myMahbers) && myMahbers.some((m) => m.id === activeMahberId);

  const mahberLinks = activeMahberId
    ? [
        {
          href: `/mahbers/${activeMahberId}`,
          label: t("overview"),
          icon: LayoutDashboard,
        },
        ...(isFullyJoined
          ? [
              {
                href: `/mahbers/${activeMahberId}/members`,
                label: t("members"),
                icon: Users,
              },
              {
                href: `/mahbers/${activeMahberId}/events`,
                label: t("events"),
                icon: Calendar,
              },
              {
                href: `/mahbers/${activeMahberId}/payments`,
                label: t("finances"),
                icon: Wallet,
              },
              {
                href: `/mahbers/${activeMahberId}/chat`,
                label: t("chat"),
                icon: MessageSquare,
              },
              {
                href: `/mahbers/${activeMahberId}/audit`,
                label: t("auditTrail"),
                icon: Activity,
              },
              {
                href: `/mahbers/${activeMahberId}/settings`,
                label: t("settings"),
                icon: Settings,
              },
            ]
          : []),
      ]
    : [];

  const links = isGlobalRoute ? globalLinks : mahberLinks;

  const closeMobileMenu = () => setSidebarOpen(false);

  if (!mounted) return null;

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-30"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "w-60 bg-background-surface border-r border-border shrink-0",
          "fixed md:static top-16 bottom-0 left-0 md:inset-auto z-40 md:z-0",
          sidebarOpen && "flex flex-col",
          !sidebarOpen && "hidden md:flex md:flex-col"
        )}
      >
        {/* Logo — links back to landing page */}
        <div className="h-16 flex items-center px-5 border-b border-border">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/Mahber_Connect_Logo.svg"
              alt="MahberConnect"
              width={220}
              height={90}
              unoptimized
              className="h-20 w-auto"
            />
          </Link>
        </div>

        {/* Create button */}
        <div className="px-3 pt-4 pb-2">
          <Button
            asChild
            size="sm"
            className="w-full justify-start gap-2 bg-gold hover:bg-gold-dark text-black font-medium"
          >
            <Link href="/mahbers/create">
              <PlusCircle className="w-4 h-4" />
              {t("createMahber")}
            </Link>
          </Button>
        </div>

        {/* Nav section label */}
        <div className="px-5 pt-4 pb-1">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">
            {isGlobalRoute ? t("globalNav") : t("mahberMenu")}
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5">
          {links.map((link) => {
            const Icon = link.icon;
            const hasMoreSpecificMatch = links.some(
              (l) =>
                l.href !== link.href &&
                l.href.startsWith(link.href) &&
                pathname.startsWith(l.href),
            );

            const isActive =
              pathname === link.href ||
              (link.href !== "/dashboard" &&
                pathname.startsWith(link.href) &&
                isGlobalRoute &&
                !hasMoreSpecificMatch);

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMobileMenu}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors justify-between",
                  isActive
                    ? "bg-gold/10 text-gold"
                    : "text-text-secondary hover:bg-background-subtle hover:text-text-primary"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "w-4 h-4 shrink-0",
                      isActive ? "text-gold" : "text-text-muted"
                    )}
                  />
                  {link.label}
                </div>
                {link.href === "/notifications" && unreadCount > 0 && (
                  <span className="flex h-5 items-center justify-center rounded-full bg-status-error px-2 text-[10px] font-bold text-white shadow-sm">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}

          {!isGlobalRoute && (
            <div className="pt-4 mt-4 border-t border-border">
              <Link
                href="/dashboard"
                onClick={closeMobileMenu}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-text-secondary hover:bg-background-subtle hover:text-text-primary transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-text-muted" />
                {t("backToDashboard")}
              </Link>
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="px-3 pb-4 pt-2 border-t border-border space-y-0.5">
          <Link
            href="/profile"
            onClick={closeMobileMenu}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-text-secondary hover:bg-background-subtle hover:text-text-primary transition-colors"
          >
            <User className="w-4 h-4 text-text-muted" />
            {t("profile")}
          </Link>
          <Link
            href="/settings"
            onClick={closeMobileMenu}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-text-secondary hover:bg-background-subtle hover:text-text-primary transition-colors"
          >
            <Settings className="w-4 h-4 text-text-muted" />
            {t("settings")}
          </Link>
        </div>
      </aside>
    </>
  );
}
