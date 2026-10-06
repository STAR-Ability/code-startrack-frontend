import {
  act,
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
import { v012Notifications } from "@/lib/demo/v012-fixtures";
import { translate } from "@/lib/i18n/locale";
import { keys } from "@/lib/query/keys";
import { CoachPage } from "./coach-page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/coach",
  useRouter: () => ({ replace: vi.fn() }),
}));
vi.mock("./account-provider", () => ({
  useWorkspaceSession: () => ({ data: demoUser }),
}));
beforeEach(() => {
  document.cookie = "codestartrack_locale=en; Path=/";
  vi.restoreAllMocks();
});

describe("coach notification read state", () => {
  it("blocks duplicate reads and refreshes the visible notification only after the mutation succeeds", async () => {
    const notification = { ...v012Notifications[0], read: false };
    const initial = {
      managedTeamCount: 0,
      activeMemberCount: 0,
      pendingApplicationCount: 0,
      recentNotifications: [notification],
    };
    const refreshed = {
      ...initial,
      recentNotifications: [{ ...notification, read: true }],
    };
    vi.spyOn(v012, "coachDashboard")
      .mockResolvedValueOnce(initial)
      .mockResolvedValue(refreshed);
    vi.spyOn(v012, "mine").mockResolvedValue({
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, hasNext: false },
      requestId: "00000000-0000-4000-8000-000000000001",
    });
    let finishRead!: (value: Record<string, unknown>) => void;
    vi.spyOn(v012, "readNotification").mockReturnValue(
      new Promise((resolve) => {
        finishRead = resolve;
      }),
    );
    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: Infinity, staleTime: Infinity },
      },
    });
    client.setQueryData(keys.session, demoUser);
    render(
      <QueryClientProvider client={client}>
        <LocaleProvider initialLocale="en">
          <CoachPage />
        </LocaleProvider>
      </QueryClientProvider>,
    );
    const queue = await screen.findByRole("list", {
      name: translate("en", "v12.recentNotifications"),
    });
    const record = within(queue).getByRole("listitem");
    const markRead = within(record).getByRole("button", {
      name: translate("en", "v12.read"),
    });
    expect(record).toHaveTextContent(notification.body);
    expect(record.querySelector("time")).toHaveAttribute(
      "datetime",
      notification.createdAt,
    );
    fireEvent.click(markRead);
    await waitFor(() =>
      expect(v012.readNotification).toHaveBeenCalledExactlyOnceWith(
        notification.notificationId,
      ),
    );
    expect(markRead).toBeDisabled();
    expect(within(record).getByRole("status")).toHaveTextContent(
      translate("en", "notifications.updatingReadState"),
    );
    fireEvent.click(markRead);
    expect(v012.readNotification).toHaveBeenCalledOnce();
    expect(v012.coachDashboard).toHaveBeenCalledOnce();
    expect(record.querySelector("article")).toHaveAttribute(
      "data-read",
      "false",
    );
    await act(async () => {
      finishRead({});
    });
    await waitFor(() => expect(v012.coachDashboard).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(record.querySelector("article")).toHaveAttribute(
        "data-read",
        "true",
      ),
    );
    expect(
      within(record).queryByRole("button", {
        name: translate("en", "v12.read"),
      }),
    ).not.toBeInTheDocument();
    expect(within(record).queryByRole("status")).not.toBeInTheDocument();
    expect(record).toHaveTextContent(notification.body);
    expect(v012.readNotification).toHaveBeenCalledOnce();
  });
});
