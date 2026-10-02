import "server-only";
import { translate } from "./locale";

// Static HTML defaults to zh-CN. The client restores the saved display preference.
export async function getLocale() {
  return "zh-CN" as const;
}
export async function localizedMetadata(
  page: "home" | "dashboard" | "profile" | "practice",
) {
  return {
    title: translate("zh-CN", `metadata.${page}Title`),
    description: translate("zh-CN", "metadata.description"),
  };
}
