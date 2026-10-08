import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/components/layout/locale-provider";
import { v02 } from "@/lib/api/v02";
import { ApiError } from "@/lib/api/errors";
import { demoUser, fixtureUuid } from "@/lib/demo/fixtures";
import { v02Languages, v02Problems } from "@/lib/demo/v02-fixtures";
import { keys } from "@/lib/query/keys";
import { ProblemDetailPage } from "./problem-detail-page";

vi.mock("next/navigation", async () => {
  const { v02Problems } = await import("@/lib/demo/v02-fixtures");
  return {
    usePathname: () => "/problems/detail",
    useRouter: () => ({ push: vi.fn() }),
    useSearchParams: () =>
      new URLSearchParams({
        problemId: v02Problems[0].problemRef.problemId,
        problemVersionId: v02Problems[0].problemRef.problemVersionId,
      }),
  };
});
vi.mock("../account-provider", async () => {
  const { demoUser } = await import("@/lib/demo/fixtures");
  return { useWorkspaceSession: () => ({ data: demoUser }) };
});

beforeEach(() => {
  vi.restoreAllMocks();
  document.cookie = "codestartrack_locale=en; Path=/";
});

it("keeps source through a failed version refresh, then permits explicit submission after recovery", async () => {
  vi.spyOn(v02, "languages").mockResolvedValue(v02Languages);
  vi.spyOn(v02, "problemVersion").mockResolvedValue(v02Problems[0]);
  const refreshed = {
    ...v02Problems[0],
    problemRef: {
      ...v02Problems[0].problemRef,
      problemVersionId: fixtureUuid(2999),
    },
  };
  vi.spyOn(v02, "problem")
    .mockRejectedValueOnce(new ApiError("JUDGE_UNAVAILABLE", 503))
    .mockResolvedValue(refreshed);
  const submit = vi.spyOn(v02, "createSubmission");
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  client.setQueryData(keys.session, demoUser);
  render(
    <QueryClientProvider client={client}>
      <LocaleProvider initialLocale="en">
        <ProblemDetailPage />
      </LocaleProvider>
    </QueryClientProvider>,
  );
  const source = "  int main() { return 0; }\n\n";
  fireEvent.change(
    await screen.findByRole("textbox", { name: "Source code" }),
    { target: { value: source } },
  );
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Submit for judging" }),
    ).toBeEnabled(),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Refresh current problem" }),
  );
  await screen.findByText(/Refresh has not completed/);
  expect(screen.getByRole("textbox", { name: "Source code" })).toHaveValue(
    source,
  );
  expect(
    screen.getByRole("button", { name: "Submit for judging" }),
  ).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Submit for judging" }),
    ).toBeEnabled(),
  );
  expect(screen.getByRole("textbox", { name: "Source code" })).toHaveValue(
    source,
  );
  expect(
    screen.getByText(/The statement and language capabilities were refreshed/),
  ).toBeInTheDocument();
  expect(submit).not.toHaveBeenCalled();
});
