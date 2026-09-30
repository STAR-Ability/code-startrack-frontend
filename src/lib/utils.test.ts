import { expect, test } from "vitest";

import { cn } from "@/lib/utils";

test("combines conditional classes and resolves Tailwind conflicts", () => {
  expect(cn("px-2", false && "hidden", { "font-semibold": true }, "px-4")).toBe(
    "font-semibold px-4",
  );
});
