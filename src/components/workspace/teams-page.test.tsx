import { fireEvent, render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/components/layout/locale-provider";
import type { PageResponse } from "@/lib/api/schemas";
import {
  teamSummarySchema,
  type JoinApplicationDto,
  type TeamInvitationDto,
  type TeamSummaryDto,
} from "@/lib/api/v012-schemas";
import {
  v012Applications,
  v012Invitations,
  v012Teams,
} from "@/lib/demo/v012-fixtures";
import { translate, type Locale } from "@/lib/i18n/locale";
import { TeamsPage } from "./teams-page";

type DirectoryRecord = TeamSummaryDto | JoinApplicationDto | TeamInvitationDto;
const state = vi.hoisted(() => ({
  params: "",
  pathname: "/teams",
  push: vi.fn(),
  reads: vi.fn(),
  data: {} as Record<string, PageResponse<DirectoryRecord> | undefined>,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => state.pathname,
  useSearchParams: () => new URLSearchParams(state.params),
  useRouter: () => ({ push: state.push, replace: vi.fn() }),
}));
vi.mock("./account-provider", () => ({
  useWorkspaceSession: () => ({ data: null }),
}));
vi.mock("./use-user-query", () => ({
  useUserQuery: (
    resource: string,
    params: { endpoint?: string; page?: number; q?: string; scope?: string },
    _read: unknown,
    enabled = true,
  ) => {
    state.reads(resource, params, enabled);
    return {
      data: enabled
        ? state.data[
            params.endpoint ? `${resource}:${params.endpoint}` : resource
          ]
        : undefined,
      error: null,
      isPending: false,
      isFetching: false,
      refetch: vi.fn(),
    };
  },
}));

function pageData<T>(data: T[], hasNext = false): PageResponse<T> {
  return {
    data,
    meta: { page: 1, pageSize: 20, total: data.length, hasNext },
    requestId: "00000000-0000-4000-8000-000000000001",
  };
}

function renderDirectory(locale: Locale = "en", managed = false) {
  document.cookie = `codestartrack_locale=${locale}; Path=/`;
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <LocaleProvider initialLocale={locale}>
        <TeamsPage managed={managed} />
      </LocaleProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  state.params = "";
  state.pathname = "/teams";
  state.data = {};
  state.push.mockClear();
  state.reads.mockClear();
});

describe.each(["en", "zh-CN"] as const)("team directory in %s", (locale) => {
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);

  it("keeps every returned team in order with fallback identity and exact counts", () => {
    const teams = v012Teams.map((team, index) =>
      teamSummarySchema.parse({
        ...team,
        name: `${index + 1}. ${team.name} extended training team name`,
        memberCount: index === 0 ? 0 : team.memberCount,
        owner: { ...team.owner, displayName: null },
      }),
    );
    state.data["teams:mine"] = pageData(teams);
    renderDirectory(locale);

    const items = within(
      screen.getByRole("list", { name: t("v12.myTeams") }),
    ).getAllByRole("listitem");
    expect(items).toHaveLength(teams.length);
    teams.forEach((team, index) => {
      const item = within(items[index]);
      expect(
        item.getByRole("heading", { name: team.name }),
      ).toBeInTheDocument();
      expect(
        item.getByRole("link", { name: t("v12.openTeam") }),
      ).toHaveAttribute(
        "href",
        `/teams/detail?teamId=${team.teamId}&tab=overview`,
      );
      expect(items[index]).toHaveTextContent(team.owner.username);
      const counts = Array.from(items[index].querySelectorAll("dl > div"));
      expect(
        counts.find((row) => row.textContent?.startsWith(t("v12.members"))),
      ).toHaveTextContent(`${t("v12.members")}${team.memberCount}`);
      if (team.description)
        expect(items[index]).toHaveTextContent(team.description);
    });
    expect(state.reads).toHaveBeenCalledWith(
      "teams",
      { endpoint: "mine", scope: "JOINED", page: 1 },
      true,
    );
  });

  it("retains complete application and invitation records with pending-only actions", () => {
    state.params = "tab=applications";
    state.data["team-applications"] = pageData(v012Applications);
    const { unmount } = renderDirectory(locale);
    const applications = within(
      screen.getByRole("list", { name: t("v12.applications") }),
    ).getAllByRole("listitem");
    expect(applications).toHaveLength(v012Applications.length);
    v012Applications.forEach((application, index) => {
      expect(applications[index]).toHaveTextContent(application.team.name);
      if (application.message)
        expect(applications[index]).toHaveTextContent(application.message);
      if (application.decisionReason)
        expect(applications[index]).toHaveTextContent(
          application.decisionReason,
        );
      expect(applications[index].querySelector("time")).toHaveAttribute(
        "datetime",
        application.createdAt,
      );
      const cancel = within(applications[index]).getByRole("button", {
        name: t("v12.cancel"),
      });
      if (application.status === "PENDING") expect(cancel).toBeEnabled();
      else expect(cancel).toBeDisabled();
      expect(
        within(applications[index]).queryByRole("button", {
          name: t("v12.approve"),
        }),
      ).toBeNull();
    });
    unmount();

    state.params = "tab=invitations";
    state.data["team-invitations"] = pageData(v012Invitations);
    renderDirectory(locale);
    const invitations = within(
      screen.getByRole("list", { name: t("v12.invitations") }),
    ).getAllByRole("listitem");
    expect(invitations).toHaveLength(v012Invitations.length);
    v012Invitations.forEach((invitation, index) => {
      expect(invitations[index]).toHaveTextContent(invitation.team.name);
      expect(invitations[index]).toHaveTextContent(
        invitation.inviter.displayName ?? invitation.inviter.username,
      );
      expect(invitations[index].querySelector("time")).toHaveAttribute(
        "datetime",
        invitation.expiresAt,
      );
      const accept = within(invitations[index]).getByRole("button", {
        name: t("v12.accept"),
      });
      if (invitation.status === "PENDING") expect(accept).toBeEnabled();
      else expect(accept).toBeDisabled();
    });
  });
});

it("keeps managed task links team-scoped and requests only managed teams", () => {
  state.params = "task=applications";
  state.pathname = "/coach/teams";
  const teams = v012Teams
    .slice(0, 2)
    .map((team) => teamSummarySchema.parse(team));
  state.data["teams:mine"] = pageData(teams);
  renderDirectory("en", true);

  expect(state.reads).toHaveBeenCalledWith(
    "teams",
    { endpoint: "mine", scope: "MANAGED", page: 1 },
    true,
  );
  expect(state.reads).toHaveBeenCalledWith(
    "team-applications",
    { page: 1, status: "" },
    false,
  );
  const items = within(
    screen.getByRole("list", { name: "Pending applications" }),
  ).getAllByRole("listitem");
  teams.forEach((team, index) =>
    expect(
      within(items[index]).getByRole("link", { name: "Open team" }),
    ).toHaveAttribute(
      "href",
      `/teams/detail?teamId=${team.teamId}&tab=applications`,
    ),
  );
  expect(screen.queryByRole("button", { name: "Approve" })).toBeNull();
});

it("keeps search explicit and resets paging when a new trimmed query is submitted", () => {
  state.params = "tab=search";
  state.data["teams:search"] = pageData([], true);
  renderDirectory();
  expect(state.reads).toHaveBeenCalledWith(
    "teams",
    { endpoint: "search", q: "", page: 1 },
    false,
  );

  const input = screen.getByRole("textbox", {
    name: translate("en", "v12.searchQuery"),
  });
  fireEvent.change(input, { target: { value: "  graph training  " } });
  fireEvent.submit(input.closest("form") as HTMLFormElement);
  expect(state.reads).toHaveBeenCalledWith(
    "teams",
    { endpoint: "search", q: "graph training", page: 1 },
    true,
  );
  fireEvent.click(
    screen.getByRole("button", { name: translate("en", "v.next") }),
  );
  expect(state.reads).toHaveBeenCalledWith(
    "teams",
    { endpoint: "search", q: "graph training", page: 2 },
    true,
  );
  state.reads.mockClear();
  fireEvent.change(input, { target: { value: "  new query  " } });
  fireEvent.submit(input.closest("form") as HTMLFormElement);
  expect(state.reads).toHaveBeenCalledWith(
    "teams",
    { endpoint: "search", q: "new query", page: 1 },
    true,
  );
});
