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
  args: { interaction: "surface", size: "default" },
  parameters: {
    docs: {
      description: {
        component:
          "White surfaces use a thin border and token-based elevation. Use interaction=none for data, surface for passive grouping, and lift only for interactive discovery cards. Loading and empty content are compositions, not Card props.",
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
