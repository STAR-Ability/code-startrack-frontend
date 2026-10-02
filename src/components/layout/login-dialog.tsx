"use client";
import Link from "next/link";
import { useLocale } from "./locale-provider";
import { buttonVariants } from "@/components/ui/button";

// Preserve the established entry component while replacing the old placeholder.
export function LoginDialog() {
  const { t } = useLocale();
  return (
    <Link
      href="/login"
      prefetch={false}
      className={buttonVariants({ variant: "ghost" })}
    >
      {t("auth.login")}
    </Link>
  );
}
