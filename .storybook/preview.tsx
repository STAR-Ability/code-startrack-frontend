import { useEffect, useState, type ReactNode } from "react";
import type { Preview } from "@storybook/nextjs-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import localFont from "next/font/local";
import {
  LocaleProvider,
  useLocale,
} from "../src/components/layout/locale-provider";
import { TooltipProvider } from "../src/components/ui/tooltip";
import { Toaster } from "../src/components/ui/toast";
import { resolveLocale, type Locale } from "../src/lib/i18n/locale";
import "../src/app/globals.css";
import { installStoryScenario } from "../stories/mock/request-interceptor";

const sans = localFont({
  src: "./fonts/geist-latin.woff2",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap",
});
const mono = localFont({
  src: "./fonts/geist-mono-latin.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
});

function Appearance({ locale, theme }: { locale: Locale; theme: string }) {
  const { setLocale } = useLocale();
  useEffect(() => {
    setLocale(locale);
  }, [locale, setLocale]);
  useEffect(() => {
    document.documentElement.classList.add(sans.variable, mono.variable);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);
  return null;
}

function Providers({
  children,
  locale,
  theme,
}: {
  children: ReactNode;
  locale: Locale;
  theme: string;
}) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false, refetchOnWindowFocus: false },
          mutations: { retry: false },
        },
      }),
  );
  useEffect(() => () => client.clear(), [client]);
  return (
    <LocaleProvider initialLocale={locale}>
      <Appearance locale={locale} theme={theme} />
      <TooltipProvider delay={350}>
        <Toaster>
          <QueryClientProvider client={client}>{children}</QueryClientProvider>
        </Toaster>
      </TooltipProvider>
    </LocaleProvider>
  );
}

const preview: Preview = {
  tags: ["autodocs"],
  loaders: [
    (context) => {
      installStoryScenario(context.parameters.mockScenario);
      return {};
    },
  ],
  globalTypes: {
    locale: {
      description: "Product language",
      toolbar: {
        icon: "globe",
        items: [
          { value: "zh-CN", title: "简体中文" },
          { value: "en", title: "English" },
        ],
        dynamicTitle: true,
      },
    },
    theme: {
      description: "Semantic token theme",
      toolbar: {
        icon: "circlehollow",
        items: ["light", "dark"],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { locale: "zh-CN", theme: "light" },
  parameters: {
    nextjs: { appDirectory: true },
    layout: "padded",
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    a11y: { test: "error" },
    viewport: {
      options: {
        mobile: {
          name: "Mobile · 390px",
          styles: { width: "390px", height: "844px" },
          type: "mobile",
        },
        compact: {
          name: "Compact · 320px",
          styles: { width: "320px", height: "720px" },
          type: "mobile",
        },
        desktop: {
          name: "Desktop · 1440px",
          styles: { width: "1440px", height: "900px" },
          type: "desktop",
        },
      },
    },
    options: {
      storySort: { order: ["Foundations", "Primitives", "Workspace"] },
    },
  },
  decorators: [
    (Story, context) => (
      <Providers
        key={context.id}
        locale={resolveLocale(context.globals.locale)}
        theme={context.globals.theme === "dark" ? "dark" : "light"}
      >
        <Story />
      </Providers>
    ),
  ],
};

export default preview;
