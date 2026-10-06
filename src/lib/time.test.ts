import { describe, expect, it } from "vitest";
import { instantSchema } from "@/lib/api/schemas";
import { compareInstants } from "./time";

describe("compareInstants", () => {
  it.each([
    ["2026-10-06T03:00:00.000100Z", "2026-10-06T03:00:00.000900Z", -1],
    [
      "2026-10-06T03:00:00.0009000000000000000001Z",
      "2026-10-06T03:00:00.0009000000000000000002Z",
      -1,
    ],
    ["2026-10-06T03:00:00.12Z", "2026-10-06T03:00:00.120001Z", -1],
    ["2026-10-06T03:00:00.1Z", "2026-10-06T03:00:00.100000Z", 0],
    ["2026-10-06T03:00:00Z", "2026-10-06T03:00:00.000Z", 0],
    ["2026-10-06T03:00:00.999999Z", "2026-10-06T03:00:01Z", -1],
    ["2026-10-06T23:59:59.999999Z", "2026-10-07T00:00:00Z", -1],
    ["0000-01-01T00:00:00Z", "9999-12-31T23:59:59.999999Z", -1],
  ] as const)("compares %s and %s exactly", (left, right, expected) => {
    expect(
      compareInstants(instantSchema.parse(left), instantSchema.parse(right)),
    ).toBe(expected);
    expect(compareInstants(right, left)).toBe(expected === 0 ? 0 : 1);
  });
});
