import { render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/components/layout/locale-provider";
import {
  teamSummarySchema,
  type CoachDashboardDto,
  type TeamSummaryDto,
} from "@/lib/api/v012-schemas";
import type { PageResponse } from "@/lib/api/schemas";
import { v012Notifications, v012Teams } from "@/lib/demo/v012-fixtures";
import { translate } from "@/lib/i18n/locale";
import { ApiError } from "@/lib/api/errors";
import { CoachPage } from "./coach-page";
import { CoachGate } from "./v012-shared";

const queryState = vi.hoisted(() => ({
  data: undefined as CoachDashboardDto | undefined,
  error: null as unknown,
  fetching: false,
  roles: ["STUDENT"],
  teams: undefined as PageResponse<TeamSummaryDto> | undefined,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/coach",
  useRouter: () => ({ replace: vi.fn() }),
}));
vi.mock("./account-provider", () => ({
  useWorkspaceSession: () => ({ data: { roles: queryState.roles } }),
}));
vi.mock("./use-user-query", () => ({
  useUserQuery: (resource: string) => ({
    data: resource === "coach-dashboard" ? queryState.data : queryState.teams,
    error: resource === "coach-dashboard" ? queryState.error : null,
    isFetching: queryState.fetching,
    isPending: queryState.data === undefined,
    refetch: vi.fn(),
  }),
}));

beforeEach(() => {
  document.cookie = "codestartrack_locale=en; Path=/";
  queryState.data = undefined;
  queryState.error = null;
  queryState.fetching = false;
  queryState.roles = ["STUDENT"];
  queryState.teams = undefined;
});

function renderCoach() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <LocaleProvider initialLocale="en">
        <CoachPage />
      </LocaleProvider>
    </QueryClientProvider>,
  );
}

describe("coach dashboard evidence and actions", () => {
  for (const state of ["missing", "error"] as const) {
    it(`does not turn ${state} counts into successful zero metrics`, () => {
      if (state === "error")
        queryState.error = new ApiError("UPSTREAM_UNAVAILABLE", 503);
      const { container } = renderCoach();

      const values = container.querySelectorAll("[data-metric-panel] dd");
      expect(values).toHaveLength(3);
      for (const value of values)
        expect(value).toHaveTextContent(/^Unavailable$/);
      if (state === "error")
        expect(container.querySelector('[data-state="error"]')).not.toBeNull();
      expect(
        screen.getByRole("link", { name: "Manage teams" }),
      ).toHaveAttribute("href", "/coach/teams");
    });
  }

  it("preserves actual zero counts and all team management actions", () => {
    queryState.data = {
      managedTeamCount: 0,
      activeMemberCount: 0,
      pendingApplicationCount: 0,
      recentNotifications: [],
    };
    const { container } = renderCoach();

    const values = container.querySelectorAll("[data-metric-panel] dd");
    expect(values).toHaveLength(3);
    for (const value of values) expect(value).toHaveTextContent(/^0$/);
    expect(screen.getByRole("link", { name: "Manage teams" })).toHaveAttribute(
      "href",
      "/coach/teams",
    );
    expect(screen.getByRole("link", { name: "Create team" })).toHaveAttribute(
      "href",
      "/coach/teams/create",
    );
    expect(
      screen.queryByRole("link", { name: /^Pending applications$/ }),
    ).not.toBeInTheDocument();
  });

  it("prioritizes real pending applications without hiding management or creation", () => {
    queryState.data = {
      managedTeamCount: 2,
      activeMemberCount: 12,
      pendingApplicationCount: 3,
      recentNotifications: [],
    };
    renderCoach();

    expect(
      screen.getByRole("link", { name: /^Pending applications$/ }),
    ).toHaveAttribute("href", "/coach/teams?task=applications");
    expect(screen.getByRole("link", { name: "Manage teams" })).toHaveAttribute(
      "href",
      "/coach/teams",
    );
    expect(screen.getByRole("link", { name: "Create team" })).toHaveAttribute(
      "href",
      "/coach/teams/create",
    );
  });

  it("retains every supplied managed team and notification in backend order", () => {
    const teams = v012Teams.map((team) => teamSummarySchema.parse(team));
    queryState.teams = {
      data: teams,
      meta: { page: 1, pageSize: 20, total: teams.length, hasNext: false },
      requestId: "00000000-0000-4000-8000-000000000001",
    };
    queryState.data = {
      managedTeamCount: teams.length,
      activeMemberCount: 12,
      pendingApplicationCount: 3,
      recentNotifications: v012Notifications,
    };
    renderCoach();

    const teamItems = within(
      screen.getByRole("list", { name: "Manage teams" }),
    ).getAllByRole("listitem");
    expect(teamItems).toHaveLength(teams.length);
    teams.forEach((team, index) => {
      const item = within(teamItems[index]);
      expect(
        item.getByRole("heading", { name: team.name }),
      ).toBeInTheDocument();
      expect(item.getByRole("link", { name: "Open team" })).toHaveAttribute(
        "href",
        `/teams/detail?teamId=${team.teamId}&tab=overview`,
      );
      expect(teamItems[index]).toHaveTextContent(
        team.owner.displayName ?? team.owner.username,
      );
      if (team.description)
        expect(teamItems[index]).toHaveTextContent(team.description);
    });

    const notificationItems = within(
      screen.getByRole("list", { name: "Recent notifications" }),
    ).getAllByRole("listitem");
    expect(notificationItems).toHaveLength(v012Notifications.length);
    v012Notifications.forEach((notification, index) => {
      const item = within(notificationItems[index]);
      expect(
        item.getByRole("heading", { name: notification.title }),
      ).toBeInTheDocument();
      expect(notificationItems[index]).toHaveTextContent(notification.body);
      expect(notificationItems[index].querySelector("time")).toHaveAttribute(
        "datetime",
        notification.createdAt,
      );
      const readButton = item.queryByRole("button", {
        name: translate("en", "v12.read"),
      });
      if (notification.read) expect(readButton).toBeNull();
      else expect(readButton).toBeEnabled();
    });
  });
});

describe("coach role gate", () => {
  it("keeps coach content unavailable to a student and exposes it after coach access", () => {
    const view = () => (
      <LocaleProvider initialLocale="en">
        <CoachGate>
          <p>Coach-only workspace</p>
        </CoachGate>
      </LocaleProvider>
    );
    const { rerender } = render(view());
    expect(screen.queryByText("Coach-only workspace")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "href",
      "/dashboard",
    );

    queryState.roles = ["STUDENT", "COACH"];
    rerender(view());
    expect(screen.getByText("Coach-only workspace")).toBeInTheDocument();
  });
});
