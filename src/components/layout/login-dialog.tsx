"use client";

import Link from "next/link";
import { ArrowRightIcon, LockKeyholeIcon, XIcon } from "lucide-react";
import { useLocale } from "./locale-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export function LoginDialog() {
  const { t } = useLocale();
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="ghost" wrap />}>
        {t("auth.login")}
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="max-h-[90svh] overflow-y-auto"
      >
        <DialogClose
          render={
            <Button
              size="icon-sm"
              variant="ghost"
              className="absolute top-3 right-3"
            />
          }
          aria-label={t("auth.dismiss")}
        >
          <XIcon aria-hidden="true" />
        </DialogClose>
        <div className="flex flex-col items-start gap-5 py-4">
          <span className="flex size-12 items-center justify-center rounded-xl bg-muted">
            <LockKeyholeIcon className="size-6" aria-hidden="true" />
          </span>
          <Badge variant="secondary" wrap>
            {t("auth.unavailable")}
          </Badge>
          <DialogHeader>
            <DialogTitle>{t("auth.title")}</DialogTitle>
            <DialogDescription>{t("auth.description")}</DialogDescription>
          </DialogHeader>
          <div className="flex w-full flex-col gap-2">
            <DialogClose
              nativeButton={false}
              render={
                <Link
                  href="/practice"
                  prefetch={false}
                  className={buttonVariants({ size: "lg", wrap: true })}
                />
              }
            >
              <span className="min-w-0">{t("entry.openDemo")}</span>
              <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
            </DialogClose>
            <DialogClose render={<Button variant="ghost" wrap />}>
              {t("auth.close")}
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
