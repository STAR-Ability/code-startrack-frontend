"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocale } from "@/components/layout/locale-provider";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { clearSession } from "@/components/training/query-provider";
import { v02 } from "@/lib/api/v02";
import { ApiError } from "@/lib/api/errors";
import type { SubmissionSource } from "@/lib/api/v02-schemas";
import { isCurrentUser } from "@/lib/query/session";
import { useWorkspaceSession } from "../account-provider";
import { ErrorNotice } from "../feedback";
import { Panel } from "../v012-shared";

export function SubmissionSourceReveal({
  submissionId,
}: {
  submissionId: string;
}) {
  const { t } = useLocale();
  const { data: user } = useWorkspaceSession();
  const client = useQueryClient();
  const id = useId();
  const request = useRef<AbortController | null>(null);
  const [visible, setVisible] = useState(false);
  const [source, setSource] = useState<SubmissionSource | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [pending, setPending] = useState(false);

  useEffect(
    () => () => {
      request.current?.abort();
    },
    [],
  );

  async function readSource() {
    if (!user || !isCurrentUser(client, user.publicId)) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setVisible(true);
    setPending(true);
    setError(null);
    try {
      const result = await v02.submissionSource(
        submissionId,
        controller.signal,
      );
      if (
        !controller.signal.aborted &&
        request.current === controller &&
        isCurrentUser(client, user.publicId)
      )
        setSource(result);
    } catch (cause) {
      if (
        controller.signal.aborted ||
        request.current !== controller ||
        !isCurrentUser(client, user.publicId)
      )
        return;
      if (cause instanceof ApiError && cause.status === 401) {
        hideSource();
        clearSession(client);
      } else setError(cause);
    } finally {
      if (!controller.signal.aborted && request.current === controller)
        setPending(false);
    }
  }

  function hideSource() {
    request.current?.abort();
    request.current = null;
    setVisible(false);
    setSource(null);
    setError(null);
    setPending(false);
  }

  return (
    <Panel title="v02.source" description={t("v02.sourcePrivacy")}>
      <Button
        type="button"
        variant="outline"
        className="self-start"
        aria-expanded={visible}
        aria-controls={id}
        onClick={() => {
          if (visible) hideSource();
          else void readSource();
        }}
      >
        {t(visible ? "v02.hideSource" : "v02.showSource")}
      </Button>
      {visible && (
        <div
          id={id}
          className="flex min-w-0 flex-col gap-3"
          aria-busy={pending}
        >
          {pending && (
            <p role="status" className="flex items-center gap-2">
              <Spinner aria-hidden="true" />
              {t("v02.sourceLoading")}
            </p>
          )}
          <ErrorNotice
            error={error}
            retry={() => void readSource()}
            pending={pending}
          />
          {source && (
            <>
              <dl className="grid gap-3 text-xs">
                <div>
                  <dt>{t("v.language")}</dt>
                  <dd>{source.languageId}</dd>
                </div>
                <div>
                  <dt>{t("v02.sourceSha256")}</dt>
                  <dd className="font-mono break-all">{source.sourceSha256}</dd>
                </div>
              </dl>
              <pre
                className="max-h-[32rem] overflow-auto rounded-lg border bg-surface-supporting p-4 text-xs"
                tabIndex={0}
                aria-label={t("v02.source")}
              >
                <code>{source.sourceCode}</code>
              </pre>
            </>
          )}
        </div>
      )}
    </Panel>
  );
}
