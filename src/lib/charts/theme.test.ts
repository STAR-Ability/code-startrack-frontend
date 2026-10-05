import { afterEach, describe, expect, it, vi } from "vitest";
import { chartTheme } from "./theme";

afterEach(() => vi.restoreAllMocks());

function styles(values: Record<string, string>) {
  const element = document.createElement("div");
  for (const [name, value] of Object.entries(values))
    element.style.setProperty(name, value);
  return element.style;
}

describe("semantic chart theme", () => {
  it("distinguishes active members from pending submission warnings", () => {
    const tokens = styles({
      "--info": "#315fd3",
      "--success": "#187347",
      "--warning": "#946014",
      "--support": "#22756f",
    });
    expect(chartTheme(tokens, "activity").color).toEqual([
      "#315fd3",
      "#187347",
      "#946014",
    ]);
    expect(chartTheme(tokens, "teamActivity").color).toEqual([
      "#315fd3",
      "#187347",
      "#22756f",
    ]);
  });

  it("converts modern CSS colors to ECharts-compatible RGBA while preserving alpha", () => {
    const context = {
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      fillStyle: "",
      getImageData: vi.fn(() => ({
        data: new Uint8ClampedArray([246, 246, 246, 26]),
      })),
    };
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      context as unknown as CanvasRenderingContext2D,
    );
    const theme = chartTheme(
      styles({ "--border": "oklch(1 0 0 / 10%)" }),
      "core",
    );
    expect(context.fillStyle).toBe("oklch(1 0 0 / 10%)");
    expect(theme.tooltip.borderColor).toBe(`rgba(246,246,246,${26 / 255})`);
    expect(context.clearRect).toHaveBeenCalledWith(0, 0, 1, 1);
  });
});
