import Link from "next/link";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import {
  BookOpenIcon,
  ChartNoAxesCombinedIcon,
  UserRoundIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarProvider,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useLocale } from "@/components/layout/locale-provider";
import { Brand } from "@/components/layout/brand";
import { mobile } from "./helpers";

function SidebarHeaderTrigger() {
  const { t } = useLocale();
  const { isMobile, open } = useSidebar();
  return (
    <SidebarTrigger
      aria-controls="storybook-sidebar"
      aria-label={t(
        isMobile ? "ui.close" : open ? "sidebar.collapse" : "sidebar.expand",
      )}
    />
  );
}

function Example({ defaultOpen = true }) {
  const { t, locale } = useLocale();
  return (
    <SidebarProvider defaultOpen={defaultOpen} className="workspace-layout">
      <Sidebar collapsible="icon" id="storybook-sidebar">
        <SidebarHeader className="p-[12px]">
          <div className="sidebar-brand min-w-0">
            <Brand />
          </div>
          <SidebarHeaderTrigger />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>{t("nav.workspace")}</SidebarGroupLabel>
            <SidebarMenu>
              {(
                [
                  ["nav.practice", "/practice", BookOpenIcon],
                  ["v.data", "/data", ChartNoAxesCombinedIcon],
                  ["nav.profile", "/profile", UserRoundIcon],
                ] as const
              ).map(([label, href, Icon], index) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton
                    isActive={index === 0}
                    tooltip={t(label)}
                    render={<Link href={href} aria-label={t(label)} />}
                  >
                    <Icon aria-hidden="true" />
                    <span>{t(label)}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center gap-3 border-b p-4">
          <SidebarTrigger aria-controls="storybook-sidebar" />
          <h1 className="text-base font-medium">{t("nav.workspace")}</h1>
        </header>
        <p className="p-4 text-sm text-muted-foreground">
          {locale === "zh-CN"
            ? "使用按钮或 Ctrl/Cmd+B 切换侧栏。移动端通过包含完整导航的侧边面板访问工作区；按 Escape 关闭并返回触发按钮。"
            : "Toggle with the button or Ctrl/Cmd+B. Mobile uses a Sheet containing the full workspace navigation. Escape closes it and returns focus to the trigger."}
        </p>
      </SidebarInset>
    </SidebarProvider>
  );
}
const meta = {
  title: "Primitives/Sidebar",
  component: Example,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "The production 240px/68px Nova/Base UI sidebar dimensions, shared Brand and keyboard support. Collapsed desktop links own tooltips; mobile links use the Sheet directly. Routing is stubbed and this specimen never loads an account.",
      },
    },
  },
} satisfies Meta<typeof Example>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Collapsed: Story = { args: { defaultOpen: false } };
export const Mobile: Story = { globals: mobile };
export const MobileSheet: Story = {
  globals: mobile,
  play: async ({ canvasElement }) => {
    const mobileViewport =
      canvasElement.ownerDocument.defaultView!.matchMedia(
        "(max-width: 767px)",
      ).matches;
    await waitFor(() => {
      const desktopSidebar = canvasElement.querySelector(
        '[data-slot="sidebar"][data-state]',
      );
      if (mobileViewport) {
        expect(desktopSidebar).toBeNull();
      } else {
        expect(desktopSidebar).toHaveAttribute("data-state", "expanded");
      }
    });
    const trigger = canvasElement.querySelector<HTMLButtonElement>(
      '[data-slot="sidebar-inset"] [data-sidebar="trigger"]',
    );
    if (!trigger) throw new Error("The mobile navigation trigger is missing.");
    await userEvent.click(trigger);
    if (mobileViewport) {
      const dialog = await within(canvasElement.ownerDocument.body).findByRole(
        "dialog",
      );
      await waitFor(() => expect(dialog).toBeVisible());
    } else {
      await waitFor(() =>
        expect(
          canvasElement.querySelector('[data-slot="sidebar"][data-state]'),
        ).toHaveAttribute("data-state", "collapsed"),
      );
    }
  },
};
