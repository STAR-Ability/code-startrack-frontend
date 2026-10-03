/** Only navigation state is interpreted here; permissions remain server-owned. */
export function isWorkspaceLinkActive(
  href: string,
  pathname: string,
  params: Pick<URLSearchParams, "get">,
): boolean {
  const target = new URL(href, "https://workspace.invalid");
  if (target.pathname === "/teams") {
    if (pathname === "/teams/detail" || pathname === "/teams/member")
      return !target.search;
    return (
      pathname === "/teams" &&
      (params.get("tab") || "mine") ===
        (target.searchParams.get("tab") || "mine")
    );
  }
  if (target.pathname === "/coach") return pathname === "/coach";
  if (target.pathname === "/coach/teams") {
    return (
      pathname.startsWith("/coach/teams") &&
      (params.get("task") || "teams") ===
        (target.searchParams.get("task") || "teams")
    );
  }
  return (
    pathname === target.pathname || pathname.startsWith(`${target.pathname}/`)
  );
}
