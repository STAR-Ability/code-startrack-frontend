import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/components/layout/locale-provider";
import type { RecommendationMode } from "@/lib/api/schemas";
import { PracticeModePicker } from "./practice-mode-picker";

vi.mock("next/navigation", () => ({ usePathname: () => "/practice" }));

beforeEach(() => {
  document.cookie = "codestartrack_locale=en; Path=/";
});

function ControlledPicker({
  compact = false,
  disabled = false,
  onChange,
}: {
  compact?: boolean;
  disabled?: boolean;
  onChange: (mode: RecommendationMode) => void;
}) {
  const [mode, setMode] = useState<RecommendationMode>("HYBRID");
  return (
    <LocaleProvider initialLocale="en">
      <PracticeModePicker
        mode={mode}
        compact={compact}
        disabled={disabled}
        onChange={(value) => {
          onChange(value);
          setMode(value);
        }}
      />
    </LocaleProvider>
  );
}

function expectSelected(name: string) {
  const selected = screen
    .getAllByRole("button")
    .filter((button) => button.getAttribute("aria-pressed") === "true");
  expect(selected).toEqual([screen.getByRole("button", { name })]);
}

describe("practice mode selection", () => {
  it.each([false, true])(
    "keeps exactly one selection when the current mode is pressed with compact=%s",
    (compact) => {
      const onChange = vi.fn();
      render(<ControlledPicker compact={compact} onChange={onChange} />);

      expect(screen.getAllByRole("button")).toHaveLength(3);
      expectSelected("Hybrid");
      fireEvent.click(screen.getByRole("button", { name: "Hybrid" }));
      expect(onChange).not.toHaveBeenCalled();
      expectSelected("Hybrid");

      fireEvent.click(
        screen.getByRole("button", { name: "Weakness practice" }),
      );
      expect(onChange).toHaveBeenCalledOnce();
      expect(onChange).toHaveBeenCalledWith("WEAKNESS");
      expectSelected("Weakness practice");
      fireEvent.click(
        screen.getByRole("button", { name: "Weakness practice" }),
      );
      expect(onChange).toHaveBeenCalledTimes(1);
      expectSelected("Weakness practice");

      fireEvent.click(screen.getByRole("button", { name: "Level match" }));
      expect(onChange).toHaveBeenNthCalledWith(2, "LEVEL");
      expectSelected("Level match");
    },
  );

  it.each([false, true])(
    "prevents changes while disabled with compact=%s",
    (compact) => {
      const onChange = vi.fn();
      render(
        <ControlledPicker compact={compact} disabled onChange={onChange} />,
      );

      for (const button of screen.getAllByRole("button")) {
        expect(button).toBeDisabled();
        fireEvent.click(button);
      }
      expect(onChange).not.toHaveBeenCalled();
      expectSelected("Hybrid");
    },
  );

  it("announces the selected description in its default presentation", () => {
    render(<ControlledPicker onChange={vi.fn()} />);

    const description = screen.getByText(
      "Balance difficulty and weaker topics to build momentum.",
    );
    expect(description).toHaveAttribute("aria-live", "polite");
    fireEvent.click(screen.getByRole("button", { name: "Weakness practice" }));
    expect(description).toHaveTextContent(
      "Focus your practice on topics with room for improvement.",
    );
  });

  it("leaves the selected description to the parent guide in compact presentation", () => {
    render(<ControlledPicker compact onChange={vi.fn()} />);

    expect(
      screen.queryByText(
        "Balance difficulty and weaker topics to build momentum.",
      ),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Weakness practice" }));
    expectSelected("Weakness practice");
    expect(
      screen.queryByText(
        "Focus your practice on topics with room for improvement.",
      ),
    ).not.toBeInTheDocument();
  });
});
