import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/workspace/feedback";
import { StoryFrame, mobile } from "./helpers";

const meta = {
  title: "Primitives/Card",
  component: Card,
  args: { interaction: "surface", size: "default", variant: "default" },
  parameters: {
    docs: {
      description: {
        component:
          "Near-white reading surfaces sit above translucent metric and supporting panels. Content variants distinguish metric, recommendation, analysis and supporting roles; tone adds information, analysis or collaboration context. Use interaction=none for data, surface for passive grouping, and lift only for interactive discovery cards. Loading and empty content are compositions, not Card props.",
      },
    },
  },
  decorators: [
    (Story) => (
      <StoryFrame>
        <Story />
      </StoryFrame>
    ),
  ],
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <Badge variant="info">Synthetic example</Badge>
        <CardTitle>
          <h2>One focused next step</h2>
        </CardTitle>
        <CardDescription>
          Keep the recommendation and its reason together.
        </CardDescription>
      </CardHeader>
      <CardContent>
        Build confidence with a problem near your current level.
      </CardContent>
      <CardFooter>
        <Button>Start practice</Button>
      </CardFooter>
    </Card>
  ),
} satisfies Meta<typeof Card>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Hover: Story = { args: { interaction: "lift" } };
export const DataSurface: Story = { args: { interaction: "none", size: "sm" } };
export const Recommendation: Story = {
  args: { variant: "recommendation", size: "lg", interaction: "lift" },
};
export const Metric: Story = {
  args: { variant: "metric", interaction: "none" },
};
export const Analysis: Story = {
  args: { variant: "analysis", interaction: "none" },
};
export const Supporting: Story = {
  args: { variant: "supporting", interaction: "none" },
};
export const Collaboration: Story = {
  args: { variant: "supporting", tone: "support", interaction: "none" },
};
export const WorkspaceLayers: Story = {
  render: () => (
    <div className="workspace-surface flex min-w-0 flex-col gap-5 rounded-2xl p-5 sm:p-8">
      <header className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">A stable workspace</h2>
        <p className="text-sm text-muted-foreground">
          Quiet color remains visible between modules and through supporting
          panels. Reading surfaces keep the strongest contrast.
        </p>
      </header>
      <Card variant="metric" tone="insight" interaction="none">
        <CardHeader>
          <CardTitle>Current ability</CardTitle>
          <CardDescription>Metric surface · 86% card</CardDescription>
        </CardHeader>
        <CardContent>Focused values belong in the first layer.</CardContent>
      </Card>
      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <Card variant="analysis" interaction="none">
          <CardHeader>
            <CardTitle>Read the evidence</CardTitle>
            <CardDescription>Reading surface · 96% card</CardDescription>
          </CardHeader>
          <CardContent>
            Text and charts retain a near-white foundation.
          </CardContent>
        </Card>
        <Card variant="supporting" tone="support" interaction="none">
          <CardHeader>
            <CardTitle>Team context</CardTitle>
            <CardDescription>Supporting surface · 76% card</CardDescription>
          </CardHeader>
          <CardContent>
            Secondary context lets the workspace show through.
          </CardContent>
        </Card>
      </div>
    </div>
  ),
};
export const Loading: Story = {
  render: () => (
    <Card aria-busy="true" aria-label="Loading recommendation">
      <CardHeader>
        <Skeleton className="h-5 w-2/3" />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </CardContent>
    </Card>
  ),
};
export const Empty: Story = {
  render: () => (
    <Card>
      <CardContent>
        <EmptyState
          title="No recommendation yet"
          description="Connect an account to begin."
        />
      </CardContent>
    </Card>
  ),
};
export const Mobile: Story = { globals: mobile };
