import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  DashboardAbility,
  DashboardActivity,
  DashboardDirection,
} from "@/components/workspace/user-dashboard-page";
import type { UserAnalysisDto } from "@/lib/api/v012-schemas";
import { v012Analysis } from "@/lib/demo/v012-fixtures";
import { mobile } from "./helpers";

function DashboardPreview({
  analysis = v012Analysis(),
  overview = v012Analysis("30D"),
  loading = false,
}: {
  analysis?: UserAnalysisDto | null;
  overview?: UserAnalysisDto | null;
  loading?: boolean;
}) {
  return (
    <div className="mx-auto flex w-full max-w-workspace min-w-0 flex-col gap-5">
      <div className="dashboard-primary-grid">
        <DashboardDirection
          analysis={analysis}
          loading={loading}
          failed={false}
        />
        <DashboardAbility analysis={analysis} loading={loading} />
      </div>
      {(overview || loading) && (
        <DashboardActivity analysis={overview} loading={loading} />
      )}
    </div>
  );
}

const meta = {
  title: "Workspace/Dashboard",
  component: DashboardPreview,
  parameters: {
    docs: {
      description: {
        component:
          "Production dashboard training presentations using complete synthetic user aggregates. ALL ability and 30D activity stay distinct; no requests or calculated analytics.",
      },
    },
  },
} satisfies Meta<typeof DashboardPreview>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const ZeroEvidence: Story = {
  args: {
    analysis: v012Analysis("ALL", true),
    overview: v012Analysis("30D", true),
  },
};
export const NotGenerated: Story = {
  args: { analysis: null, overview: null },
};
export const InitialLoading: Story = {
  args: { analysis: null, overview: null, loading: true },
};
export const StaleEvidence: Story = {
  args: {
    analysis: { ...v012Analysis(), stale: true },
    overview: { ...v012Analysis("30D"), stale: true },
  },
};
export const UnknownRatings: Story = {
  args: {
    analysis: { ...v012Analysis(), currentRating: null, maxRating: null },
  },
};
export const Mobile: Story = { globals: mobile };
export const English: Story = { globals: { locale: "en" } };
