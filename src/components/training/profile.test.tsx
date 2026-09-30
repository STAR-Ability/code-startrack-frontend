import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { LocaleProvider } from "@/components/layout/locale-provider";
import { TrainingPage } from "./training-page";
import { TrainingQueryProvider } from "./query-provider";
import {
  profileFixture,
  recommendationsFixture,
} from "../../../tests/api-fixtures.mjs";

vi.mock("next/navigation", () => ({ usePathname: () => "/profile" }));
afterEach(() => vi.unstubAllGlobals());

function renderProfile(locale: "en" | "zh-CN" = "en") {
  return render(
    <LocaleProvider initialLocale={locale}>
      <TrainingQueryProvider>
        <TrainingPage userId={1} view="profile" />
      </TrainingQueryProvider>
    </LocaleProvider>,
  );
}

function mockProfile(
  fetcher: (url: string, options?: RequestInit) => Promise<Response>,
) {
  vi.stubGlobal("fetch", (url: string, options?: RequestInit) =>
    url.endsWith("/recommendation")
      ? Promise.resolve(Response.json(recommendationsFixture))
      : fetcher(url, options),
  );
}

test("shows real metrics, zero activity and the profile timestamp", async () => {
  const fetcher = vi.fn().mockResolvedValue(
    Response.json({
      ...profileFixture,
      totalSolved: 42,
      averageDifficulty: 1234.56,
    }),
  );
  mockProfile(fetcher);
  renderProfile();
  expect(await screen.findByText("42")).toBeVisible();
  expect(screen.getByText("1,234.6")).toBeVisible();
  expect(
    [...document.querySelectorAll("dd")].map((element) => element.textContent),
  ).toEqual(["42", "1,234.6", "0", "0", "0"]);
  expect(screen.getByText(/Average difficulty includes only/)).toBeVisible();
  expect(
    screen
      .getByRole("region", { name: "Training profile" })
      .querySelector("time"),
  ).toHaveAttribute("dateTime", profileFixture.updatedAt);
  expect(
    screen.getByText("Connected account details are unavailable."),
  ).toBeVisible();
  expect(fetcher).toHaveBeenCalledExactlyOnceWith(
    "/api/training/profile",
    expect.objectContaining({ method: "GET", credentials: "omit" }),
  );
});

test("pending profile does not fabricate zero metrics", () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => new Promise(() => {})),
  );
  renderProfile("zh-CN");
  expect(screen.getByText("正在加载训练画像…")).toBeVisible();
  expect(screen.queryByText("0")).not.toBeInTheDocument();
});

test.each(["configuration", "http", "transport", "invalid_payload", "timeout"])(
  "%s stays an error until an explicit profile retry succeeds",
  async (category) => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json(
          {
            error: { operation: "profile", category, status: 502 },
            private: "sensitive backend text",
          },
          { status: 502 },
        ),
      )
      .mockResolvedValue(Response.json(profileFixture));
    mockProfile(fetcher);
    renderProfile();
    const retry = await screen.findByRole("button", { name: "Retry profile" });
    expect(screen.queryByText("0")).not.toBeInTheDocument();
    expect(screen.queryByText(/sensitive backend/)).not.toBeInTheDocument();
    if (category === "timeout")
      expect(screen.getByText(/timed out/)).toBeVisible();
    expect(fetcher).toHaveBeenCalledTimes(1);
    fireEvent.click(retry);
    await waitFor(() =>
      expect(
        [...document.querySelectorAll("dd")].map(
          (element) => element.textContent,
        ),
      ).toEqual(["0", "0", "0", "0", "0"]),
    );
    expect(fetcher).toHaveBeenCalledTimes(2);
  },
);
