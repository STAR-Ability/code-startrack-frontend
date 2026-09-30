import { describe, expect, test } from "vitest";
import { en, zhCN } from "./messages";
import {
  formatNumber,
  formatTimestamp,
  resolveLocale,
  translate,
} from "./locale";

describe("bilingual presentation", () => {
  test("keeps copy keys and interpolation parameters aligned", () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(zhCN).sort());
    for (const key of Object.keys(zhCN) as (keyof typeof zhCN)[]) {
      expect(en[key].match(/\{\w+\}/g)).toEqual(zhCN[key].match(/\{\w+\}/g));
      expect(en[key].trim()).not.toBe("");
    }
    expect(
      translate("en", "recommendation.openExternal", {
        platform: "Codeforces",
      }),
    ).toBe("Open on Codeforces");
  });
  test("defaults unknown preferences to Chinese, without language detection", () => {
    for (const value of [undefined, "", "fr", "en-US", "EN"])
      expect(resolveLocale(value)).toBe("zh-CN");
    expect(resolveLocale("en")).toBe("en");
  });
  test("formats metrics without changing numeric meaning", () => {
    expect(formatNumber(0, "zh-CN")).toBe("0");
    expect(formatNumber(1234.567, "en", 1)).toBe("1,234.6");
  });
  test("uses UTC only for explicit offsets and preserves unspecified wall-clock time", () => {
    expect(formatTimestamp("2026-01-03T04:05:06+08:00", "en")).toBe(
      formatTimestamp("2026-01-02T20:05:06Z", "en"),
    );
    expect(formatTimestamp("2026-01-03T04:05:06.123", "en")).toBe(
      "2026-01-03 04:05:06.123 · Time zone not provided",
    );
    expect(formatTimestamp("2026-01-03T04:05:06Z", "zh-CN")).toContain("UTC");
  });
});
