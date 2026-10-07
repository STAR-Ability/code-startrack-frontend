"use client";
import { useState } from "react";
import Link from "next/link";
import { MailIcon, ClipboardListIcon, UsersRoundIcon } from "lucide-react";
import { v012 } from "@/lib/api/v012";
import type { NotificationDto } from "@/lib/api/v012-schemas";
import { notificationRoute } from "@/lib/ui/notification-route";
import { useLocale } from "@/components/layout/locale-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
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
      data-read={notification.read}
      className="notification-row relative flex min-w-0 flex-col gap-2 border-b py-4 pl-10 last:border-b-0"
    >
      <Icon
        aria-hidden="true"
        className="notification-icon absolute top-5 left-2 size-4 text-muted-foreground"
      />
      <div className="notification-heading flex min-w-0 flex-wrap justify-between gap-2">
        <h3 className="notification-title min-w-0 font-medium wrap-anywhere">
          {notification.title}
        </h3>
        {!notification.read && <Badge wrap>{t("v12.unread")}</Badge>}
      </div>
      <p className="notification-body text-sm wrap-anywhere whitespace-pre-wrap">
        {notification.body}
      </p>
      <div className="notification-footer flex flex-wrap items-center justify-between gap-3">
        <time
          className="notification-time text-xs text-muted-foreground"
          dateTime={notification.createdAt}
        >
          {new Intl.DateTimeFormat(locale, {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(new Date(notification.createdAt))}
        </time>
        <div className="notification-actions flex flex-wrap items-center gap-3">
          <Link
            href={notificationRoute(notification)}
            className={buttonVariants({
              variant: "link",
              size: "sm",
              wrap: true,
            })}
            onClick={() => {
              if (!notification.read && !mutation.blocked) mutation.mutate();
            }}
          >
            {t("v12.open")}
          </Link>
          {!notification.read && (
            <Button
              wrap
              size="sm"
              variant="outline"
              disabled={mutation.blocked}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending && (
                <Spinner data-icon="inline-start" aria-hidden="true" />
              )}
              {t("v12.read")}
            </Button>
          )}
        </div>
      </div>
      {mutation.isPending && (
        <p role="status" className="text-xs text-muted-foreground">
          {t("notifications.updatingReadState")}
        </p>
      )}
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
    <div className="notifications-page flex min-w-0 flex-col gap-4">
      <div className="notifications-toolbar flex flex-wrap items-center justify-between gap-3">
        <span className="notifications-unread-count text-sm text-muted-foreground">
          {t("v12.unread")}:{" "}
          <strong className="font-semibold text-foreground tabular-nums">
            {unread.data?.count ?? "—"}
          </strong>
        </span>
        <div className="notifications-actions flex flex-wrap items-center gap-3">
          <Button
            wrap
            size="sm"
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
            size="sm"
            disabled={mutation.blocked}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending && (
              <Spinner data-icon="inline-start" aria-hidden="true" />
            )}
            {t("v12.readAll")}
          </Button>
        </div>
      </div>
      {mutation.isPending && (
        <p role="status" className="text-sm text-muted-foreground">
          {t("notifications.updatingReadState")}
        </p>
      )}
      <ErrorNotice error={mutation.error} />
      <QueryFeedback query={unread} compact resource={t("v12.unread")} />
      {Boolean(unread.error) && unread.data !== undefined && (
        <p className="text-xs text-muted-foreground">{t("data.previous")}</p>
      )}
      <Panel title="v12.recentNotifications">
        <QueryFeedback
          query={query}
          compact
          resource={t("v12.recentNotifications")}
        />
        {Boolean(query.error) && query.data !== undefined && (
          <p className="text-xs text-muted-foreground">{t("data.previous")}</p>
        )}
        <div className="notification-list flex min-w-0 flex-col">
          {query.data?.data.map((notification) => (
            <NotificationRow
              key={notification.notificationId}
              notification={notification}
            />
          ))}
        </div>
        {query.data?.data.length === 0 && (
          <EmptyState embedded title={t("v12.noNotifications")} />
        )}
        <Pagination
          meta={query.data?.meta}
          page={page}
          setPage={setPage}
          pending={query.isFetching}
        />
      </Panel>
    </div>
  );
}
