import { describe, expect, it } from "vitest";
import { isWorkspaceLinkActive } from "./workspace";

describe("workspace navigation", () => {
  it("selects one collaboration task and keeps deep links in my teams", () => {
    const urls = [
      "/teams",
      "/teams?tab=search",
      "/teams?tab=applications",
      "/teams?tab=invitations",
    ];
    for (const tab of ["mine", "search", "applications", "invitations"]) {
      const selected = urls.filter((href) =>
        isWorkspaceLinkActive(href, "/teams", new URLSearchParams({ tab })),
      );
      expect(selected).toEqual([
        tab === "mine" ? "/teams" : `/teams?tab=${tab}`,
      ]);
    }
    expect(
      isWorkspaceLinkActive(
        "/teams",
        "/teams/detail",
        new URLSearchParams("teamId=123"),
      ),
    ).toBe(true);
  });
  it("keeps coach task navigation separate from dashboard and student links", () => {
    const params = new URLSearchParams("task=applications");
    expect(isWorkspaceLinkActive("/coach", "/coach/teams", params)).toBe(false);
    expect(isWorkspaceLinkActive("/coach/teams", "/coach/teams", params)).toBe(
      false,
    );
    expect(
      isWorkspaceLinkActive(
        "/coach/teams?task=applications",
        "/coach/teams",
        params,
      ),
    ).toBe(true);
    expect(isWorkspaceLinkActive("/teams", "/coach/teams", params)).toBe(false);
  });
  it("retains account and security parent navigation", () => {
    expect(
      isWorkspaceLinkActive(
        "/accounts",
        "/accounts/profile",
        new URLSearchParams(),
      ),
    ).toBe(true);
    expect(
      isWorkspaceLinkActive(
        "/security",
        "/security/password",
        new URLSearchParams(),
      ),
    ).toBe(true);
    expect(
      isWorkspaceLinkActive(
        "/profile",
        "/accounts/profile",
        new URLSearchParams(),
      ),
    ).toBe(false);
  });
});
