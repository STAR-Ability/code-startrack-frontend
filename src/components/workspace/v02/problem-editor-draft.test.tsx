import { act, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/components/layout/locale-provider";
import { demoUser, fixtureUuid } from "@/lib/demo/fixtures";
import { v02Languages, v02Problems } from "@/lib/demo/v02-fixtures";
import { keys } from "@/lib/query/keys";
import { ProblemEditor } from "./problem-editor";
import { problemDraftKey } from "./problem-state";
import type { PlatformProblemDetail } from "@/lib/api/v02-schemas";

const editor = vi.hoisted(() => ({
  onChange: undefined as ((source: string) => void) | undefined,
}));
vi.mock("next/navigation", () => ({
  usePathname: () => "/problems/detail",
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("../account-provider", async () => {
  const { demoUser } = await import("@/lib/demo/fixtures");
  return { useWorkspaceSession: () => ({ data: demoUser }) };
});
vi.mock("./code-editor", () => ({
  CodeEditor: ({
    source,
    onChange,
  }: {
    source: string;
    onChange: (source: string) => void;
  }) => {
    editor.onChange = onChange;
    return <textarea aria-label="Source code" value={source} readOnly />;
  },
}));

beforeEach(() => {
  editor.onChange = undefined;
  document.cookie = "codestartrack_locale=en; Path=/";
});

function renderEditor(prepare?: (client: QueryClient) => void) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  client.setQueryData(keys.session, demoUser);
  prepare?.(client);
  const tree = (problem: PlatformProblemDetail) => (
    <QueryClientProvider client={client}>
      <LocaleProvider initialLocale="en">
        <ProblemEditor
          problem={problem}
          capabilities={v02Languages}
          refreshProblem={vi.fn()}
          refreshLanguages={vi.fn()}
        />
      </LocaleProvider>
    </QueryClientProvider>
  );
  const result = render(tree(v02Problems[0]));
  return {
    client,
    rerenderProblem: (problem: PlatformProblemDetail) =>
      result.rerender(tree(problem)),
  };
}

describe("editor draft ownership", () => {
  it("saves exact external editor transactions before compiler changes commit", () => {
    const { client } = renderEditor();
    const input = screen.getByRole("textbox", { name: "Source code" });
    const compiler = screen.getByRole("combobox", {
      name: "Compiler language",
    });
    const cppKey = problemDraftKey(demoUser.publicId, v02Problems[0], "cpp17");
    const cKey = problemDraftKey(demoUser.publicId, v02Problems[0], "c11");
    const cppSource = "  int cppDraft = 1;\n\n";
    const cSource = "  /* C: 练 */\n";
    act(() => {
      editor.onChange!(cppSource);
      expect(client.getQueryData(cppKey)).toBe(cppSource);
      fireEvent.change(compiler, { target: { value: "c11" } });
    });
    expect(input).toHaveValue("");
    act(() => {
      editor.onChange!(cSource);
      expect(client.getQueryData(cKey)).toBe(cSource);
      fireEvent.change(compiler, { target: { value: "cpp17" } });
    });
    expect(input).toHaveValue(cppSource);
    expect(client.getQueryData(cppKey)).toBe(cppSource);
    fireEvent.change(compiler, { target: { value: "c11" } });
    expect(input).toHaveValue(cSource);
    expect(client.getQueryData(cKey)).toBe(cSource);
  });

  it("restores existing drafts and carries the current source into a refreshed version", () => {
    const source = "  // current source: 练\n";
    const { client, rerenderProblem } = renderEditor((client) => {
      client.setQueryData(
        problemDraftKey(demoUser.publicId, v02Problems[0], "cpp17"),
        source,
      );
    });
    const input = screen.getByRole("textbox", { name: "Source code" });
    expect(input).toHaveValue(source);
    const nextProblem = {
      ...v02Problems[0],
      problemRef: {
        ...v02Problems[0].problemRef,
        problemVersionId: fixtureUuid(2999),
      },
    };
    const nextKey = problemDraftKey(demoUser.publicId, nextProblem, "cpp17");
    client.setQueryData(nextKey, "// previously opened next version\n");
    rerenderProblem(nextProblem);
    expect(input).toHaveValue(source);
    expect(client.getQueryData(nextKey)).toBe(source);
  });

  it.each(["logout", "another user"])(
    "does not restore private drafts after %s",
    (change) => {
      const { client } = renderEditor();
      client.removeQueries({ queryKey: ["private", demoUser.publicId] });
      client.setQueryData(
        keys.session,
        change === "logout"
          ? null
          : { ...demoUser, publicId: fixtureUuid(9999) },
      );
      act(() => {
        editor.onChange!("// late source event\n");
      });
      expect(
        client.getQueryCache().findAll({ queryKey: ["private"] }),
      ).toHaveLength(0);
    },
  );
});
