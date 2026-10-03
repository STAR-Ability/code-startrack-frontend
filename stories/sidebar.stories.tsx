import Link from "next/link";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
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
} from "@/components/ui/sidebar";
import { useLocale } from "@/components/layout/locale-provider";
import { mobile } from "./helpers";

function Example({ defaultOpen = true }) {
  const { t } = useLocale();
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <p className="truncate px-2 font-medium">codeStartrack</p>
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
          <SidebarTrigger />
          <h1 className="text-base font-medium">Workspace navigation</h1>
        </header>
        <p className="p-4 text-sm text-muted-foreground">
          Toggle with the button or Ctrl/Cmd+B. At mobile widths, the primitive
          opens a drawer. Production workspace navigation also has a compact
          bottom bar.
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
          "The installed Nova/Base UI sidebar with actual routing stubs and keyboard support. The expanded and collapsed states are local to the example; it never loads an account.",
      },
    },
  },
} satisfies Meta<typeof Example>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Collapsed: Story = { args: { defaultOpen: false } };
export const Mobile: Story = { globals: mobile };
