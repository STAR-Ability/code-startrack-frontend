import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { chartPalettes } from "@/lib/charts/theme";
import { verdictTone } from "@/lib/ui/status";
import { StoryFrame, mobile } from "./helpers";

function Tokens() {
  return (
    <StoryFrame>
      <header className="space-y-2">
        <p className="section-kicker">codeStartrack · UI foundations</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Quiet surfaces. Meaningful color.
        </h1>
        <p className="text-muted-foreground">
          Neutral structure, white cards and a small set of semantic accents.
          Change the toolbar theme to inspect the same tokens in dark mode.
        </p>
      </header>
      <section
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        aria-label="Semantic color tokens"
      >
        {[
          ["info", "Core data"],
          ["success", "Accepted / growth"],
          ["warning", "Pending / stale"],
          ["insight", "Ability dimensions"],
          ["support", "Supporting data"],
          ["danger", "Failure / decline"],
        ].map(([tone, label]) => (
          <Card key={tone} interaction="none">
            <CardContent className="space-y-3">
              <div
                className="h-20 rounded-lg border"
                style={{ background: `var(--${tone}-soft)` }}
              />
              <h2
                className="font-medium"
                style={{
                  color: `var(--${tone === "danger" ? "destructive" : tone})`,
                }}
              >
                {label}
              </h2>
              <code className="text-xs text-muted-foreground">
                --{tone}-soft
              </code>
            </CardContent>
          </Card>
        ))}
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-medium">Status semantics</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(verdictTone).map(([label, variant]) => (
            <Badge key={label} variant={variant}>
              {label}
            </Badge>
          ))}
        </div>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-medium">Chart palettes</h2>
        {Object.entries(chartPalettes).map(([name, palette]) => (
          <div className="flex flex-wrap items-center gap-3" key={name}>
            <code className="w-28 text-sm">{name}</code>
            {palette.map((token) => (
              <span
                key={token}
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs"
              >
                <span
                  aria-hidden="true"
                  className="size-3 rounded-full"
                  style={{ background: `var(${token})` }}
                />
                {token}
              </span>
            ))}
          </div>
        ))}
      </section>
      <p className="text-sm text-muted-foreground">
        Use surface and raised shadow tokens. Decorative motion is bounded;
        reduced-motion removes transforms. Never use color as the only status
        label.
      </p>
    </StoryFrame>
  );
}
const meta = {
  title: "Foundations/DesignTokens",
  component: Tokens,
  parameters: {
    docs: {
      description: {
        component:
          "Living documentation of globals.css and the production chart/status mappings. This page reads the tokens directly instead of maintaining a second palette.",
      },
    },
  },
} satisfies Meta<typeof Tokens>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Dark: Story = { globals: { theme: "dark" } };
export const Mobile: Story = { globals: mobile };
