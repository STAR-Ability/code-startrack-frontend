import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent } from "storybook/test";
import { useLocale } from "@/components/layout/locale-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { FormInput } from "@/components/ui/form-input";
import { Spinner } from "@/components/ui/spinner";
import { chartPalettes } from "@/lib/charts/theme";
import { verdictTone } from "@/lib/ui/status";
import { cn } from "@/lib/utils";
import { StoryFrame, mobile } from "./helpers";

const copy = {
  "zh-CN": {
    title: "清晰的证据，有序的训练",
    description:
      "同一套生产组件、字体与语义变量。切换语言、主题和视口，检查层次、长文本与真实交互状态。所有内容均为本地示例。",
    colors: "语义色彩",
    tones: [
      "指引与账号",
      "已完成",
      "待处理与过期",
      "能力证据",
      "团队训练",
      "错误与失败",
    ],
    surfaces: "阅读、证据与辅助层次",
    surfaceNames: ["阅读内容", "简洁指标", "辅助上下文"],
    status: "状态同时通过文字表达",
    palettes: "生产图表配色",
    type: "字体与信息层次",
    hero: "从练习记录，到下一步方向",
    publicSection: "让训练证据更容易理解",
    page: "个人训练概览",
    section: "下一步练习方向",
    body: "先看方向，再看准确的证据。来源、时间与历史记录保持可访问，不让辅助信息遮住主要任务。",
    metadata: "本地合成示例 · 最近 30 天 · 查看完整来源",
    numeric: "示例提交数量",
    density: "密度与控件高度",
    densityNames: ["紧凑", "标准", "舒适"],
    account: "练习账号",
    action: "开始练习",
    densityHelp:
      "高度由生产组件的 density 属性控制；长文字可换行，触控区域需在真实设备布局中检查。",
    shape: "圆角与高度层次",
    elevationNames: ["辅助行：无阴影", "普通阅读区域", "少量强调的展示区域"],
    passive: "这些容器没有点击行为，悬停时保持稳定。操作仅由内部按钮提供反馈。",
    states: "键盘焦点与等待状态",
    focus: "继续查看训练记录",
    pending: "正在保存共享设置…",
    pendingHelp: "等待期间保留完整操作名称，通过文字解释状态，避免重复提交。",
    disabled: "暂不可用",
    field: "账号显示名称",
    error: "请输入有效的账号显示名称。",
    long: "长内容与双语换行",
    longAction: "查看该训练账号最近三十天内的完整提交记录与练习建议",
    longLabel: "团队训练记录与能力画像的独立共享权限说明",
    longHint:
      "共享权限按领域分别设置。辅助说明应完整显示，不能仅靠省略号或悬停提示提供必要信息。",
  },
  en: {
    title: "Clear evidence. Deliberate practice.",
    description:
      "Production components, typography and semantic variables in one place. Change language, theme and viewport to inspect hierarchy, long content and real interaction states. All content is a local sample.",
    colors: "Semantic color",
    tones: [
      "Guidance and accounts",
      "Completed",
      "Pending and stale",
      "Ability evidence",
      "Team training",
      "Errors and failures",
    ],
    surfaces: "Reading, evidence and supporting context",
    surfaceNames: ["Reading content", "Concise metrics", "Supporting context"],
    status: "Statuses retain text labels",
    palettes: "Production chart palettes",
    type: "Typography and information hierarchy",
    hero: "From practice records to your next direction",
    publicSection: "Make training evidence easier to understand",
    page: "Personal training overview",
    section: "Your next practice direction",
    body: "Read the direction, then the exact evidence. Sources, time context and history remain accessible without giving supporting information the weight of the primary task.",
    metadata: "Local synthetic sample · Last 30 days · View complete sources",
    numeric: "Sample submission count",
    density: "Control density and height",
    densityNames: ["Dense", "Standard", "Comfortable"],
    account: "Practice account",
    action: "Start practice",
    densityHelp:
      "The production density prop owns control height. Long labels can wrap; effective touch areas still need review in the real device layout.",
    shape: "Radius and elevation roles",
    elevationNames: [
      "Supporting row: no shadow",
      "Ordinary reading surface",
      "One deliberately emphasized exhibit",
    ],
    passive:
      "These containers have no click action and stay still on hover. Their buttons own interaction feedback.",
    states: "Keyboard focus and pending states",
    focus: "Continue to training records",
    pending: "Saving sharing preferences…",
    pendingHelp:
      "Keep the complete action label while waiting, explain progress in text and prevent duplicate submission.",
    disabled: "Currently unavailable",
    field: "Account display name",
    error: "Enter a valid account display name.",
    long: "Long content and bilingual wrapping",
    longAction:
      "View this training account’s complete submission history and practice recommendations for the last thirty days",
    longLabel:
      "Independent sharing permissions for team training records and ability profiles",
    longHint:
      "Each data domain has its own sharing preference. Necessary guidance stays fully readable rather than depending on truncated text or hover-only help.",
  },
} as const;

function useCopy() {
  return copy[useLocale().locale];
}

function FoundationHeader({ title }: { title: string }) {
  const c = useCopy();
  return (
    <header className="flex flex-col gap-3">
      <p className="meta-label">codeStartrack · UI foundations</p>
      <h1 className="page-title">{title}</h1>
      <p className="max-w-reading text-sm text-muted-foreground">
        {c.description}
      </p>
    </header>
  );
}

function SurfaceSpecimens() {
  const c = useCopy();
  return (
    <section className="flex flex-col gap-4" aria-label={c.surfaces}>
      <h2 className="section-heading">{c.surfaces}</h2>
      <div className="grid min-w-0 gap-4 sm:grid-cols-3">
        {(["default", "metric", "supporting"] as const).map(
          (variant, index) => (
            <Card key={variant} variant={variant} interaction="none">
              <CardHeader>
                <CardTitle>{c.surfaceNames[index]}</CardTitle>
                <CardDescription>
                  {
                    [
                      "--surface-reading",
                      "--surface-panel",
                      "--surface-supporting",
                    ][index]
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{c.passive}</p>
              </CardContent>
            </Card>
          ),
        )}
      </div>
    </section>
  );
}

function Tokens() {
  const c = useCopy();
  return (
    <StoryFrame>
      <FoundationHeader title={c.title} />
      <section className="flex flex-col gap-4" aria-label={c.colors}>
        <h2 className="section-heading">{c.colors}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {["info", "success", "warning", "insight", "support", "danger"].map(
            (tone, index) => (
              <Card key={tone} interaction="none">
                <CardHeader>
                  <CardTitle>{c.tones[index]}</CardTitle>
                  <CardDescription>--{tone}-soft</CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    className="h-16 rounded-lg border"
                    style={{ background: `var(--${tone}-soft)` }}
                    aria-hidden="true"
                  />
                </CardContent>
              </Card>
            ),
          )}
        </div>
      </section>
      <SurfaceSpecimens />
      <section className="flex flex-col gap-4">
        <h2 className="section-heading">{c.status}</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(verdictTone).map(([label, variant]) => (
            <Badge key={label} variant={variant}>
              {label}
            </Badge>
          ))}
        </div>
      </section>
      <section className="flex flex-col gap-4">
        <h2 className="section-heading">{c.palettes}</h2>
        {Object.entries(chartPalettes).map(([name, palette]) => (
          <div className="flex flex-wrap items-center gap-3" key={name}>
            <code className="w-28 text-sm">{name}</code>
            {palette.map((token) => (
              <span
                key={token}
                className="inline-flex items-center gap-2 text-xs"
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
    </StoryFrame>
  );
}

function TypographySpecimens() {
  const c = useCopy();
  return (
    <StoryFrame>
      <FoundationHeader title={c.type} />
      <div className="flex flex-col gap-8">
        {[
          ["hero-title", c.hero],
          ["section-title", c.publicSection],
          ["page-title", c.page],
          ["section-heading", c.section],
        ].map(([role, sample]) => (
          <section key={role} className="flex min-w-0 flex-col gap-2">
            <code className="meta-label text-muted-foreground">.{role}</code>
            <h2 className={role}>{sample}</h2>
          </section>
        ))}
        <section className="flex flex-col gap-3">
          <p className="max-w-reading text-base leading-relaxed">{c.body}</p>
          <p className="meta-label text-muted-foreground">{c.metadata}</p>
          <dl className="flex flex-col gap-1">
            <dt className="meta-label text-muted-foreground">{c.numeric}</dt>
            <dd className="headline-number">128</dd>
          </dl>
        </section>
      </div>
    </StoryFrame>
  );
}

function DensitySpecimens() {
  const c = useCopy();
  return (
    <StoryFrame>
      <FoundationHeader title={c.density} />
      <div className="grid min-w-0 gap-6 sm:grid-cols-3">
        {(["dense", "standard", "comfortable"] as const).map(
          (density, index) => (
            <section key={density} className="flex min-w-0 flex-col gap-4">
              <h2 className="text-base font-semibold">
                {c.densityNames[index]}
              </h2>
              <code className="meta-label text-muted-foreground">
                --control-{density} · {[32, 40, 48][index]}px
              </code>
              <FieldGroup>
                <FormInput
                  label={c.account}
                  density={density}
                  defaultValue="sample_training_account"
                />
                <Button density={density}>{c.action}</Button>
              </FieldGroup>
            </section>
          ),
        )}
      </div>
      <p className="text-sm text-muted-foreground">{c.densityHelp}</p>
    </StoryFrame>
  );
}

function ShapeSpecimens() {
  const c = useCopy();
  return (
    <StoryFrame>
      <FoundationHeader title={c.shape} />
      <div className="grid min-w-0 gap-4 sm:grid-cols-4">
        {[
          ["md", "rounded-md"],
          ["lg", "rounded-lg"],
          ["xl", "rounded-xl"],
          ["2xl", "rounded-2xl"],
        ].map(([radius, radiusClass]) => (
          <div
            key={radius}
            className={cn(
              "flex h-24 min-w-0 items-center justify-center border border-input bg-surface-reading",
              radiusClass,
            )}
          >
            <code className="meta-label">--radius-{radius}</code>
          </div>
        ))}
      </div>
      <div className="grid min-w-0 gap-4 sm:grid-cols-3">
        {["shadow-none", "shadow-surface", "shadow-raised"].map(
          (shadow, index) => (
            <Card key={shadow} interaction="none" className={shadow}>
              <CardHeader>
                <CardTitle>{c.elevationNames[index]}</CardTitle>
                <CardDescription>{shadow}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{c.passive}</p>
              </CardContent>
            </Card>
          ),
        )}
      </div>
      <SurfaceSpecimens />
    </StoryFrame>
  );
}

function InteractionSpecimens() {
  const c = useCopy();
  return (
    <StoryFrame>
      <FoundationHeader title={c.states} />
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="outline" data-foundation-focus wrap>
          {c.focus}
        </Button>
        <Button disabled aria-busy="true" data-foundation-pending wrap>
          <Spinner aria-hidden="true" />
          {c.pending}
        </Button>
        <Button variant="outline" disabled wrap>
          {c.disabled}
        </Button>
      </div>
      <p role="status" className="text-sm text-muted-foreground">
        {c.pendingHelp}
      </p>
      <FieldGroup className="max-w-form">
        <FormInput label={c.field} error={c.error} defaultValue=" " />
      </FieldGroup>
    </StoryFrame>
  );
}

function LongContentSpecimens() {
  const c = useCopy();
  return (
    <StoryFrame>
      <FoundationHeader title={c.long} />
      <Card size="sm" interaction="none">
        <CardHeader>
          <CardTitle titleRole="section">
            <h2>{c.longLabel}</h2>
          </CardTitle>
          <CardDescription>{c.longHint}</CardDescription>
        </CardHeader>
        <CardContent className="flex min-w-0 flex-col gap-4">
          <FieldGroup>
            <FormInput
              label={c.longLabel}
              hint={c.longHint}
              defaultValue="sample_training_account_with_a_long_display_name"
            />
          </FieldGroup>
          <Button wrap>{c.longAction}</Button>
          <p lang="zh-CN" className="text-sm leading-relaxed">
            {copy["zh-CN"].body}
          </p>
          <p lang="en" className="text-sm leading-relaxed">
            {copy.en.body}
          </p>
        </CardContent>
      </Card>
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
          "Living documentation of production globals.css, components and chart/status mappings. Typography, density, radius, elevation and interaction specimens share the application's locale and theme providers; no second palette or primitive system is maintained.",
      },
    },
  },
} satisfies Meta<typeof Tokens>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Dark: Story = { globals: { theme: "dark" } };
export const Mobile: Story = { globals: mobile };
export const English: Story = { globals: { locale: "en" } };
export const Typography: Story = { render: () => <TypographySpecimens /> };
export const ControlDensity: Story = { render: () => <DensitySpecimens /> };
export const RadiusAndElevation: Story = { render: () => <ShapeSpecimens /> };
export const FocusAndPending: Story = {
  render: () => <InteractionSpecimens />,
  play: async ({ canvasElement }) => {
    await userEvent.tab();
    await expect(
      canvasElement.querySelector("[data-foundation-focus]"),
    ).toHaveFocus();
    await expect(
      canvasElement.querySelector("[data-foundation-pending]"),
    ).toBeDisabled();
  },
};
export const LongContent: Story = { render: () => <LongContentSpecimens /> };
export const LongContentEnglishMobile: Story = {
  ...LongContent,
  globals: { ...mobile, locale: "en" },
};
