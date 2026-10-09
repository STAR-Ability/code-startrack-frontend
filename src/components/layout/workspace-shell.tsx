"use client";
import Link from "next/link";
import { Suspense, useState, useSyncExternalStore } from "react";
import { usePathname, useSearchParams } from "next/navigation";
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
  CompassIcon,
  ClipboardListIcon,
  MailIcon,
  ChevronDownIcon,
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
  SidebarGroupLabel,
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { isWorkspaceLinkActive } from "@/lib/navigation/workspace";

type NavigationLink = [string, CopyKey, typeof HomeIcon];
type NavigationSection = { label: CopyKey; links: NavigationLink[] };

function Navigation() {
  const { t } = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const { data: user } = useWorkspaceSession();
  const sections: NavigationSection[] = [
    {
      label: "v02.navTraining",
      links: [
        ["/dashboard", "v.dashboard", HomeIcon],
        ["/problems", "v02.problems", CodeXmlIcon],
        ["/submissions", "v02.submissions", ClipboardListIcon],
        ["/training", "v02.training", HistoryIcon],
        ["/learning-profile", "v02.learningProfile", RadarIcon],
        [
          "/learning-recommendations",
          "v02.learningRecommendations",
          CompassIcon,
        ],
      ],
    },
    {
      label: "v02.navCodeforces",
      links: [
        ["/profile", "v.profile", RadarIcon],
        ["/analysis", "v12.reports", HistoryIcon],
        ["/practice", "nav.practice", CodeXmlIcon],
      ],
    },
    {
      label: "v12.navTeams",
      links: [
        ["/teams", "v12.myTeams", UsersRoundIcon],
        ["/teams?tab=search", "v12.discoverTeams", CompassIcon],
        ["/teams?tab=applications", "v12.applications", ClipboardListIcon],
        ["/teams?tab=invitations", "v12.invitations", MailIcon],
      ],
    },
    ...(user?.roles.includes("COACH")
      ? [
          {
            label: "v12.navCoach" as const,
            links: [
              ["/coach", "v12.coach", GraduationCapIcon],
              ["/coach/teams", "v12.manage", UsersRoundIcon],
              [
                "/coach/teams?task=applications",
                "v12.pendingApplications",
                ClipboardListIcon,
              ],
              ["/coach/teams?task=invitations", "v12.invitations", MailIcon],
            ] as NavigationLink[],
          },
        ]
      : []),
    {
      label: "v12.navAccounts",
      links: [
        ["/accounts", "v.accounts", UsersRoundIcon],
        ["/data", "v.data", ChartNoAxesCombinedIcon],
      ],
    },
    {
      label: "v12.navSettings",
      links: [
        ["/security", "v.security", ShieldCheckIcon],
        ["/privacy", "v12.privacy", LockKeyholeIcon],
        ["/notifications", "v12.notifications", BellIcon],
      ],
    },
  ];
  const collapsed = state === "collapsed" && !isMobile;
  return (
    <nav aria-label={t("nav.workspace")}>
      {sections.map((section, index) => {
        const links = (
          <SidebarMenu className="gap-1">
            {section.links.map(([href, label, Icon]) => {
              const active = isWorkspaceLinkActive(
                href,
                pathname,
                searchParams,
              );
              return (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton
                    isActive={active}
                    tooltip={t(label)}
                    render={
                      <Link
                        href={href}
                        prefetch={false}
                        aria-label={t(label)}
                        aria-current={active ? "page" : undefined}
                        className="workspace-nav"
                        data-tone={
                          section.label === "v12.navTeams" ||
                          section.label === "v12.navCoach"
                            ? "support"
                            : href === "/profile" ||
                                href === "/analysis" ||
                                href === "/learning-profile"
                              ? "insight"
                              : "info"
                        }
                        onClick={() => setOpenMobile(false)}
                      >
                        <Icon className="size-4 shrink-0" aria-hidden="true" />
                        <span>{t(label)}</span>
                      </Link>
                    }
                  />
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        );
        return (
          <SidebarGroup
            key={section.label}
            className={cn(
              "px-3 py-2",
              section.label === "v12.navCoach" && "bg-primary/5",
            )}
          >
            {index > 0 && <Separator className="mb-2 opacity-60" />}
            {collapsed ? (
              links
            ) : (
              <Collapsible
                defaultOpen
                key={`${section.label}:${pathname}:${searchParams.toString()}`}
              >
                <SidebarGroupLabel
                  render={
                    <CollapsibleTrigger className="mb-1 w-full justify-between focus-visible:ring-2">
                      <span>{t(section.label)}</span>
                      <ChevronDownIcon
                        aria-hidden="true"
                        className="transition-transform duration-200 in-data-open:rotate-180 motion-reduce:transition-none"
                      />
                    </CollapsibleTrigger>
                  }
                />
                <CollapsibleContent>{links}</CollapsibleContent>
              </Collapsible>
            )}
          </SidebarGroup>
        );
      })}
    </nav>
  );
}
function WorkspaceSidebar() {
  const { t, locale, setLocale } = useLocale();
  const { state, open, isMobile, openMobile } = useSidebar();
  return (
    <aside className="shrink-0">
      <Sidebar collapsible="icon" id="workspace-sidebar">
        <SidebarHeader className="gap-3 p-4 pb-3">
          <div className="sidebar-brand">
            <Brand />
          </div>
          <SidebarTrigger
            aria-label={t(
              isMobile
                ? "ui.toggleSidebar"
                : open
                  ? "sidebar.collapse"
                  : "sidebar.expand",
            )}
            aria-expanded={isMobile ? openMobile : open}
            aria-controls="workspace-sidebar"
          />
        </SidebarHeader>
        <SidebarContent>
          <Suspense>
            <Navigation />
          </Suspense>
        </SidebarContent>
        <SidebarFooter className="border-t p-3">
          {state === "expanded" || isMobile ? (
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
        <WorkspaceSidebar />
        <div className="workspace-surface flex min-w-0 flex-1 flex-col">
          <MockNotice />
          <header className="workspace-mobile-header flex flex-wrap items-center justify-between gap-2 border-b bg-background/90 px-3 py-2 md:hidden">
            <div className="flex min-w-0 items-center gap-2">
              <SidebarTrigger aria-label={t("ui.mobileNavigation")} />
              <Brand compact />
            </div>
            <div className="min-w-0 max-w-full">
              <LocaleSwitch />
            </div>
          </header>
          <AccountSwitcher />
          {children}
        </div>
      </SidebarProvider>
    </WorkspaceSessionProvider>
  );
}
