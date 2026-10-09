import { act, fireEvent, render, screen } from "@testing-library/react";
import { createRef, useState } from "react";
import { beforeEach, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/components/layout/locale-provider";
import { CodeEditor, type CodeEditorHandle } from "./code-editor";

vi.mock("next/navigation", () => ({ usePathname: () => "/problems/detail" }));
vi.mock("next/dynamic", () => ({
  default: () =>
    function MissingChunk() {
      throw new Error("Editor chunk unavailable");
    },
}));
beforeEach(() => {
  document.cookie = "codestartrack_locale=en; Path=/";
});

it("preserves exact source and accessible validation when the mature editor cannot load", () => {
  const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
  const ref = createRef<CodeEditorHandle>();
  const change = vi.fn();
  const initial = "  int main() {}\n\n";
  function Harness() {
    const [source, setSource] = useState(initial);
    return (
      <CodeEditor
        source={source}
        filename="main.cpp"
        inputRef={ref}
        error="Source validation"
        onChange={(value) => {
          change(value);
          setSource(value);
        }}
      />
    );
  }
  render(
    <LocaleProvider initialLocale="en">
      <Harness />
    </LocaleProvider>,
  );
  const input = screen.getByRole("textbox", { name: "Source code" });
  expect(screen.getByText(/could not load/)).toBeInTheDocument();
  expect(input).toHaveValue(initial);
  expect(input).toHaveAttribute("aria-invalid", "true");
  expect(
    document.getElementById(
      input.getAttribute("aria-describedby")!.split(" ")[1],
    )?.textContent,
  ).toBe("Source validation");
  const edited = " \n int main() { return 0; }\n  ";
  fireEvent.change(input, { target: { value: edited } });
  expect(change).toHaveBeenLastCalledWith(edited);
  expect(input).toHaveValue(edited);
  act(() => ref.current?.focus());
  expect(input).toHaveFocus();
  errorLog.mockRestore();
});
