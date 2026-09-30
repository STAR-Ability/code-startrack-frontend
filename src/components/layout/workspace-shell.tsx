"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, UserRoundIcon, CodeXmlIcon, OrbitIcon } from "lucide-react";
import { useLocale } from "./locale-provider";
import { Brand, SkipLink } from "./brand";
import { LocaleSwitch } from "./locale-switch";
import { LoginDialog } from "./login-dialog";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { TrainingQueryProvider } from "@/components/training/query-provider";
import { cn } from "@/lib/utils";

function Navigation({ mobile = false }: { mobile?: boolean }) {
  const { t } = useLocale();
  const pathname = usePathname();
  const links = [
    ["/", "nav.home", HomeIcon],
    ["/profile", "nav.profile", UserRoundIcon],
    ["/practice", "nav.practice", CodeXmlIcon],
  ] as const;
  return (
    <nav aria-label={t("nav.workspace")}>
      <SidebarMenu className={cn(mobile && "flex-row")}>
        {links.map(([href, label, Icon]) => (
          <SidebarMenuItem
            key={href}
            className={cn(mobile && "min-w-0 flex-1")}
          >
            <Link
              href={href}
              prefetch={false}
              aria-current={pathname === href ? "page" : undefined}
              className={cn("workspace-nav", mobile && "workspace-nav-mobile")}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              <span>{t(label)}</span>
            </Link>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </nav>
  );
}

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const { t } = useLocale();
  return (
    <TrainingQueryProvider>
      <SkipLink />
      <SidebarProvider>
        <aside className="hidden w-60 shrink-0 md:block">
          <Sidebar collapsible="none" className="fixed inset-y-0 w-60 border-r">
            <SidebarHeader className="px-6 pt-8 pb-10">
              <Brand />
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup className="gap-4 px-4">
                <p className="px-3 text-xs text-muted-foreground">
                  {t("nav.workspace")}
                </p>
                <Navigation />
              </SidebarGroup>
              <div className="mx-6 mt-12 flex flex-col gap-3 text-sm text-muted-foreground">
                <OrbitIcon className="size-6" aria-hidden="true" />
                <p>{t("landing.footer")}</p>
              </div>
            </SidebarContent>
            <SidebarFooter className="gap-5 p-6">
              <LocaleSwitch />
              <Separator />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">{t("demo.learner")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("demo.label")}
                  </p>
                </div>
                <LoginDialog />
              </div>
            </SidebarFooter>
          </Sidebar>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col bg-muted/70">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-background px-5 py-4 md:hidden">
            <Brand />
            <div className="flex flex-wrap items-center gap-2">
              <LocaleSwitch />
              <LoginDialog />
            </div>
          </header>
          {children}
          <div className="mobile-navigation sticky bottom-0 mt-auto border-t bg-background/95 px-3 py-2 backdrop-blur-md md:hidden">
            <Navigation mobile />
          </div>
        </div>
      </SidebarProvider>
    </TrainingQueryProvider>
  );
}
