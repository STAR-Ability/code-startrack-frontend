import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import {
  EmptyState,
  LoadingState,
  ErrorNotice,
  DataRegion,
} from "@/components/workspace/feedback";
import { AnalysisView } from "@/components/workspace/analysis-view";
import { useLocale } from "@/components/layout/locale-provider";
import { ApiError } from "@/lib/api/errors";
import type { DataQuery } from "@/lib/api/data-state";
import { demoAnalysis } from "@/lib/demo/fixtures";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StoryFrame, mobile } from "./helpers";

const meta = {
  title: "Workspace/Feedback",
  component: EmptyState,
  args: {
    title: "No training history",
    description: "Connect an account and sync its training records.",
  },
  decorators: [
    (Story) => (
      <StoryFrame>
        <Story />
      </StoryFrame>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          "Missing data, pending requests and connection failures stay distinguishable. Named read regions keep local recovery and request details without repeating global error notifications. Feature skeletons own initial loading when available; cached data stays readable during refetch. Actions and CAPTCHA/job monitoring retain notifications through the real toast provider. All errors here are synthetic; Retry only logs an action.",
      },
    },
  },
} satisfies Meta<typeof EmptyState>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Empty: Story = {};
export const WithAction: Story = {
  args: { href: "/accounts", action: "Connect an account" },
};
export const Embedded: Story = {
  args: { embedded: true, href: "/accounts", action: "Connect an account" },
  render: (args) => (
    <Card variant="supporting" interaction="none">
      <CardHeader>
        <CardTitle>
          <h2>Account sources</h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <EmptyState {...args} />
      </CardContent>
    </Card>
  ),
};
export const EmbeddedMobile: Story = { ...Embedded, globals: mobile };
export const Loading: Story = { render: () => <LoadingState /> };
export const CompactLoading: Story = { render: () => <LoadingState compact /> };
export const Error: Story = {
  render: () => (
    <ErrorNotice
      error={new ApiError("NETWORK_ERROR", 0, "storybook-synthetic-request")}
      retry={fn()}
      dataError
    />
  ),
};
export const Forbidden: Story = {
  render: () => (
    <ErrorNotice error={new ApiError("FORBIDDEN", 403)} retry={fn()} />
  ),
};
export const Mobile: Story = { globals: mobile };

const snapshot = demoAnalysis();
type ProfileQuery = Omit<DataQuery, "data"> & {
  data: typeof snapshot | undefined;
};
const query: ProfileQuery = {
  data: snapshot,
  isPending: false,
  isFetching: false,
  error: null,
  refetch: fn(),
};

function ProfileRegion({ query: state }: { query: ProfileQuery }) {
  const { t } = useLocale();
  return (
    <DataRegion
      query={state}
      name={t("metrics.ability")}
      showInitialLoading={false}
    >
      <AnalysisView
        analysis={state.data ?? null}
        dimensions
        ability
        loading={state.isFetching && state.data === undefined}
        unavailable={!!state.error}
      />
    </DataRegion>
  );
}

export const LocalLoading: Story = {
  render: () => (
    <ProfileRegion
      query={{ ...query, data: undefined, isPending: true, isFetching: true }}
    />
  ),
};
export const Refreshing: Story = {
  render: () => <ProfileRegion query={{ ...query, isFetching: true }} />,
};
export const CachedReadError: Story = {
  render: () => (
    <ProfileRegion query={{ ...query, error: new ApiError("NETWORK_ERROR") }} />
  ),
};
export const CachedReadErrorMobile: Story = {
  ...CachedReadError,
  globals: mobile,
};
function SeparateReadFailures() {
  const { t } = useLocale();
  return (
    <>
      {(["metrics.ability", "v.analysisHistory"] as const).map((resource) => (
        <DataRegion
          key={resource}
          name={t(resource)}
          query={{
            ...query,
            data: undefined,
            error: new ApiError("NETWORK_ERROR"),
          }}
        >
          <p className="text-sm text-muted-foreground">{t("v.unavailable")}</p>
        </DataRegion>
      ))}
    </>
  );
}
export const IndependentReadErrors: Story = {
  render: () => <SeparateReadFailures />,
};
