"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  useIsFetching,
  useQueryClient,
  type Query,
} from "@tanstack/react-query";
import { CheckIcon, RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "@/components/ui/toast";
import { useLocale } from "@/components/layout/locale-provider";
import { isCurrentUser } from "@/lib/query/session";

export function RefreshButton({
  publicId,
  accountId,
}: {
  publicId: string;
  accountId: string | null;
}) {
  const client = useQueryClient();
  const { t } = useLocale();
  const noticeId = useId();
  const mounted = useRef(false);
  const inFlight = useRef(false);
  const [pending, setPending] = useState(false);
  const [updated, setUpdated] = useState(false);
  const predicate = useCallback(
    (query: Query) => {
      const key = query.queryKey;
      if (key[0] === "session") return true;
      if (key[0] !== "private" || key[1] !== publicId) return false;
      return (
        key[2] === "accounts" ||
        key[2] === "roles" ||
        (key[2] === "account" && key[3] === accountId)
      );
    },
    [publicId, accountId],
  );
  const fetching = useIsFetching({ type: "active", predicate });
  const busy = pending || fetching > 0;
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      toast.close(noticeId);
    };
  }, [noticeId]);
  useEffect(() => {
    if (!updated) return;
    const timer = setTimeout(() => setUpdated(false), 2000);
    return () => clearTimeout(timer);
  }, [updated]);
  async function refresh() {
    if (busy || inFlight.current || !isCurrentUser(client, publicId)) return;
    inFlight.current = true;
    setPending(true);
    setUpdated(false);
    toast.close(noticeId);
    try {
      // Only mounted reads: never prefetch another account or create sync/recommendation jobs.
      await client.refetchQueries(
        { type: "active", predicate },
        { throwOnError: true, cancelRefetch: false },
      );
      if (!mounted.current || !isCurrentUser(client, publicId)) return;
      setUpdated(true);
      toast.add({
        id: noticeId,
        type: "success",
        title: t("interaction.refreshed"),
        description: t("interaction.refreshComplete"),
        timeout: 3000,
      });
    } catch {
      // The query's own feedback presents its error/empty state and retry policy.
    } finally {
      inFlight.current = false;
      if (mounted.current) setPending(false);
    }
  }
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            aria-busy={busy}
            aria-label={t("interaction.refresh")}
            onClick={() => void refresh()}
          />
        }
      >
        {busy ? (
          <Spinner data-icon="inline-start" aria-hidden="true" />
        ) : updated ? (
          <CheckIcon
            data-icon="inline-start"
            aria-hidden="true"
            className="motion-safe:animate-in motion-safe:zoom-in-75 motion-safe:duration-200"
          />
        ) : (
          <RefreshCwIcon data-icon="inline-start" aria-hidden="true" />
        )}
        {t(updated && !busy ? "interaction.refreshed" : "interaction.refresh")}
      </TooltipTrigger>
      <TooltipContent>{t("interaction.refreshHint")}</TooltipContent>
    </Tooltip>
  );
}
