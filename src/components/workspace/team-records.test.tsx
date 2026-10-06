import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/components/layout/locale-provider";
import type { UserSubmissionDto } from "@/lib/api/v012-schemas";
import { demoAccounts, demoSubmissions } from "@/lib/demo/fixtures";
import { formatTimestamp, translate } from "@/lib/i18n/locale";
import { MemberSubmissionRecords } from "./team-records";

vi.mock("next/navigation", () => ({ usePathname: () => "/teams/member" }));
beforeEach(() => {
  document.cookie = "codestartrack_locale=en; Path=/";
});

function records(): UserSubmissionDto[] {
  return demoSubmissions().map((submission, index) => ({
    submission,
    sourceAccount: {
      accountId: demoAccounts[index % demoAccounts.length].accountId,
      platform: "codeforces",
      username: demoAccounts[index % demoAccounts.length].username,
    },
  }));
}
function show(items: UserSubmissionDto[], locale: "zh-CN" | "en" = "en") {
  document.cookie = `codestartrack_locale=${locale}; Path=/`;
  return render(
    <LocaleProvider initialLocale={locale}>
      <MemberSubmissionRecords items={items} />
    </LocaleProvider>,
  );
}

describe("member submissions retain source-account provenance", () => {
  for (const locale of ["zh-CN", "en"] as const) {
    it(`${locale} retains every source, submission and exact UTC instant in backend order`, () => {
      const items = records();
      show(items, locale);
      const list = screen.getByRole("list", {
        name: translate(locale, "v12.detailedSubmissions"),
      });
      const rows = within(list).getAllByRole("listitem");
      expect(rows).toHaveLength(items.length);
      items.forEach(({ submission, sourceAccount }, index) => {
        const row = within(rows[index]);
        expect(rows[index]).toHaveAttribute(
          "data-member-submission-id",
          submission.submissionId,
        );
        expect(rows[index]).toHaveAttribute(
          "data-source-account-id",
          sourceAccount.accountId,
        );
        expect(row.getByRole("heading")).toHaveTextContent(
          submission.problem.title ?? submission.problem.externalProblemKey,
        );
        expect(
          row.getByText(
            `${sourceAccount.username} · ${sourceAccount.platform}`,
            { exact: true },
          ),
        ).toBeVisible();
        expect(
          row.getByText(translate(locale, "v12.sourceAccount"), {
            exact: true,
          }),
        ).toBeVisible();
        expect(rows[index].querySelector("time")).toHaveAttribute(
          "datetime",
          submission.submittedAt,
        );
        expect(rows[index].querySelector("time")).toHaveTextContent(
          formatTimestamp(submission.submittedAt, locale),
        );
        expect(rows[index]).toHaveTextContent(
          submission.programmingLanguage ?? translate(locale, "v.unavailable"),
        );
      });
    });
  }

  it("keeps a shared submission associated with each source instead of collapsing account identities", () => {
    const original = records();
    const items = [
      original[0],
      { ...original[1], submission: original[0].submission },
    ];
    show(items);
    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(2);
    items.forEach((item, index) => {
      expect(rows[index]).toHaveAttribute(
        "data-member-submission-id",
        original[0].submission.submissionId,
      );
      expect(rows[index]).toHaveAttribute(
        "data-source-account-id",
        item.sourceAccount.accountId,
      );
      expect(rows[index]).toHaveTextContent(item.sourceAccount.username);
    });
  });

  it("opens complete detail metadata with opaque IDs, team attribution and explicit measurement units", () => {
    const item = records()[0];
    show([item]);
    const row = within(screen.getByRole("listitem"));
    const disclosure = row.getByRole("button", {
      name: translate("en", "v.submissionDetailsFor", {
        problem:
          item.submission.problem.title ??
          item.submission.problem.externalProblemKey,
        id: item.submission.externalSubmissionId,
      }),
    });
    fireEvent.click(disclosure);
    expect(disclosure).toHaveAttribute("aria-expanded", "true");
    expect(
      row.getByText(
        `ID: ${item.submission.submissionId} · CF: ${item.submission.externalSubmissionId}`,
      ),
    ).toBeVisible();
    expect(
      row.getByText(`Source account: ${item.sourceAccount.accountId}`),
    ).toBeVisible();
    expect(
      row.getByText(
        `Team: ${item.submission.teamName} · ${item.submission.memberHandles.join(", ")}`,
      ),
    ).toBeVisible();
    expect(row.getByText("Time (ms)")).toBeVisible();
    expect(row.getByText("Memory (MiB)")).toBeVisible();
    expect(row.getByText("1.00")).toBeVisible();
  });

  it("distinguishes missing measurements from genuine zero and preserves safe Gym/Codeforces actions", () => {
    const original = records();
    const items = [
      {
        ...original[0],
        submission: {
          ...original[0].submission,
          programmingLanguage: null,
          timeMs: null,
          memoryBytes: null,
          problem: {
            ...original[0].submission.problem,
            title: null,
            url: "javascript:alert(1)",
          },
        },
      },
      {
        ...original[1],
        submission: {
          ...original[1].submission,
          timeMs: 0,
          memoryBytes: 0,
          problem: {
            ...original[1].submission.problem,
            url: "https://codeforces.com/gym/100001/problem/A",
          },
        },
      },
    ];
    show(items);
    const rows = screen.getAllByRole("listitem");
    for (const row of rows)
      fireEvent.click(
        within(row).getByRole("button", { name: /^Submission details for/ }),
      );
    expect(within(rows[0]).getByRole("heading")).toHaveTextContent(
      items[0].submission.problem.externalProblemKey,
    );
    expect(
      within(rows[0]).getAllByText("Unavailable", { exact: true }),
    ).toHaveLength(3);
    expect(
      within(rows[0]).getByRole("button", { name: "Problem link unavailable" }),
    ).toBeDisabled();
    expect(within(rows[1]).getByText("0", { exact: true })).toBeVisible();
    expect(within(rows[1]).getByText("0.00", { exact: true })).toBeVisible();
    const problem = within(rows[1]).getByRole("link");
    expect(problem).toHaveAttribute("href", items[1].submission.problem.url);
    expect(problem).toHaveAttribute("target", "_blank");
    expect(problem).toHaveAttribute("rel", "noopener noreferrer");
  });
});
