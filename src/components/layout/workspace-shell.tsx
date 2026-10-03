"use client";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  UsersRoundIcon,
  CodeXmlIcon,
  ChartNoAxesCombinedIcon,
  RadarIcon,
  HistoryIcon,
  ShieldCheckIcon,
  LanguagesIcon,
  BellIcon,
  LockKeyholeIcon,
  GraduationCapIcon,
} from "lucide-react";
import { useLocale } from "./locale-provider";
import { Brand, SkipLink } from "./brand";
import { LocaleSwitch } from "./locale-switch";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import type { CopyKey } from "@/lib/i18n/messages";
import { useWorkspaceSession } from "@/components/workspace/account-provider";
import { WorkspaceSessionProvider } from "@/components/workspace/account-provider";
import { AccountSwitcher } from "@/components/workspace/workspace-page";
import { MockNotice } from "@/components/workspace/mock-notice";
import { cn } from "@/lib/utils";

function Navigation({ mobile = false }: { mobile?: boolean }) {
  const { t, locale } = useLocale();
  const pathname = usePathname();
  const navigation = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!mobile) return;
    const element = navigation.current;
    const current = element?.querySelector<HTMLElement>(
      '[aria-current="page"]',
    );
    if (!element || !current) return;
    let frameId = 0;
    const keepCurrentVisible = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        const frame = element.getBoundingClientRect();
        const item = current.getBoundingClientRect();
        element.scrollLeft +=
          item.left - frame.left - (frame.width - item.width) / 2;
      });
    };
    const observer = new ResizeObserver(keepCurrentVisible);
    observer.observe(element);
    observer.observe(current);
    keepCurrentVisible();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frameId);
    };
  }, [pathname, mobile, locale]);
  const { data: user } = useWorkspaceSession();
  const links: Array<[string, CopyKey, typeof HomeIcon]> = [
    ["/dashboard", "v.dashboard", HomeIcon],
    ["/data", "v.data", ChartNoAxesCombinedIcon],
    ["/analysis", "v.analysis", HistoryIcon],
    ["/profile", "v.profile", RadarIcon],
    ["/practice", "nav.practice", CodeXmlIcon],
    ["/accounts", "v.accounts", UsersRoundIcon],
    ["/teams", "v12.teams", UsersRoundIcon],
    ["/privacy", "v12.privacy", LockKeyholeIcon],
    ["/notifications", "v12.notifications", BellIcon],
    ["/security", "v.security", ShieldCheckIcon],
    ...(user?.roles.includes("COACH")
      ? ([
          ["/coach", "v12.coach", GraduationCapIcon],
          ["/coach/teams", "v12.manage", UsersRoundIcon],
        ] as Array<[string, CopyKey, typeof HomeIcon]>)
      : []),
  ];
  return (
    <nav
      ref={navigation}
      aria-label={t("nav.workspace")}
      className={cn(mobile && "max-w-full overflow-x-auto")}
    >
      <SidebarMenu
        className={cn(
          mobile ? "w-max min-w-full flex-row flex-nowrap" : "gap-1",
        )}
      >
        {links.map(([href, label, Icon]) => {
          const active =
            pathname === href ||
            (href !== "/coach" && pathname.startsWith(`${href}/`));
          const link = (
            <Link
              href={href}
              prefetch={false}
              aria-label={t(label)}
              aria-current={active ? "page" : undefined}
              className={cn("workspace-nav", mobile && "workspace-nav-mobile")}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              <span>{t(label)}</span>
            </Link>
          );
          return (
            <SidebarMenuItem
              key={href}
              className={cn(mobile && "w-20 shrink-0")}
            >
              {mobile ? (
                link
              ) : (
                <SidebarMenuButton
                  render={link}
                  isActive={active}
                  tooltip={t(label)}
                />
              )}
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </nav>
  );
}
function DesktopSidebar() {
  const { t, locale, setLocale } = useLocale();
  const { state, open } = useSidebar();
  return (
    <aside className="hidden shrink-0 md:block">
      <Sidebar collapsible="icon" id="workspace-sidebar">
        <SidebarHeader className="gap-3 p-3 pb-4">
          <div className="sidebar-brand">
            <Brand />
          </div>
          <SidebarTrigger
            aria-label={t(open ? "sidebar.collapse" : "sidebar.expand")}
            aria-expanded={open}
            aria-controls="workspace-sidebar"
            title={t(open ? "sidebar.collapse" : "sidebar.expand")}
          />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="px-3">
            <p className="sidebar-copy px-2 pb-3 text-xs text-muted-foreground">
              {t("nav.workspace")}
            </p>
            <Navigation />
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="p-3">
          {state === "expanded" ? (
            <LocaleSwitch />
          ) : (
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("sidebar.language")}
              title={t("sidebar.language")}
              onClick={() => setLocale(locale === "en" ? "zh-CN" : "en")}
            >
              <LanguagesIcon aria-hidden="true" />
            </Button>
          )}
        </SidebarFooter>
      </Sidebar>
    </aside>
  );
}
const subscribe = () => () => {};
function readSidebarPreference() {
  try {
    return !document.cookie.split("; ").includes("sidebar_state=false");
  } catch {
    return true;
  }
}
export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const { t } = useLocale();
  const saved = useSyncExternalStore(
    subscribe,
    readSidebarPreference,
    () => true,
  );
  const [chosen, setChosen] = useState<boolean | null>(null);
  return (
    <WorkspaceSessionProvider>
      <SkipLink />
      <SidebarProvider
        className="workspace-layout"
        open={chosen ?? saved}
        onOpenChange={setChosen}
        style={
          {
            "--sidebar-width": "15rem",
            "--sidebar-width-icon": "4.25rem",
          } as React.CSSProperties
        }
      >
        <DesktopSidebar />
        <div className="workspace-surface flex min-w-0 flex-1 flex-col">
          <MockNotice />
          <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-background/90 px-5 py-3 md:hidden">
            <Brand />
            <div className="flex flex-wrap items-center gap-2">
              <LocaleSwitch />
              <Link href="/security" prefetch={false} className="text-sm">
                {t("v.security")}
              </Link>
            </div>
          </header>
          <AccountSwitcher />
          {children}
          <div className="mobile-navigation sticky bottom-0 mt-auto border-t bg-background/95 px-3 py-2 backdrop-blur-md md:hidden">
            <Navigation mobile />
          </div>
        </div>
      </SidebarProvider>
    </WorkspaceSessionProvider>
  );
}
