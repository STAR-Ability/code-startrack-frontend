"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { usePathname } from "next/navigation";
import {
  saveLocale,
  translate,
  resolveLocale,
  LOCALE_COOKIE,
  type Locale,
} from "@/lib/i18n/locale";

const LocaleContext = createContext<{
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (
    key: Parameters<typeof translate>[1],
    parameters?: Record<string, string>,
  ) => string;
} | null>(null);

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const savedLocale = useSyncExternalStore(
    () => () => {},
    () => {
      try {
        return resolveLocale(
          document.cookie
            .split("; ")
            .find((value) => value.startsWith(`${LOCALE_COOKIE}=`))
            ?.split("=")[1],
        );
      } catch {
        return initialLocale;
      }
    },
    () => initialLocale,
  );
  const [chosenLocale, setLocaleState] = useState<Locale | null>(null);
  const locale = chosenLocale ?? savedLocale;
  const [announcement, setAnnouncement] = useState("");
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.lang = locale;
    const fallbackTitle = translate(
      locale,
      pathname === "/profile"
        ? "metadata.profileTitle"
        : pathname === "/practice"
          ? "metadata.practiceTitle"
          : pathname === "/dashboard"
            ? "metadata.dashboardTitle"
            : "metadata.homeTitle",
    );
    const routeTitles = {
      "/problems": "v02.problems",
      "/problems/detail": "v02.problemDetail",
      "/submissions": "v02.submissions",
      "/submissions/detail": "v02.submissionDetail",
      "/training": "v02.training",
      "/training/detail": "v02.trainingDetail",
      "/learning-profile": "v02.learningProfile",
      "/learning-recommendations": "v02.learningRecommendations",
      "/product": "showcase.features.label",
      "/product/profile": "showcase.profile.label",
      "/product/recommendations": "showcase.recommendations.label",
      "/about": "showcase.about.label",
      "/data": "v.data",
      "/teams": "v12.teams",
      "/teams/detail": "v12.teamDetail",
      "/teams/member": "v12.memberData",
      "/privacy": "v12.privacy",
      "/notifications": "v12.notifications",
      "/coach": "v12.coach",
      "/coach/teams": "v12.manage",
      "/coach/teams/create": "v12.createTeam",
      "/security/coach": "v12.redeem",
      "/accounts/analysis": "v.analysis",
      "/accounts/profile": "v.profile",
      "/analysis": "v.analysis",
      "/accounts": "v.accounts",
      "/security": "v.security",
      "/security/password": "v.changePassword",
      "/security/email": "v.changeEmail",
      "/login": "auth.login",
      "/register": "v.register",
      "/reset-password": "v.resetPassword",
      "/demo": "v.demoTitle",
    } as const;
    const routeTitle = routeTitles[pathname as keyof typeof routeTitles];
    const title = routeTitle
      ? `${translate(locale, routeTitle)} | ${translate(locale, "brand.name")}`
      : fallbackTitle;
    const description = translate(locale, "metadata.description");
    function syncMetadata() {
      if (document.title !== title) document.title = title;
      const meta = document.querySelector('meta[name="description"]');
      if (meta && meta.getAttribute("content") !== description) {
        meta.setAttribute("content", description);
      }
    }
    syncMetadata();
    // Next may apply the static default metadata during navigation. The
    // current display preference must still own the visible metadata.
    const observer = new MutationObserver(syncMetadata);
    observer.observe(document.head, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["content"],
    });
    return () => observer.disconnect();
  }, [locale, pathname]);

  function setLocale(next: Locale) {
    if (next === locale) return;
    const saved = saveLocale(next);
    setLocaleState(next);
    setAnnouncement(
      saved
        ? translate(next, "language.changed", {
            language: next === "en" ? "English" : "简体中文",
          })
        : translate(next, "language.notSaved"),
    );
  }

  return (
    <LocaleContext
      value={{
        locale,
        setLocale,
        t: (key, parameters) => translate(locale, key, parameters),
      }}
    >
      {children}
      <p className="sr-only" role="status">
        {announcement}
      </p>
    </LocaleContext>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("LocaleProvider is required");
  return context;
}
