import { fixtureUuid } from "@/lib/demo/fixtures";
import { translate } from "@/lib/i18n/locale";
import { test, expect, configureUpstream, upstreamCalls } from "./fixtures";

const ownedTeam = fixtureUuid(1001);
const joinedTeam = fixtureUuid(1002);

test.beforeEach(async ({ context }) => {
  await configureUpstream({ coach: true });
  await context.addCookies([
    {
      name: "codestartrack_locale",
      value: "en",
      url: "http://127.0.0.1:3100",
    },
  ]);
});

for (const operation of ["remove", "leave"] as const) {
  test(`${operation}: keyboard Enter cancels membership confirmation without a write`, async ({
    page,
  }) => {
    await page.goto(
      `/teams/detail?teamId=${operation === "remove" ? ownedTeam : joinedTeam}&tab=members`,
    );
    const action = operation === "remove" ? "Remove member" : "Leave team";
    const opener = page.getByRole("button", { name: action, exact: true });
    await opener.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("alertdialog", {
      name: operation === "remove" ? "Remove this member?" : "Leave this team?",
    });
    await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(dialog).toHaveCount(0);
    await expect(opener).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(opener).toBeFocused();
    expect(
      (await upstreamCalls()).filter(
        (call) => !["GET", "HEAD"].includes(call.method),
      ),
    ).toEqual([]);
  });
}

for (const workspace of ["privacy", "team"] as const) {
  test(`${workspace}: Saved survives its revision refetch and clears on the next edit`, async ({
    page,
  }) => {
    const readPath =
      workspace === "privacy"
        ? "/api/v1/me/privacy"
        : `/api/v1/teams/${ownedTeam}`;
    await page.goto(
      workspace === "privacy"
        ? "/privacy"
        : `/teams/detail?teamId=${ownedTeam}&tab=settings`,
    );
    const edit =
      workspace === "privacy"
        ? page.getByRole("combobox", {
            name: "Basic training data",
            exact: true,
          })
        : page.getByRole("textbox", { name: "Team name", exact: true });
    const supplied =
      workspace === "privacy"
        ? translate("en", "v12.scope.TEAM_MEMBER")
        : "Updated team from browser regression";
    if (workspace === "privacy") {
      await edit.click();
      await page.getByRole("option", { name: supplied, exact: true }).click();
    } else {
      await edit.fill(supplied);
    }
    // Team settings also contain independent danger-zone confirmation controls.
    const form = edit.locator("xpath=ancestor::form");
    await form.getByRole("button", { name: "Save", exact: true }).click();
    await expect
      .poll(
        async () =>
          (await upstreamCalls()).filter(
            (call) => call.method === "GET" && call.path === readPath,
          ).length,
      )
      .toBeGreaterThanOrEqual(2);
    const saved = page.getByText("Saved", { exact: true });
    await expect(saved).toHaveAttribute("role", "status");
    if (workspace === "privacy") {
      await expect(edit).toContainText(supplied);
      await expect(
        form.getByRole("button", { name: "Save", exact: true }),
      ).toBeDisabled();
      await edit.click();
      await page
        .getByRole("option", {
          name: translate("en", "v12.scope.PUBLIC"),
          exact: true,
        })
        .click();
    } else {
      await expect(edit).toHaveValue(supplied);
      await edit.fill("Unsaved next team edit");
    }
    await expect(saved).toHaveCount(0);
    expect(
      (await upstreamCalls()).filter((call) => call.method === "PATCH"),
    ).toEqual([expect.objectContaining({ path: readPath })]);
  });
}
