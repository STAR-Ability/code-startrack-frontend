import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/components/layout/locale-provider";
import { demoSubmissions } from "@/lib/demo/fixtures";
import { formatTimestamp } from "@/lib/i18n/locale";
import { SubmissionRecords } from "./submission-records";
import { DetailsDisclosure } from "@/components/ui/details-disclosure";

vi.mock("next/navigation", () => ({ usePathname: () => "/data" }));

beforeEach(() => {
  document.cookie = "codestartrack_locale=en; Path=/";
});

function present(items = demoSubmissions()) {
  return render(
    <LocaleProvider initialLocale="en">
      <SubmissionRecords items={items} />
    </LocaleProvider>,
  );
}

describe("account submission records", () => {
  it("keeps backend order, comparable measurements and supplied UTC instants", () => {
    const items = demoSubmissions();
    const { container } = present(items);
    const table = screen.getByRole("table", { name: "Submissions" });
    expect(within(table).getAllByRole("columnheader")).toHaveLength(6);
    const rows = table.querySelectorAll("tr[data-submission-primary]");
    expect(rows).toHaveLength(items.length);
    items.forEach((item, index) => {
      const row = rows[index];
      expect(row.parentElement).toHaveAttribute(
        "data-submission-id",
        item.submissionId,
      );
      expect(row).toHaveTextContent(
        item.problem.title ?? item.problem.externalProblemKey,
      );
      expect(row).toHaveTextContent(item.programmingLanguage ?? "Unavailable");
      expect(row.querySelector("time")).toHaveAttribute(
        "datetime",
        item.submittedAt,
      );
      expect(row.querySelector("time")).toHaveTextContent(
        formatTimestamp(item.submittedAt, "en"),
      );
      expect(row.querySelectorAll("td")[2]).toHaveTextContent(
        String(item.timeMs ?? "Unavailable"),
      );
      expect(row.querySelectorAll("td")[3]).toHaveTextContent(
        item.memoryBytes === null
          ? "Unavailable"
          : (item.memoryBytes / 1048576).toFixed(2),
      );
    });
    expect(
      [...container.querySelectorAll(".submission-mobile-list > li")].map(
        (item) => item.getAttribute("data-submission-id"),
      ),
    ).toEqual(items.map((item) => item.submissionId));
  });

  it("opens mobile details with exact large IDs, team attribution and measurement units", () => {
    const item = demoSubmissions()[0];
    const { container } = present([item]);
    const mobile = within(
      container.querySelector(".submission-mobile-list > li")! as HTMLElement,
    );
    const trigger = mobile.getByRole("button", {
      name: `Submission details for ${item.problem.title ?? item.problem.externalProblemKey}, submission ${item.externalSubmissionId}`,
    });
    expect(trigger).toHaveTextContent("Submission details");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(
      mobile.getByText(
        `ID: ${item.submissionId} · CF: ${item.externalSubmissionId}`,
      ),
    ).toBeVisible();
    expect(
      mobile.getByText(
        `Team: ${item.teamName} · ${item.memberHandles.join(", ")}`,
      ),
    ).toBeVisible();
    expect(mobile.getByText("Time (ms)")).toBeVisible();
    expect(mobile.getByText("Memory (MiB)")).toBeVisible();
    expect(mobile.getByText("1.00")).toBeVisible();
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("preserves null values and true zeros without replacing either with invented evidence", () => {
    const original = demoSubmissions();
    const missing = {
      ...original[0],
      programmingLanguage: null,
      timeMs: null,
      memoryBytes: null,
      problem: { ...original[0].problem, title: null, url: null },
    };
    const zero = { ...original[1], timeMs: 0, memoryBytes: 0 };
    const { container } = present([missing, zero]);
    const rows = container.querySelectorAll("tr[data-submission-primary]");
    expect(rows[0].querySelector("h3")).toHaveTextContent(
      missing.problem.externalProblemKey,
    );
    expect(rows[0].querySelectorAll("td")[1]).toHaveTextContent("Unavailable");
    expect(rows[0].querySelectorAll("td")[2]).toHaveTextContent("Unavailable");
    expect(rows[0].querySelectorAll("td")[3]).toHaveTextContent("Unavailable");
    expect(rows[1].querySelectorAll("td")[2]).toHaveTextContent("0");
    expect(rows[1].querySelectorAll("td")[3]).toHaveTextContent("0.00");
    const missingRow = within(
      container.querySelector(".submission-mobile-list > li")! as HTMLElement,
    );
    expect(
      missingRow.getByRole("button", { name: "Problem link unavailable" }),
    ).toBeDisabled();
  });

  it("uses the existing safe problem action for Codeforces and Gym URLs", () => {
    const original = demoSubmissions();
    const items = [
      {
        ...original[0],
        problem: {
          ...original[0].problem,
          url: "https://codeforces.com/gym/100001/problem/A",
        },
      },
      {
        ...original[1],
        problem: {
          ...original[1].problem,
          url: "https://codeforces.com/problemset/problem/1/A",
        },
      },
      {
        ...original[2],
        problem: { ...original[2].problem, url: "javascript:alert(1)" },
      },
    ];
    const { container } = present(items);
    const mobile = within(
      container.querySelector(".submission-mobile-list")! as HTMLElement,
    );
    const actions = mobile.getAllByRole("link");
    expect(actions.map((action) => action.getAttribute("href"))).toEqual(
      items.slice(0, 2).map((item) => item.problem.url),
    );
    for (const action of actions) {
      expect(action).toHaveAttribute("target", "_blank");
      expect(action).toHaveAttribute("rel", "noopener noreferrer");
    }
    expect(
      mobile.getByRole("button", { name: "Problem link unavailable" }),
    ).toBeDisabled();
  });

  it("leaves empty/error ownership with the query boundary", () => {
    const { container } = present([]);
    expect(container.querySelector(".submission-records")).toBeNull();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByText("No records yet")).not.toBeInTheDocument();
  });

  it("retains the existing title as the accessible disclosure name when no override is supplied", () => {
    render(
      <DetailsDisclosure title="Supporting evidence">
        Evidence
      </DetailsDisclosure>,
    );
    const trigger = screen.getByRole("button", { name: "Supporting evidence" });
    expect(trigger).not.toHaveAttribute("aria-label");
    fireEvent.click(trigger);
    expect(screen.getByText("Evidence")).toBeVisible();
  });
});
