import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/components/layout/locale-provider";
import { translate } from "@/lib/i18n/locale";
import { SharedProfileView, SharedTrainingView } from "./team-member-page";

vi.mock("next/navigation", () => ({ usePathname: () => "/teams/member" }));

describe.each(["en", "zh-CN"] as const)(
  "empty shared member data in %s",
  (locale) => {
    it.each([SharedTrainingView, SharedProfileView])(
      "shows an explicit empty state for an authorized null snapshot",
      (View) => {
        document.cookie = `codestartrack_locale=${locale}; Path=/`;
        render(
          <LocaleProvider initialLocale={locale}>
            <View data={null} />
          </LocaleProvider>,
        );
        expect(
          screen.getByText(translate(locale, "v.noAnalysis")),
        ).toBeVisible();
        expect(screen.queryByRole("img")).not.toBeInTheDocument();
      },
    );
  },
);
