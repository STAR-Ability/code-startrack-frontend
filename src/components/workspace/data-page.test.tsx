import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/components/layout/locale-provider";
import { api } from "@/lib/api/endpoints";
import { translate, type Locale } from "@/lib/i18n/locale";
import { DataPage } from "./data-page";

vi.mock("next/navigation", () => ({ usePathname: () => "/data" }));
vi.mock("./account-provider", async () => {
  const { demoUser } = await import("@/lib/demo/fixtures");
  return {
    useAccounts: () => ({ user: demoUser, selectedAccountId: "9000001" }),
    useAccountTimezone: () => "Asia/Shanghai",
  };
});

const emptyPage = {
  data: [],
  meta: { page: 1, pageSize: 20, total: 0, hasNext: false },
  requestId: "00000000-0000-4000-8000-000000000001",
};

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(api, "overview").mockImplementation(() => new Promise(() => {}));
  vi.spyOn(api, "problems").mockResolvedValue(emptyPage);
  vi.spyOn(api, "submissions").mockResolvedValue(emptyPage);
});

async function showFilters(locale: Locale, tab: "problems" | "submissions") {
  document.cookie = `codestartrack_locale=${locale}; Path=/`;
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  render(
    <QueryClientProvider client={client}>
      <LocaleProvider initialLocale={locale}>
        <DataPage />
      </LocaleProvider>
    </QueryClientProvider>,
  );
  await waitFor(() => expect(api.problems).toHaveBeenCalledTimes(1));
  if (tab === "submissions") {
    fireEvent.click(
      screen.getByRole("button", {
        name: translate(locale, "v.submissions"),
      }),
    );
    await waitFor(() => expect(api.submissions).toHaveBeenCalledTimes(1));
  }
  return screen.getByRole("button", {
    name: translate(locale, "v.filter"),
  });
}

for (const locale of ["zh-CN", "en"] as const) {
  describe(`${locale} data filter recovery`, () => {
    for (const [key, value] of [
      ["v.minDifficulty", "1.5"],
      ["v.maxDifficulty", "1.5"],
      ["v.maxDifficulty", "9007199254740992"],
    ] as const) {
      it(`focuses and associates ${key} for rejected ${value} without applying it`, async () => {
        const apply = await showFilters(locale, "problems");
        const invalid = screen.getByLabelText(translate(locale, key), {
          exact: true,
        });
        fireEvent.change(invalid, { target: { value } });
        fireEvent.click(apply);

        await waitFor(() => expect(invalid).toHaveFocus());
        expect(invalid).toHaveAttribute("aria-invalid", "true");
        expect(invalid).toHaveAccessibleDescription(
          translate(locale, "v.invalidFilter"),
        );
        expect(api.problems).toHaveBeenCalledTimes(1);

        fireEvent.change(invalid, { target: { value: "1600" } });
        await waitFor(() =>
          expect(invalid).toHaveAttribute("aria-invalid", "false"),
        );
        fireEvent.click(apply);
        await waitFor(() => expect(api.problems).toHaveBeenCalledTimes(2));
        expect(api.problems).toHaveBeenLastCalledWith(
          "9000001",
          {
            page: 1,
            status: "ALL",
            tag: undefined,
            minDifficulty: key === "v.minDifficulty" ? 1600 : undefined,
            maxDifficulty: key === "v.maxDifficulty" ? 1600 : undefined,
          },
          expect.any(AbortSignal),
        );
      });
    }

    it("focuses a reversed difficulty range and clears its error when the maximum is corrected", async () => {
      const apply = await showFilters(locale, "problems");
      const min = screen.getByLabelText(translate(locale, "v.minDifficulty"), {
        exact: true,
      });
      const max = screen.getByLabelText(translate(locale, "v.maxDifficulty"), {
        exact: true,
      });
      fireEvent.change(min, { target: { value: "1600" } });
      fireEvent.change(max, { target: { value: "1200" } });
      fireEvent.click(apply);

      await waitFor(() => expect(min).toHaveFocus());
      expect(min).toHaveAccessibleDescription(
        translate(locale, "v.invalidFilter"),
      );
      expect(max).toHaveAttribute("aria-invalid", "false");
      expect(api.problems).toHaveBeenCalledTimes(1);

      fireEvent.change(max, { target: { value: "1600" } });
      await waitFor(() => expect(min).toHaveAttribute("aria-invalid", "false"));
      fireEvent.click(apply);
      await waitFor(() => expect(api.problems).toHaveBeenCalledTimes(2));
      expect(api.problems).toHaveBeenLastCalledWith(
        "9000001",
        {
          page: 1,
          status: "ALL",
          tag: undefined,
          minDifficulty: 1600,
          maxDifficulty: 1600,
        },
        expect.any(AbortSignal),
      );
    });

    it("associates the invalid problem ID with that field and preserves an opaque ID on recovery", async () => {
      const apply = await showFilters(locale, "submissions");
      const problemId = screen.getByLabelText(
        translate(locale, "v.problemId"),
        {
          exact: true,
        },
      );
      const from = screen.getByLabelText(translate(locale, "v.from"), {
        exact: true,
      });
      for (const value of ["1.5", "+1", "0"]) {
        fireEvent.change(problemId, { target: { value } });
        fireEvent.click(apply);
        await waitFor(() => expect(problemId).toHaveFocus());
        expect(problemId).toHaveAttribute("aria-invalid", "true");
        expect(problemId).toHaveAccessibleDescription(
          translate(locale, "v.invalidProblemId"),
        );
        expect(from).toHaveAttribute("aria-invalid", "false");
        expect(api.submissions).toHaveBeenCalledTimes(1);
      }

      const opaqueId = "9223372036854775807";
      fireEvent.change(problemId, { target: { value: opaqueId } });
      fireEvent.click(apply);
      await waitFor(() => expect(api.submissions).toHaveBeenCalledTimes(2));
      expect(problemId).toHaveAttribute("aria-invalid", "false");
      expect(problemId).not.toHaveAttribute("aria-describedby");
      expect(api.submissions).toHaveBeenLastCalledWith(
        "9000001",
        {
          page: 1,
          problemId: opaqueId,
          verdict: undefined,
          from: undefined,
          to: undefined,
        },
        expect.any(AbortSignal),
      );
    });

    for (const toValue of ["2026-10-06T09:00", "2026-10-07T09:00"]) {
      it(`focuses an invalid date range ending ${toValue} and recovers with native date controls`, async () => {
        const apply = await showFilters(locale, "submissions");
        const from = screen.getByLabelText(translate(locale, "v.from"), {
          exact: true,
        });
        const to = screen.getByLabelText(translate(locale, "v.to"), {
          exact: true,
        });
        const fromValue = "2026-10-07T09:00";
        fireEvent.change(from, { target: { value: fromValue } });
        fireEvent.change(to, { target: { value: toValue } });
        fireEvent.click(apply);

        await waitFor(() => expect(from).toHaveFocus());
        expect(from).toHaveAccessibleDescription(
          translate(locale, "v.invalidDates"),
        );
        expect(to).toHaveAttribute("aria-invalid", "false");
        expect(api.submissions).toHaveBeenCalledTimes(1);

        const correctedTo = "2026-10-08T09:00";
        fireEvent.change(to, { target: { value: correctedTo } });
        await waitFor(() =>
          expect(from).toHaveAttribute("aria-invalid", "false"),
        );
        fireEvent.click(apply);
        await waitFor(() => expect(api.submissions).toHaveBeenCalledTimes(2));
        expect(api.submissions).toHaveBeenLastCalledWith(
          "9000001",
          {
            page: 1,
            problemId: undefined,
            verdict: undefined,
            from: new Date(fromValue).toISOString(),
            to: new Date(correctedTo).toISOString(),
          },
          expect.any(AbortSignal),
        );
      });
    }

    it("keeps date boundaries optional and serializes the one supplied native boundary", async () => {
      const apply = await showFilters(locale, "submissions");
      const verdict = screen.getByLabelText(translate(locale, "v.verdict"), {
        exact: true,
      });
      const to = screen.getByLabelText(translate(locale, "v.to"), {
        exact: true,
      });
      fireEvent.change(verdict, { target: { value: "ACCEPTED" } });
      fireEvent.click(apply);
      await waitFor(() => expect(api.submissions).toHaveBeenCalledTimes(2));
      expect(api.submissions).toHaveBeenLastCalledWith(
        "9000001",
        {
          page: 1,
          problemId: undefined,
          verdict: "ACCEPTED",
          from: undefined,
          to: undefined,
        },
        expect.any(AbortSignal),
      );

      const value = "2026-10-08T09:00";
      fireEvent.change(to, { target: { value } });
      fireEvent.click(apply);
      await waitFor(() => expect(api.submissions).toHaveBeenCalledTimes(3));
      expect(api.submissions).toHaveBeenLastCalledWith(
        "9000001",
        {
          page: 1,
          problemId: undefined,
          verdict: "ACCEPTED",
          from: undefined,
          to: new Date(value).toISOString(),
        },
        expect.any(AbortSignal),
      );
    });
  });
}
