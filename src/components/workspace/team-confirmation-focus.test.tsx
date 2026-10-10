import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/components/layout/locale-provider";
import { v012 } from "@/lib/api/v012";
import { demoUser } from "@/lib/demo/fixtures";
import { v012Members, v012Teams } from "@/lib/demo/v012-fixtures";
import { keys } from "@/lib/query/keys";
import { TeamDetailPage } from "./team-detail-page";
import { TeamMembers } from "./team-management";

const route = vi.hoisted(() => ({ teamId: "" }));

vi.mock("next/navigation", () => ({
  usePathname: () => "/teams/detail",
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () =>
    new URLSearchParams({ teamId: route.teamId, tab: "members" }),
}));
vi.mock("./account-provider", () => ({
  useWorkspaceSession: () => ({ data: demoUser }),
}));
vi.mock("./v012-shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./v012-shared")>();
  return {
    ...actual,
    useTeamQuery: (teamId: string, resource: string) => ({
      data:
        resource === "detail"
          ? v012Teams.find((team) => team.teamId === teamId)
          : resource === "members"
            ? {
                data: v012Members.filter((member) => member.teamId === teamId),
                meta: { page: 1, pageSize: 20, total: 2, hasNext: false },
              }
            : undefined,
      error: null,
      isPending: false,
      isFetching: false,
      refetch: vi.fn(),
    }),
  };
});

beforeEach(() => {
  document.cookie = "codestartrack_locale=en; Path=/";
  route.teamId = v012Teams[1].teamId;
  vi.restoreAllMocks();
  vi.spyOn(v012, "removeMember").mockResolvedValue(undefined);
  vi.spyOn(v012, "leaveTeam").mockResolvedValue(undefined);
});

function show(children: React.ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  client.setQueryData(keys.session, demoUser);
  return render(
    <QueryClientProvider client={client}>
      <LocaleProvider initialLocale="en">{children}</LocaleProvider>
    </QueryClientProvider>,
  );
}

describe("team confirmation focus", () => {
  for (const operation of ["remove", "leave"] as const) {
    const action = operation === "remove" ? /^Remove member$/ : /^Leave team$/;
    const title =
      operation === "remove" ? "Remove this member?" : "Leave this team?";

    function openConfirmation() {
      show(
        operation === "remove" ? (
          <TeamMembers team={v012Teams[0]} />
        ) : (
          <TeamDetailPage />
        ),
      );
      const opener = screen.getByRole("button", { name: action });
      opener.focus();
      fireEvent.click(opener, { detail: 0 });
      return opener;
    }

    it(`${operation}: focuses Cancel and activating it preserves membership and restores focus`, async () => {
      const opener = openConfirmation();
      const dialog = await screen.findByRole("alertdialog", { name: title });
      const cancel = within(dialog).getByRole("button", { name: "Cancel" });

      await waitFor(() => expect(cancel).toHaveFocus());
      fireEvent.click(document.activeElement!);

      await waitFor(() =>
        expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
      );
      await waitFor(() => expect(opener).toHaveFocus());
      expect(v012.removeMember).not.toHaveBeenCalled();
      expect(v012.leaveTeam).not.toHaveBeenCalled();
    });

    it(`${operation}: still allows explicitly choosing the destructive action`, async () => {
      openConfirmation();
      const dialog = await screen.findByRole("alertdialog", { name: title });
      fireEvent.click(within(dialog).getByRole("button", { name: action }));

      await waitFor(() => {
        if (operation === "remove") {
          const member = v012Members.find(
            (entry) =>
              entry.teamId === v012Teams[0].teamId && entry.role === "MEMBER",
          )!;
          expect(v012.removeMember).toHaveBeenCalledExactlyOnceWith(
            v012Teams[0].teamId,
            member.user.publicId,
          );
        } else {
          expect(v012.leaveTeam).toHaveBeenCalledExactlyOnceWith(
            v012Teams[1].teamId,
          );
        }
      });
      await waitFor(() =>
        expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
      );
    });
  }
});
