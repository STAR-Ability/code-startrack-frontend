import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { ChoiceSelect } from "./choice-select";

it("associates optional help without changing the select's accessible name", () => {
  const view = (described: boolean) => (
    <>
      <label htmlFor="sharing">Basic training data</label>
      <p id="sharing-description">Training summary and practice statistics.</p>
      <ChoiceSelect
        id="sharing"
        value="PRIVATE"
        onValueChange={() => {}}
        options={[{ value: "PRIVATE", label: "Only me" }]}
        aria-describedby={described ? "sharing-description" : undefined}
      />
    </>
  );
  const { rerender } = render(view(true));
  const select = screen.getByRole("combobox", { name: "Basic training data" });
  expect(select).toHaveAccessibleDescription(
    "Training summary and practice statistics.",
  );

  rerender(view(false));
  expect(screen.getByRole("combobox", { name: "Basic training data" })).toBe(
    select,
  );
  expect(select).not.toHaveAttribute("aria-describedby");
});
