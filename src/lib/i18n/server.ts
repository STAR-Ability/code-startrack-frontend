import "server-only";

import { cookies } from "next/headers";
import { LOCALE_COOKIE, resolveLocale, translate } from "./locale";

export async function getLocale() {
  return resolveLocale((await cookies()).get(LOCALE_COOKIE)?.value);
}

export async function localizedMetadata(
  page: "home" | "dashboard" | "profile" | "practice",
) {
  const locale = await getLocale();
  return {
    title: translate(locale, `metadata.${page}Title`),
    description: translate(locale, "metadata.description"),
  };
}
