import type { QueryClient } from "@tanstack/react-query";
import { keys } from "./keys";
export type CollaborationOperation =
  | "create"
  | "apply"
  | "application"
  | "invite"
  | "invitation"
  | "membership"
  | "team"
  | "privacy"
  | "notification"
  | "redeem";
export function invalidateCollaboration(
  client: QueryClient,
  publicId: string,
  operation: CollaborationOperation,
  teamId?: string,
) {
  const user = (resource: string) =>
    client.invalidateQueries({ queryKey: ["private", publicId, resource] });
  const teams = (resource: string) =>
    client.invalidateQueries({
      queryKey: ["private", publicId, "teams", resource],
    });
  const team = (resource?: string) =>
    teamId
      ? client.invalidateQueries({
          queryKey: resource
            ? ["private", publicId, "team", teamId, resource]
            : keys.team(publicId, teamId),
        })
      : Promise.resolve();
  const notifications = () =>
    Promise.all([user("notifications"), user("unread-count")]);
  const coach = () => user("coach-dashboard");
  switch (operation) {
    case "create":
      return Promise.all([teams("mine"), coach()]);
    case "apply":
      return Promise.all([
        teams("search"),
        teams("mine"),
        user("team-applications"),
        team("detail"),
      ]);
    case "application":
      return Promise.all([
        team("applications"),
        team("members"),
        team("detail"),
        user("team-applications"),
        teams("search"),
        teams("mine"),
        notifications(),
        coach(),
      ]);
    case "invite":
      return Promise.all([team("invitations"), teams("search")]);
    case "invitation":
      return Promise.all([
        user("team-invitations"),
        teams("mine"),
        team("members"),
        team("detail"),
        notifications(),
      ]);
    case "membership":
      return Promise.all([team(), teams("mine"), coach()]);
    case "team":
      return Promise.all([team(), teams("mine"), teams("search"), coach()]);
    case "privacy":
      return user("privacy");
    case "notification":
      return Promise.all([notifications(), coach()]);
    case "redeem":
      return client.invalidateQueries({ queryKey: keys.session });
  }
}
export function invalidateAiResult(
  client: QueryClient,
  publicId: string,
  type: string,
  teamId?: string,
) {
  const resource =
    type === "USER_ANALYSIS"
      ? "user-analysis"
      : type === "PERSONAL_REPORT"
        ? "reports"
        : type === "TEAM_ANALYSIS"
          ? "analysis"
          : "recommendations";
  return client.invalidateQueries({
    queryKey: teamId
      ? ["private", publicId, "team", teamId, resource]
      : ["private", publicId, resource],
  });
}
