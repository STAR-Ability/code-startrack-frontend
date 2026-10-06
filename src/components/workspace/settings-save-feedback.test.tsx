import type { ComponentProps } from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/components/layout/locale-provider";
import { v012 } from "@/lib/api/v012";
import { ApiError } from "@/lib/api/errors";
import { v012Coach, v012Privacy, v012Teams } from "@/lib/demo/v012-fixtures";
import {
  privacySchema,
  teamDetailSchema,
  type PrivacySettingsDto,
  type TeamDetailDto,
} from "@/lib/api/v012-schemas";
import { keys } from "@/lib/query/keys";
import { PrivacyPage } from "./privacy-page";
import { TeamSettings } from "./team-management";
import { QueryFeedback } from "./feedback";

vi.mock("next/navigation", () => ({
  usePathname: () => "/privacy",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));
vi.mock("./account-provider", async () => {
  const { v012Coach } = await import("@/lib/demo/v012-fixtures");
  return { useWorkspaceSession: () => ({ data: v012Coach }) };
});
// Select keyboard/layout behavior has browser coverage; these tests exercise the
// real form, mutation and query-refetch lifecycle through a native control.
vi.mock("@/components/ui/choice-select", () => ({
  ChoiceSelect: ({
    options,
    onValueChange,
    ...props
  }: ComponentProps<"select"> & {
    options: { value: string; label: string }[];
    onValueChange: (value: string) => void;
  }) => (
    <select {...props} onChange={(event) => onValueChange(event.target.value)}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

let privacy: PrivacySettingsDto;
let team: TeamDetailDto;

beforeEach(() => {
  vi.restoreAllMocks();
  document.cookie = "codestartrack_locale=en; Path=/";
  privacy = { ...v012Privacy };
  team = { ...v012Teams[0] };
  vi.spyOn(v012, "privacy").mockImplementation(async () => ({ ...privacy }));
  vi.spyOn(v012, "updatePrivacy").mockImplementation(async (values) => {
    privacy = { ...privacy, ...values, updatedAt: "2026-10-06T03:00:00Z" };
    return { ...privacy };
  });
  vi.spyOn(v012, "team").mockImplementation(async () => ({ ...team }));
  vi.spyOn(v012, "updateTeam").mockImplementation(async (_teamId, values) => {
    team = { ...team, ...values, updatedAt: "2026-10-06T03:00:00Z" };
    return { ...team };
  });
  vi.spyOn(v012, "members").mockResolvedValue({
    data: [],
    meta: { page: 1, pageSize: 20, total: 0, hasNext: false },
    requestId: "settings-save-test",
  });
});

function TeamSettingsPage() {
  const query = useQuery({
    queryKey: keys.team(v012Coach.publicId, team.teamId, "detail"),
    queryFn: () => v012.team(team.teamId),
  });
  return (
    <>
      <QueryFeedback query={query} />
      {query.data && <TeamSettings team={query.data} />}
    </>
  );
}

function showSettings(page: "privacy" | "team") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  client.setQueryData(keys.session, v012Coach);
  render(
    <QueryClientProvider client={client}>
      <LocaleProvider initialLocale="en">
        {page === "privacy" ? <PrivacyPage /> : <TeamSettingsPage />}
      </LocaleProvider>
    </QueryClientProvider>,
  );
  return client;
}

function editSettings(page: "privacy" | "team", value: string) {
  fireEvent.change(
    page === "privacy"
      ? screen.getByRole("combobox", { name: "Basic training data" })
      : screen.getByRole("textbox", { name: "Team name" }),
    { target: { value } },
  );
}

async function saveSettings(page: "privacy" | "team") {
  const client = showSettings(page);
  await screen.findByRole(page === "privacy" ? "combobox" : "textbox", {
    name: page === "privacy" ? "Basic training data" : "Team name",
  });
  editSettings(page, page === "privacy" ? "TEAM_MEMBER" : "Updated team");
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  await screen.findByText("Saved");
  return client;
}

function deferSettingsSave(
  page: "privacy" | "team",
  updatedAt = "2026-10-06T03:00:00Z",
) {
  let completeSave: () => void = () => {};
  if (page === "privacy") {
    vi.mocked(v012.updatePrivacy).mockImplementationOnce(
      () =>
        new Promise<PrivacySettingsDto>((resolve) => {
          completeSave = () =>
            resolve(
              privacySchema.parse({
                ...privacy,
                basicTraining: "TEAM_MEMBER",
                updatedAt,
              }),
            );
        }),
    );
  } else {
    vi.mocked(v012.updateTeam).mockImplementationOnce(
      () =>
        new Promise<TeamDetailDto>((resolve) => {
          completeSave = () =>
            resolve(
              teamDetailSchema.parse({
                ...team,
                name: "Updated team",
                updatedAt,
              }),
            );
        }),
    );
  }
  return () => completeSave();
}

describe("settings save acknowledgement after query refresh", () => {
  it("keeps privacy save acknowledgement after the updated revision refetches", async () => {
    showSettings("privacy");
    fireEvent.change(
      await screen.findByRole("combobox", { name: "Basic training data" }),
      { target: { value: "TEAM_MEMBER" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(v012.privacy).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Save" })).toBeDisabled(),
    );
    expect(await screen.findByText("Saved")).toHaveAttribute("role", "status");
    expect(
      screen.getByRole("combobox", { name: "Basic training data" }),
    ).toHaveValue("TEAM_MEMBER");
  });

  it("keeps team save acknowledgement after the team detail revision refetches", async () => {
    showSettings("team");
    fireEvent.change(
      await screen.findByRole("textbox", { name: "Team name" }),
      {
        target: { value: "Updated training team" },
      },
    );
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(v012.team).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("Saved")).toHaveAttribute("role", "status");
    expect(screen.getByRole("textbox", { name: "Team name" })).toHaveValue(
      "Updated training team",
    );
  });

  for (const page of ["privacy", "team"] as const) {
    it(`${page}: retains the confirmed save when its follow-up read fails and can retry the read`, async () => {
      const readError = new ApiError("UPSTREAM_UNAVAILABLE", 503);
      if (page === "privacy") {
        vi.mocked(v012.privacy)
          .mockImplementationOnce(async () => ({ ...privacy }))
          .mockRejectedValueOnce(readError);
      } else {
        vi.mocked(v012.team)
          .mockImplementationOnce(async () => ({ ...team }))
          .mockRejectedValueOnce(readError);
      }
      const client = showSettings(page);
      await screen.findByRole(page === "privacy" ? "combobox" : "textbox", {
        name: page === "privacy" ? "Basic training data" : "Team name",
      });
      editSettings(page, page === "privacy" ? "TEAM_MEMBER" : "Updated team");
      fireEvent.click(screen.getByRole("button", { name: "Save" }));

      await screen.findByRole("alert");
      expect(await screen.findByText("Saved")).toHaveAttribute(
        "role",
        "status",
      );
      expect(
        page === "privacy"
          ? screen.getByRole("combobox", { name: "Basic training data" })
          : screen.getByRole("textbox", { name: "Team name" }),
      ).toHaveValue(page === "privacy" ? "TEAM_MEMBER" : "Updated team");
      expect(
        page === "privacy"
          ? client.getQueryData<PrivacySettingsDto>(
              keys.userResource(v012Coach.publicId, "privacy"),
            )?.updatedAt
          : client.getQueryData<TeamDetailDto>(
              keys.team(v012Coach.publicId, team.teamId, "detail"),
            )?.updatedAt,
      ).toBe("2026-10-06T03:00:00Z");
      if (page === "privacy")
        expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();

      fireEvent.click(screen.getByRole("button", { name: "Retry" }));
      await waitFor(() =>
        expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
      );
      expect(screen.getByText("Saved")).toBeInTheDocument();
    });

    it(`${page}: allows a newer successful follow-up read to replace the confirmed write`, async () => {
      if (page === "privacy") {
        vi.mocked(v012.privacy)
          .mockImplementationOnce(async () => ({ ...privacy }))
          .mockImplementationOnce(async () => ({
            ...privacy,
            basicTraining: "TEAM_COACH",
            updatedAt: "2026-10-06T04:00:00Z",
          }));
      } else {
        vi.mocked(v012.team)
          .mockImplementationOnce(async () => ({ ...team }))
          .mockImplementationOnce(async () => ({
            ...team,
            name: "Newer server revision",
            updatedAt: "2026-10-06T04:00:00Z",
          }));
      }
      const client = showSettings(page);
      await screen.findByRole(page === "privacy" ? "combobox" : "textbox", {
        name: page === "privacy" ? "Basic training data" : "Team name",
      });
      editSettings(page, page === "privacy" ? "TEAM_MEMBER" : "Updated team");
      fireEvent.click(screen.getByRole("button", { name: "Save" }));

      await waitFor(() =>
        expect(
          page === "privacy"
            ? screen.getByRole("combobox", { name: "Basic training data" })
            : screen.getByRole("textbox", { name: "Team name" }),
        ).toHaveValue(
          page === "privacy" ? "TEAM_COACH" : "Newer server revision",
        ),
      );
      expect(screen.queryByText("Saved")).not.toBeInTheDocument();
      expect(
        page === "privacy"
          ? client.getQueryData<PrivacySettingsDto>(
              keys.userResource(v012Coach.publicId, "privacy"),
            )?.updatedAt
          : client.getQueryData<TeamDetailDto>(
              keys.team(v012Coach.publicId, team.teamId, "detail"),
            )?.updatedAt,
      ).toBe("2026-10-06T04:00:00Z");
    });

    it.each([
      {
        label: "a later second",
        writeRevision: "2026-10-06T03:00:00Z",
        cacheRevision: "2026-10-06T04:00:00Z",
      },
      {
        label: "a larger fraction within the same millisecond",
        writeRevision: "2026-10-06T03:00:00.000100Z",
        cacheRevision: "2026-10-06T03:00:00.000900Z",
      },
    ])(
      `${page}: retains a newer cache revision with $label when a pending write completes`,
      async ({ writeRevision, cacheRevision }) => {
        const completeSave = deferSettingsSave(page, writeRevision);
        const client = showSettings(page);
        await screen.findByRole(page === "privacy" ? "combobox" : "textbox", {
          name: page === "privacy" ? "Basic training data" : "Team name",
        });
        editSettings(page, page === "privacy" ? "TEAM_MEMBER" : "Updated team");
        fireEvent.click(screen.getByRole("button", { name: "Save" }));
        await waitFor(() =>
          expect(screen.getByRole("button", { name: "Save" })).toBeDisabled(),
        );

        const readError = new ApiError("UPSTREAM_UNAVAILABLE", 503);
        await act(async () => {
          if (page === "privacy") {
            vi.mocked(v012.privacy).mockRejectedValue(readError);
            client.setQueryData(
              keys.userResource(v012Coach.publicId, "privacy"),
              privacySchema.parse({
                ...privacy,
                basicTraining: "TEAM_COACH",
                updatedAt: cacheRevision,
              }),
            );
          } else {
            vi.mocked(v012.team).mockRejectedValue(readError);
            client.setQueryData(
              keys.team(v012Coach.publicId, team.teamId, "detail"),
              teamDetailSchema.parse({
                ...team,
                name: "Concurrent server revision",
                updatedAt: cacheRevision,
              }),
            );
          }
          completeSave();
        });

        await screen.findByRole("alert");
        expect(
          page === "privacy"
            ? screen.getByRole("combobox", { name: "Basic training data" })
            : screen.getByRole("textbox", { name: "Team name" }),
        ).toHaveValue(
          page === "privacy" ? "TEAM_COACH" : "Concurrent server revision",
        );
        expect(screen.queryByText("Saved")).not.toBeInTheDocument();
        expect(
          page === "privacy"
            ? client.getQueryData<PrivacySettingsDto>(
                keys.userResource(v012Coach.publicId, "privacy"),
              )?.updatedAt
            : client.getQueryData<TeamDetailDto>(
                keys.team(v012Coach.publicId, team.teamId, "detail"),
              )?.updatedAt,
        ).toBe(cacheRevision);
      },
    );

    for (const status of [401, 403, 404]) {
      it(`${page}: does not clear a concurrent ${status} read denial when a pending write completes`, async () => {
        const completeSave = deferSettingsSave(page);
        const client = showSettings(page);
        await screen.findByRole(page === "privacy" ? "combobox" : "textbox", {
          name: page === "privacy" ? "Basic training data" : "Team name",
        });
        editSettings(page, page === "privacy" ? "TEAM_MEMBER" : "Updated team");
        fireEvent.click(screen.getByRole("button", { name: "Save" }));
        await waitFor(() =>
          expect(screen.getByRole("button", { name: "Save" })).toBeDisabled(),
        );

        const readError = new ApiError("UNAUTHORIZED", status);
        const key =
          page === "privacy"
            ? keys.userResource(v012Coach.publicId, "privacy")
            : keys.team(v012Coach.publicId, team.teamId, "detail");
        if (page === "privacy")
          vi.mocked(v012.privacy).mockRejectedValue(readError);
        else vi.mocked(v012.team).mockRejectedValue(readError);
        await act(async () => {
          await client.refetchQueries({ queryKey: key, exact: true });
        });
        expect(client.getQueryState(key)?.error).toBe(readError);

        const seed = vi.spyOn(client, "setQueryData");
        await act(async () => completeSave());
        await waitFor(() => {
          expect(client.getQueryState(key)?.fetchStatus).toBe("idle");
          expect(
            page === "privacy" ? v012.privacy : v012.team,
          ).toHaveBeenCalledTimes(3);
        });
        expect(seed).not.toHaveBeenCalled();
        expect(client.getQueryState(key)?.error).toBe(readError);
        expect(
          client.getQueryData<PrivacySettingsDto | TeamDetailDto>(key)
            ?.updatedAt,
        ).toBe(v012Privacy.updatedAt);
        expect(screen.queryByText("Saved")).not.toBeInTheDocument();
      });
    }

    it(`${page}: does not seed a completed write after the session identity changes`, async () => {
      const completeSave = deferSettingsSave(page);
      const client = showSettings(page);
      await screen.findByRole(page === "privacy" ? "combobox" : "textbox", {
        name: page === "privacy" ? "Basic training data" : "Team name",
      });
      editSettings(page, page === "privacy" ? "TEAM_MEMBER" : "Updated team");
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
      await waitFor(() =>
        expect(screen.getByRole("button", { name: "Save" })).toBeDisabled(),
      );
      await act(async () => {
        client.setQueryData(keys.session, null);
        completeSave();
      });
      await waitFor(() =>
        expect(screen.getByRole("button", { name: "Save" })).toBeEnabled(),
      );
      expect(
        page === "privacy"
          ? client.getQueryData<PrivacySettingsDto>(
              keys.userResource(v012Coach.publicId, "privacy"),
            )?.updatedAt
          : client.getQueryData<TeamDetailDto>(
              keys.team(v012Coach.publicId, team.teamId, "detail"),
            )?.updatedAt,
      ).toBe(v012Privacy.updatedAt);
      expect(screen.queryByText("Saved")).not.toBeInTheDocument();
      expect(
        page === "privacy" ? v012.privacy : v012.team,
      ).toHaveBeenCalledTimes(1);
    });

    it(`${page}: hides acknowledgement after a new edit and during a failed next save`, async () => {
      await saveSettings(page);
      editSettings(page, page === "privacy" ? "PUBLIC" : "Unsaved team");
      expect(screen.queryByText("Saved")).not.toBeInTheDocument();

      let rejectSave: (error: ApiError) => void = () => {};
      if (page === "privacy") {
        vi.mocked(v012.updatePrivacy).mockImplementationOnce(
          () =>
            new Promise<PrivacySettingsDto>((_resolve, reject) => {
              rejectSave = reject;
            }),
        );
      } else {
        vi.mocked(v012.updateTeam).mockImplementationOnce(
          () =>
            new Promise<TeamDetailDto>((_resolve, reject) => {
              rejectSave = reject;
            }),
        );
      }
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
      await waitFor(() =>
        expect(screen.getByRole("button", { name: "Save" })).toBeDisabled(),
      );
      expect(screen.queryByText("Saved")).not.toBeInTheDocument();

      await act(async () => {
        rejectSave(new ApiError("UPSTREAM_UNAVAILABLE", 503));
      });
      await screen.findByRole("alert");
      expect(screen.queryByText("Saved")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
    });

    it(`${page}: does not claim a later server revision was saved by this form`, async () => {
      const client = await saveSettings(page);
      await act(async () => {
        if (page === "privacy") {
          client.setQueryData(
            keys.userResource(v012Coach.publicId, "privacy"),
            {
              ...privacy,
              basicTraining: "PRIVATE",
              updatedAt: "2026-10-06T04:00:00Z",
            },
          );
        } else {
          client.setQueryData(
            keys.team(v012Coach.publicId, team.teamId, "detail"),
            {
              ...team,
              name: "Remotely updated team",
              updatedAt: "2026-10-06T04:00:00Z",
            },
          );
        }
      });
      await waitFor(() => {
        expect(screen.queryByText("Saved")).not.toBeInTheDocument();
        expect(
          page === "privacy"
            ? screen.getByRole("combobox", { name: "Basic training data" })
            : screen.getByRole("textbox", { name: "Team name" }),
        ).toHaveValue(page === "privacy" ? "PRIVATE" : "Remotely updated team");
      });
    });
  }
});
