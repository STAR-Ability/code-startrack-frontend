import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/components/layout/locale-provider";
import type { CoachDashboardDto } from "@/lib/api/v012-schemas";
import { ApiError } from "@/lib/api/errors";
import { CoachPage } from "./coach-page";
import { CoachGate } from "./v012-shared";

const queryState = vi.hoisted(() => ({
  data: undefined as CoachDashboardDto | undefined,
  error: null as unknown,
  fetching: false,
  roles: ["STUDENT"],
}));

vi.mock("next/navigation", () => ({ usePathname: () => "/coach" }));
vi.mock("./account-provider", () => ({
  useWorkspaceSession: () => ({ data: { roles: queryState.roles } }),
}));
vi.mock("./use-user-query", () => ({
  useUserQuery: (resource: string) => ({
    data: resource === "coach-dashboard" ? queryState.data : undefined,
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
});

function renderCoach() {
  return render(
    <LocaleProvider initialLocale="en">
      <CoachPage />
    </LocaleProvider>,
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
