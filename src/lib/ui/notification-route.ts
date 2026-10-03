import type { NotificationDto } from "@/lib/api/v012-schemas";
import { uuidSchema } from "@/lib/api/schemas";
// Routing is based on structured references, never notification prose or arbitrary payload URLs.
export function notificationRoute(notification: NotificationDto) {
  const teamId = uuidSchema.safeParse(notification.teamId);
  if (notification.referenceType === "INVITATION")
    return "/teams?tab=invitations";
  if (notification.referenceType === "APPLICATION") {
    return notification.type === "JOIN_APPLICATION_CREATED" && teamId.success
      ? `/teams/detail?teamId=${teamId.data}&tab=applications`
      : "/teams?tab=applications";
  }
  if (notification.type === "MEMBER_REMOVED") return "/teams";
  return teamId.success
    ? `/teams/detail?teamId=${teamId.data}&tab=members`
    : "/teams";
}
