import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/components/layout/locale-provider";
import { v02Problems } from "@/lib/demo/v02-fixtures";
import { ProblemStatement } from "./problem-statement";

vi.mock("next/navigation", () => ({ usePathname: () => "/problems/detail" }));

beforeEach(() => {
  document.cookie = "codestartrack_locale=en; Path=/";
});

describe("problem statement page accessibility", () => {
  it("omits only a leading Markdown heading that exactly repeats the problem title", () => {
    const problem = {
      ...v02Problems[0],
      statement: {
        ...v02Problems[0].statement,
        content: `# ${v02Problems[0].title}\n\nTask instructions.\n\n## ${v02Problems[0].title}`,
      },
    };
    const { rerender } = render(
      <LocaleProvider initialLocale="en">
        <ProblemStatement problem={problem} />
      </LocaleProvider>,
    );
    expect(
      screen.getAllByRole("heading", { name: problem.title! }),
    ).toHaveLength(2);
    expect(screen.getByText("Task instructions.")).toBeInTheDocument();
    rerender(
      <LocaleProvider initialLocale="en">
        <ProblemStatement
          problem={{
            ...problem,
            statement: {
              ...problem.statement,
              content: "# A separate heading",
            },
          }}
        />
      </LocaleProvider>,
    );
    expect(
      screen.getByRole("heading", { name: "A separate heading" }),
    ).toBeInTheDocument();
  });

  it("preserves an indented code line containing the problem title", () => {
    const problem = {
      ...v02Problems[0],
      statement: {
        ...v02Problems[0].statement,
        content: `    # ${v02Problems[0].title}\n\nInstructions remain visible.`,
      },
    };
    render(
      <LocaleProvider initialLocale="en">
        <ProblemStatement problem={problem} />
      </LocaleProvider>,
    );
    expect(
      screen.getByRole("region", { name: "Complete statement · Code block" }),
    ).toHaveTextContent(`# ${problem.title}`);
    expect(
      screen.getByText("Instructions remain visible."),
    ).toBeInTheDocument();
  });

  it("retains a single page h1 and nests all Markdown headings beneath its statement section", () => {
    const problem = {
      ...v02Problems[0],
      statement: {
        ...v02Problems[0].statement,
        content:
          "# Task text\n\n## Constraints\n\n### More detail\n\n#### Fourth section\n\n##### Fifth section\n\n###### Sixth section",
      },
    };
    render(
      <LocaleProvider initialLocale="en">
        <main>
          <h1>Problem and code editor</h1>
          <ProblemStatement problem={problem} historical />
        </main>
      </LocaleProvider>,
    );
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", { level: 2, name: problem.title! }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Complete statement" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 4, name: "Task text" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 5, name: "Constraints" }),
    ).toBeInTheDocument();
    for (const title of [
      "More detail",
      "Fourth section",
      "Fifth section",
      "Sixth section",
    ])
      expect(
        screen.getByRole("heading", { level: 6, name: title }),
      ).toBeInTheDocument();
    expect(
      screen.getByText(/You are reading a fixed problem version/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/historical version/)).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Open current published version" }),
    ).toHaveAttribute(
      "href",
      `/problems/detail?problemId=${problem.problemRef.problemId}`,
    );
  });

  it("labels each sample scroll region and localizes the fixed version explanation", () => {
    document.cookie = "codestartrack_locale=zh-CN; Path=/";
    render(
      <LocaleProvider initialLocale="zh-CN">
        <ProblemStatement problem={v02Problems[0]} historical />
      </LocaleProvider>,
    );
    expect(screen.getByText(/正在查看固定题目版本/)).toBeInTheDocument();
    for (const label of ["样例 1 · 样例输入", "样例 1 · 样例输出"]) {
      const sample = screen.getByRole("region", { name: label });
      expect(sample).toHaveAttribute("tabindex", "0");
      expect(sample).toHaveClass("focus-visible:outline-ring");
    }
  });
});
