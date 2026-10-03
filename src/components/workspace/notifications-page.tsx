"use client";
import { useState } from "react";
import Link from "next/link";
import { MailIcon, ClipboardListIcon, UsersRoundIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { v012 } from "@/lib/api/v012";
import type { NotificationDto } from "@/lib/api/v012-schemas";
import { notificationRoute } from "@/lib/ui/notification-route";
import { useLocale } from "@/components/layout/locale-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Panel, useCollaborationMutation } from "./v012-shared";
import { useUserQuery } from "./use-user-query";
import { ErrorNotice, EmptyState, QueryFeedback, Pagination } from "./feedback";
export function NotificationRow({
  notification,
}: {
  notification: NotificationDto;
}) {
  const { t, locale } = useLocale();
  const mutation = useCollaborationMutation("notification", () =>
    v012.readNotification(notification.notificationId),
  );
  const Icon =
    notification.referenceType === "INVITATION"
      ? MailIcon
      : notification.referenceType === "APPLICATION"
        ? ClipboardListIcon
        : UsersRoundIcon;
  return (
    <article
      className={cn(
        "relative flex min-w-0 flex-col gap-2 border-b py-4 pl-10 last:border-0",
        !notification.read && "border-l-2 border-l-primary",
      )}
    >
      <Icon
        aria-hidden="true"
        className="absolute top-5 left-2 size-4 text-muted-foreground"
      />
      <div className="flex flex-wrap justify-between gap-2">
        <h3 className="break-words font-medium">{notification.title}</h3>
        {!notification.read && <Badge>{t("v12.unread")}</Badge>}
      </div>
      <p className="whitespace-pre-wrap break-words text-sm">
        {notification.body}
      </p>
      <time
        className="text-xs text-muted-foreground"
        dateTime={notification.createdAt}
      >
        {new Intl.DateTimeFormat(locale, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(notification.createdAt))}
      </time>
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={notificationRoute(notification)}
          className="underline"
          onClick={() => {
            if (!notification.read && !mutation.blocked) mutation.mutate();
          }}
        >
          {t("v12.open")}
        </Link>
        {!notification.read && (
          <Button
            wrap
            variant="outline"
            disabled={mutation.blocked}
            onClick={() => mutation.mutate()}
          >
            {t("v12.read")}
          </Button>
        )}
      </div>
      <ErrorNotice error={mutation.error} />
    </article>
  );
}
export function NotificationsPage() {
  const { t } = useLocale();
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const query = useUserQuery(
    "notifications",
    { page, unreadOnly },
    (_id, signal) => v012.notifications({ page, unreadOnly }, signal),
  );
  const unread = useUserQuery("unread-count", {}, (_id, signal) =>
    v012.unreadCount(signal),
  );
  const mutation = useCollaborationMutation("notification", () =>
    v012.readAllNotifications(),
  );
  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          wrap
          variant="outline"
          aria-pressed={unreadOnly}
          onClick={() => {
            setUnreadOnly(!unreadOnly);
            setPage(1);
          }}
        >
          {t("v12.unreadOnly")}
        </Button>
        <Button
          wrap
          disabled={mutation.blocked}
          onClick={() => mutation.mutate()}
        >
          {t("v12.readAll")}
        </Button>
        <span>
          {t("v12.unread")}: {unread.data?.count ?? "—"}
        </span>
      </div>
      <ErrorNotice error={mutation.error} />
      <QueryFeedback query={unread} />
      <Panel title="v12.recentNotifications">
        <QueryFeedback query={query} />
        {query.data?.data.map((notification) => (
          <NotificationRow
            key={notification.notificationId}
            notification={notification}
          />
        ))}
        {query.data?.data.length === 0 && (
          <EmptyState title={t("v12.noNotifications")} />
        )}
        <Pagination
          meta={query.data?.meta}
          page={page}
          setPage={setPage}
          pending={query.isFetching}
        />
      </Panel>
    </>
  );
}
