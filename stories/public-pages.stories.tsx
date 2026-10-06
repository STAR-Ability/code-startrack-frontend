import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LandingPage } from "@/components/landing/landing-page";
import { AboutPage } from "@/components/showcase/about-page";
import { CapabilitiesPage } from "@/components/showcase/capabilities-page";
import { ProfileShowcasePage } from "@/components/showcase/profile-page";
import { RecommendationsShowcasePage } from "@/components/showcase/recommendations-page";
import { DemoPage } from "@/components/workspace/demo-page";
import { mobile } from "./helpers";

const meta = {
  title: "Public/Pages",
  component: LandingPage,
  parameters: {
    layout: "fullscreen",
    nextjs: { navigation: { pathname: "/" } },
    docs: {
      description: {
        component:
          "Production public routes with complete local synthetic specimens. Ordered processes, editorial capability rows, shared profile evidence and local recommendation controls retain their sample notices without learner requests.",
      },
    },
  },
} satisfies Meta<typeof LandingPage>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Landing: Story = {};
export const Capabilities: Story = {
  render: () => <CapabilitiesPage />,
  parameters: { nextjs: { navigation: { pathname: "/product" } } },
};
export const Profile: Story = {
  render: () => <ProfileShowcasePage />,
  parameters: { nextjs: { navigation: { pathname: "/product/profile" } } },
};
export const Recommendations: Story = {
  render: () => <RecommendationsShowcasePage />,
  parameters: {
    nextjs: { navigation: { pathname: "/product/recommendations" } },
  },
};
export const About: Story = {
  render: () => <AboutPage />,
  parameters: { nextjs: { navigation: { pathname: "/about" } } },
};
export const Demo: Story = {
  render: () => <DemoPage />,
  parameters: { nextjs: { navigation: { pathname: "/demo" } } },
};
export const LandingMobile: Story = { globals: mobile };
export const RecommendationsMobile: Story = {
  ...Recommendations,
  globals: mobile,
};
export const ProfileMobile: Story = { ...Profile, globals: mobile };
export const DemoEnglish: Story = { ...Demo, globals: { locale: "en" } };
