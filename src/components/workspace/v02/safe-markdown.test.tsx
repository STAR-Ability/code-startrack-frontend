import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SafeMarkdown, safeStatementUrl } from "./safe-markdown";

describe("safe complete problem Markdown", () => {
  it("escapes raw HTML and source fences without executable elements", () => {
    const { container } = render(
      <SafeMarkdown
        content={
          "# Statement\n\n<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n\n```cpp\n<img src=x onerror=alert(1)>\n```"
        }
      />,
    );
    expect(container.querySelector("script, img, iframe")).toBeNull();
    expect(container.querySelector("pre code")?.textContent).toBe(
      "<img src=x onerror=alert(1)>\n",
    );
    expect(
      screen.getByRole("heading", { name: "Statement" }),
    ).toBeInTheDocument();
  });

  it("rejects JavaScript, data, protocol-relative and control-obfuscated links", () => {
    for (const url of [
      "javascript:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "JaVaScRiPt:alert(1)",
      "java\nscript:alert(1)",
      "https://safe.example\\@evil.example",
      "//evil.example",
    ])
      expect(safeStatementUrl(url)).toBe("");
    const { container } = render(
      <SafeMarkdown
        content={
          "[unsafe](javascript:alert%281%29)\n\n[data](data:text/html;base64,AAAA)\n\n[encoded](jav&#x61;script:alert%281%29)\n\n[safe](https://example.com/task)"
        }
      />,
    );
    expect(container.querySelectorAll("a")).toHaveLength(1);
    expect(screen.getByRole("link", { name: "safe" })).toHaveAttribute(
      "href",
      "https://example.com/task",
    );
    expect(screen.getByText("unsafe")).toBeInTheDocument();
  });

  it("renders full GFM tables, nested lists, code and the final section of long statements", () => {
    const body = "All constraints remain visible. ".repeat(3000);
    const { container } = render(
      <SafeMarkdown
        content={`# Task\n\n**Important** and *emphasized* with \`x + y\`.\n\n| Input | Output |\n| --- | --- |\n| 2 3 | 5 |\n\n- outer\n  - inner\n\n${body}\n\n## Final requirements\n\nPrint the sum.`}
      />,
    );
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Input" }),
    ).toBeInTheDocument();
    expect(container.querySelector("ul ul")).not.toBeNull();
    expect(container.textContent).toContain(body.trim());
    expect(
      screen.getByRole("heading", { name: "Final requirements" }),
    ).toBeInTheDocument();
  });

  it("retains image descriptions as explicit links without automatic remote image requests", () => {
    const { container } = render(
      <SafeMarkdown content="![Graph diagram](https://example.com/diagram.png)" />,
    );
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByRole("link", { name: "Graph diagram" })).toHaveAttribute(
      "href",
      "https://example.com/diagram.png",
    );
  });

  it("makes code and table overflow keyboard reachable with named visible focus", () => {
    render(
      <SafeMarkdown
        content={
          "```cpp\nint main() {}\n```\n\n| Input | Output |\n| --- | --- |\n| 2 3 | 5 |"
        }
        codeLabel="Statement code"
        tableLabel="Statement data"
      />,
    );
    const code = screen.getByRole("region", { name: "Statement code" });
    expect(code).toHaveAttribute("tabindex", "0");
    expect(code).toHaveAttribute("aria-label", "Statement code");
    expect(code).toHaveClass("focus-visible:outline-ring");
    const tableRegion = screen.getByRole("region", { name: "Statement data" });
    expect(tableRegion).toHaveAttribute("tabindex", "0");
    expect(tableRegion).toHaveClass("focus-visible:outline-ring");
  });
});
