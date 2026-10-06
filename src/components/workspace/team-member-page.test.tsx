import { act, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/components/layout/locale-provider";
import { ApiError } from "@/lib/api/errors";
import { v012 } from "@/lib/api/v012";
import {
  sharedProfileSchema,
  sharedTrainingSchema,
  type TeamMemberDto,
} from "@/lib/api/v012-schemas";
import { demoAccounts, demoSubmissions, demoUser } from "@/lib/demo/fixtures";
import {
  v012Analysis,
  v012Members,
  v012Peer,
  v012Report,
  v012Teams,
} from "@/lib/demo/v012-fixtures";
import { translate } from "@/lib/i18n/locale";
import { keys } from "@/lib/query/keys";
import { TeamMemberPage } from "./team-member-page";

const route = vi.hoisted(() => ({ params: "" }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/teams/member",
  useSearchParams: () => new URLSearchParams(route.params),
  useRouter: () => ({ replace: vi.fn() }),
}));
vi.mock("./account-provider", () => ({
  useAccounts: () => ({ user: demoUser }),
  useWorkspaceSession: () => ({ data: demoUser }),
}));
vi.mock("./chart", () => ({
  Chart: ({ label }: { label: string }) => (
    <div role="img" aria-label={label} />
  ),
}));

const teamId = v012Teams[0].teamId;
const peer = v012Members.find(
  (member) =>
    member.teamId === teamId && member.user.publicId === v012Peer.publicId,
)!;
const permissions = {
  basicTraining: true,
  abilityProfile: true,
  detailedSubmissions: true,
  analysisReport: true,
} as const;
type Domain = keyof typeof permissions;
const requestId = "00000000-0000-4000-8000-000000000001";
function paged<T>(data: T[], page = 1, hasNext = false) {
  return {
    data,
    meta: { page, pageSize: 20, total: data.length, hasNext },
    requestId,
  };
}

beforeEach(() => {
  document.cookie = "codestartrack_locale=en; Path=/";
  vi.restoreAllMocks();
  vi.spyOn(v012, "members").mockResolvedValue(
    paged([{ ...peer, dataAccess: permissions }]),
  );
  vi.spyOn(v012, "memberTraining").mockResolvedValue(
    sharedTrainingSchema.parse({
      ...v012Analysis(),
      publicId: peer.user.publicId,
    }),
  );
  vi.spyOn(v012, "memberProfile").mockResolvedValue(
    sharedProfileSchema.parse({
      ...v012Analysis(),
      publicId: peer.user.publicId,
    }),
  );
  vi.spyOn(v012, "memberSubmissions").mockResolvedValue(
    paged(
      demoSubmissions().map((submission) => ({
        submission,
        sourceAccount: {
          accountId: demoAccounts[0].accountId,
          platform: "codeforces" as const,
          username: demoAccounts[0].username,
        },
      })),
    ),
  );
  vi.spyOn(v012, "memberReports").mockResolvedValue(paged([v012Report()]));
  vi.spyOn(v012, "memberReport").mockResolvedValue(v012Report());
});

function show(view: Domain, locale: "zh-CN" | "en" = "en") {
  document.cookie = `codestartrack_locale=${locale}; Path=/`;
  route.params = new URLSearchParams({
    teamId,
    memberPublicId: peer.user.publicId,
    view,
  }).toString();
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity, staleTime: Infinity },
    },
  });
  client.setQueryData(keys.session, demoUser);
  const rendered = render(
    <QueryClientProvider client={client}>
      <LocaleProvider initialLocale={locale}>
        <TeamMemberPage />
      </LocaleProvider>
    </QueryClientProvider>,
  );
  return { ...rendered, client };
}

describe("authorized member context and independent domains", () => {
  for (const locale of ["zh-CN", "en"] as const) {
    it(`${locale} names the viewed member separately from the signed-in learner and scopes every permitted link`, async () => {
      const { container } = show("abilityProfile", locale);
      const context = await screen.findByRole("heading", {
        name: peer.user.displayName ?? peer.user.username,
      });
      expect(context.closest("header")).toHaveTextContent(
        translate(locale, "v12.viewedMember"),
      );
      expect(context.closest("header")).toHaveTextContent(peer.user.username);
      expect(context.closest("header")).not.toHaveTextContent(
        demoUser.displayName!,
      );
      expect(
        screen.getByRole("link", { name: translate(locale, "v12.teamDetail") }),
      ).toHaveAttribute("href", `/teams/detail?teamId=${teamId}`);
      expect(container.querySelector(".member-context-team")).toHaveTextContent(
        teamId,
      );
      const nav = screen.getByRole("navigation", {
        name: translate(locale, "v12.viewedMember"),
      });
      expect(within(nav).getAllByRole("link")).toHaveLength(4);
      for (const domain of Object.keys(permissions) as Domain[]) {
        const link = within(nav).getByRole("link", {
          name: translate(locale, `v12.${domain}`),
        });
        expect(link).toHaveAttribute(
          "href",
          `/teams/member?teamId=${teamId}&memberPublicId=${peer.user.publicId}&view=${domain}`,
        );
        if (domain === "abilityProfile")
          expect(link).toHaveAttribute("aria-current", "page");
        else expect(link).not.toHaveAttribute("aria-current");
      }
    });
  }

  const readers = [
    "memberTraining",
    "memberProfile",
    "memberSubmissions",
    "memberReports",
  ] as const;
  for (const [index, domain] of (
    Object.keys(permissions) as Domain[]
  ).entries()) {
    it(`${domain} requests only its independently authorized endpoint`, async () => {
      show(domain);
      await waitFor(() => expect(v012[readers[index]]).toHaveBeenCalledOnce());
      readers.forEach((reader, readerIndex) => {
        if (readerIndex !== index) expect(v012[reader]).not.toHaveBeenCalled();
      });
      expect(v012.memberReport).not.toHaveBeenCalled();
      expect(vi.mocked(v012[readers[index]]).mock.calls[0].slice(0, 2)).toEqual(
        [teamId, peer.user.publicId],
      );
    });
  }

  it("keeps independently permitted siblings without fetching a denied route domain", async () => {
    vi.mocked(v012.members).mockResolvedValue(
      paged([
        {
          ...peer,
          dataAccess: {
            ...permissions,
            basicTraining: false,
            detailedSubmissions: false,
          },
        },
      ]),
    );
    show("basicTraining");
    await screen.findByText(translate("en", "v12.PRIVATE_DENIED"), {
      exact: true,
    });
    const nav = screen.getByRole("navigation", { name: "Viewed member" });
    expect(
      within(nav)
        .getAllByRole("link")
        .map((link) => link.textContent),
    ).toEqual([
      translate("en", "v12.abilityProfile"),
      translate("en", "v12.analysisReport"),
    ]);
    readers.forEach((reader) => expect(v012[reader]).not.toHaveBeenCalled());
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("finds the active target on later member pages without using a removed identity", async () => {
    const removed: TeamMemberDto = {
      ...peer,
      status: "REMOVED",
      user: { ...peer.user, displayName: "Removed identity" },
      dataAccess: permissions,
    };
    vi.mocked(v012.members)
      .mockResolvedValueOnce(paged([removed], 1, true))
      .mockResolvedValueOnce(paged([{ ...peer, dataAccess: permissions }], 2));
    show("abilityProfile");
    await screen.findByRole("heading", {
      name: peer.user.displayName ?? peer.user.username,
    });
    expect(screen.queryByText("Removed identity")).not.toBeInTheDocument();
    expect(vi.mocked(v012.members).mock.calls.map((call) => call[1])).toEqual([
      { page: 1, pageSize: 100 },
      { page: 2, pageSize: 100 },
    ]);
  });

  it("does not expose a former member identity or any data domain", async () => {
    vi.mocked(v012.members).mockResolvedValue(
      paged([{ ...peer, status: "LEFT", dataAccess: permissions }]),
    );
    const { container } = show("abilityProfile");
    await screen.findByText(translate("en", "v12.PRIVATE_DENIED"), {
      exact: true,
    });
    expect(container.querySelector("[data-member-context]")).toBeNull();
    expect(
      screen.queryByRole("navigation", { name: "Viewed member" }),
    ).not.toBeInTheDocument();
    readers.forEach((reader) => expect(v012[reader]).not.toHaveBeenCalled());
  });

  it("withdraws cached member identity, navigation and evidence after membership read access is revoked", async () => {
    const { client, container } = show("abilityProfile");
    await screen.findByRole("img", { name: translate("en", "v.dimensions") });
    vi.mocked(v012.members).mockRejectedValue(
      new ApiError("PRIVATE_DENIED", 403),
    );
    await act(async () => {
      await client.invalidateQueries({
        queryKey: keys.team(demoUser.publicId, teamId, "member-access"),
      });
    });
    await waitFor(() =>
      expect(container.querySelector("[data-member-context]")).toBeNull(),
    );
    expect(
      screen.queryByRole("navigation", { name: "Viewed member" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("keeps all six ability scores and their supplied display order without importing training data", async () => {
    const profile = sharedProfileSchema.parse({
      ...v012Analysis(),
      publicId: peer.user.publicId,
    });
    vi.mocked(v012.memberProfile).mockResolvedValue({
      ...profile,
      dimensions: [...profile.dimensions].reverse(),
    });
    const { container } = show("abilityProfile");
    await screen.findByRole("img", { name: translate("en", "v.dimensions") });
    const rows = [...container.querySelectorAll(".analysis-dimension-row")];
    const ordered = [...profile.dimensions].sort(
      (left, right) => left.displayOrder - right.displayOrder,
    );
    expect(rows.map((row) => row.getAttribute("data-dimension-code"))).toEqual(
      ordered.map((dimension) => dimension.code),
    );
    rows.forEach((row, index) =>
      expect(row.querySelector("dd")).toHaveTextContent(
        `${ordered[index].score} / 100`,
      ),
    );
    expect(
      rows.filter((row) => row.getAttribute("data-weakest") === "true"),
    ).toHaveLength(1);
    expect(v012.memberTraining).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("heading", {
        name: translate("en", "v12.basicTraining"),
      }),
    ).not.toBeInTheDocument();
  });
});
