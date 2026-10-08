import { render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { LocaleProvider } from "@/components/layout/locale-provider";
import { PersonalDataGate } from "./personal-data-gate";

const identity = vi.hoisted(() => ({ loggedIn: true, student: false }));
vi.mock("next/navigation", () => ({ usePathname: () => "/problems" }));
vi.mock("./account-provider", () => ({
  useWorkspaceSession: () => ({
    data: identity.loggedIn ? { publicId: "test-user" } : null,
    isFetching: false,
    error: null,
    refetch: vi.fn(),
  }),
  useOptionalAccounts: () =>
    identity.loggedIn && identity.student
      ? {
          user: { publicId: "test-user" },
          account: null,
          query: { isFetching: false, error: null },
        }
      : null,
}));

beforeEach(() => {
  identity.loggedIn = true;
  identity.student = false;
  document.cookie = "codestartrack_locale=en; Path=/";
});

function view(requireStudent: boolean, requireAccount = false) {
  return (
    <LocaleProvider initialLocale="en">
      <PersonalDataGate
        requireStudent={requireStudent}
        requireAccount={requireAccount}
      >
        <p>Private platform content</p>
      </PersonalDataGate>
    </LocaleProvider>
  );
}

test("authenticated non-student roles can browse the problem bank", () => {
  render(view(false));
  expect(screen.getByText("Private platform content")).toBeInTheDocument();
});

test("platform personal actions require STUDENT without requiring a CF binding", () => {
  const { rerender } = render(view(true));
  expect(
    screen.queryByText("Private platform content"),
  ).not.toBeInTheDocument();
  identity.student = true;
  rerender(view(true));
  expect(screen.getByText("Private platform content")).toBeInTheDocument();
});

test("the legacy CF gate still requires a binding", () => {
  identity.student = true;
  render(view(true, true));
  expect(
    screen.queryByText("Private platform content"),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Connect|Bind/i })).toHaveAttribute(
    "href",
    "/accounts",
  );
});

test("problem bank content unmounts when the session expires", () => {
  const { rerender } = render(view(false));
  identity.loggedIn = false;
  rerender(view(false));
  expect(
    screen.queryByText("Private platform content"),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute(
    "href",
    "/login",
  );
});
