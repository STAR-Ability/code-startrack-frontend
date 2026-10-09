import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LocaleProvider } from "@/components/layout/locale-provider";
import { v02 } from "@/lib/api/v02";
import { ApiError } from "@/lib/api/errors";
import { keys } from "@/lib/query/keys";
import { SubmissionSourceReveal } from "./submission-source";
import type { SubmissionSource } from "@/lib/api/v02-schemas";

const identity = vi.hoisted(() => ({
  publicId: "10000000-0000-4000-8000-000000000001",
}));
vi.mock("next/navigation", () => ({
  usePathname: () => "/submissions/detail",
}));
vi.mock("../account-provider", () => ({
  useWorkspaceSession: () => ({ data: identity }),
}));
vi.mock("@/lib/api/v02", () => ({ v02: { submissionSource: vi.fn() } }));

const source: SubmissionSource = {
  submissionId: "123",
  sourceCode: "  int main() {\n\treturn 0;\n}\n",
  sourceSha256: "a".repeat(64),
  languageId: "cpp17",
};

function setup() {
  const client = new QueryClient();
  client.setQueryData(keys.session, identity);
  const tree = (submissionId = "123") => (
    <QueryClientProvider client={client}>
      <LocaleProvider initialLocale="en">
        <SubmissionSourceReveal submissionId={submissionId} />
      </LocaleProvider>
    </QueryClientProvider>
  );
  const rendered = render(tree());
  return { ...rendered, client, tree };
}

beforeEach(() => {
  identity.publicId = "10000000-0000-4000-8000-000000000001";
  document.cookie = "codestartrack_locale=en; Path=/";
  vi.mocked(v02.submissionSource).mockReset();
});

describe("private source reveal", () => {
  it("clears revealed source synchronously when its identity or submission changes", async () => {
    vi.mocked(v02.submissionSource).mockResolvedValue(source);
    const { client, rerender, tree } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Show source" }));
    await screen.findByLabelText("Private source");
    rerender(tree("456"));
    expect(screen.queryByLabelText("Private source")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show source" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    rerender(tree());
    fireEvent.click(screen.getByRole("button", { name: "Show source" }));
    await screen.findByLabelText("Private source");
    identity.publicId = "10000000-0000-4000-8000-000000000002";
    client.setQueryData(keys.session, { ...identity });
    rerender(tree());
    expect(screen.queryByLabelText("Private source")).not.toBeInTheDocument();
    expect(screen.queryByText(source.sourceSha256)).not.toBeInTheDocument();
  });

  it("aborts in-flight source reads when the viewer changes identity", () => {
    vi.mocked(v02.submissionSource).mockReturnValue(new Promise(() => {}));
    const { client, rerender, tree } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Show source" }));
    const signal = vi.mocked(v02.submissionSource).mock.calls[0][1]!;
    identity.publicId = "10000000-0000-4000-8000-000000000002";
    client.setQueryData(keys.session, { ...identity });
    rerender(tree());
    expect(signal.aborted).toBe(true);
    expect(screen.queryByLabelText("Private source")).not.toBeInTheDocument();
  });

  it("clears the expired session and every cached private record after a source 401", async () => {
    vi.mocked(v02.submissionSource).mockRejectedValue(
      new ApiError("UNAUTHORIZED", 401),
    );
    const { client } = setup();
    const privateKey = keys.userResource(identity.publicId, "submission", {
      submissionId: "123",
    });
    client.setQueryData(privateKey, { privateValue: "cached result" });
    fireEvent.click(screen.getByRole("button", { name: "Show source" }));
    await waitFor(() => expect(client.getQueryData(keys.session)).toBeNull());
    expect(client.getQueryData(privateKey)).toBeUndefined();
    expect(client.getQueryCache().getAll()).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Show source" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.queryByLabelText("Private source")).not.toBeInTheDocument();
  });

  it("does not revoke a new identity when an old source request returns 401", async () => {
    let reject!: (value: unknown) => void;
    vi.mocked(v02.submissionSource).mockReturnValue(
      new Promise((_done, fail) => {
        reject = fail;
      }),
    );
    const { client } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Show source" }));
    const newIdentity = { publicId: "10000000-0000-4000-8000-000000000002" };
    client.setQueryData(keys.session, newIdentity);
    const privateKey = keys.userResource(newIdentity.publicId, "submission", {
      submissionId: "456",
    });
    client.setQueryData(privateKey, { privateValue: "new user's result" });
    await act(async () => {
      reject(new ApiError("UNAUTHORIZED", 401));
    });
    expect(client.getQueryData(keys.session)).toEqual(newIdentity);
    expect(client.getQueryData(privateKey)).toEqual({
      privateValue: "new user's result",
    });
  });

  it("reads only after an explicit action, preserves bytes, and clears source on hide", async () => {
    vi.mocked(v02.submissionSource).mockResolvedValue(source);
    const { client } = setup();
    expect(v02.submissionSource).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Show source" }));
    await waitFor(() =>
      expect(screen.getByLabelText("Private source")).toBeInTheDocument(),
    );
    expect(screen.getByLabelText("Private source").textContent).toBe(
      source.sourceCode,
    );
    expect(v02.submissionSource).toHaveBeenCalledWith(
      "123",
      expect.any(AbortSignal),
    );
    expect(client.getQueryCache().getAll()).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Hide source" }));
    expect(screen.queryByLabelText("Private source")).not.toBeInTheDocument();
    expect(screen.queryByText(source.sourceSha256)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show source" }));
    await waitFor(() => expect(v02.submissionSource).toHaveBeenCalledTimes(2));
  });

  it("aborts a hidden source read and ignores its late response", async () => {
    let resolve!: (value: SubmissionSource) => void;
    vi.mocked(v02.submissionSource).mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Show source" }));
    const signal = vi.mocked(v02.submissionSource).mock.calls[0][1]!;
    fireEvent.click(screen.getByRole("button", { name: "Hide source" }));
    expect(signal.aborted).toBe(true);
    await act(async () => {
      resolve(source);
    });
    expect(screen.queryByLabelText("Private source")).not.toBeInTheDocument();
  });

  it("rejects late source data after the authenticated identity changes", async () => {
    let resolve!: (value: SubmissionSource) => void;
    vi.mocked(v02.submissionSource).mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    const { client } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Show source" }));
    client.setQueryData(keys.session, {
      publicId: "10000000-0000-4000-8000-000000000002",
    });
    await act(async () => {
      resolve(source);
    });
    expect(screen.queryByLabelText("Private source")).not.toBeInTheDocument();
    expect(screen.queryByText(source.sourceSha256)).not.toBeInTheDocument();
  });

  it("aborts reads on unmount and refuses to read without the current session", () => {
    vi.mocked(v02.submissionSource).mockReturnValue(new Promise(() => {}));
    const { client, unmount } = setup();
    client.setQueryData(keys.session, null);
    fireEvent.click(screen.getByRole("button", { name: "Show source" }));
    expect(v02.submissionSource).not.toHaveBeenCalled();
    client.setQueryData(keys.session, identity);
    fireEvent.click(screen.getByRole("button", { name: "Show source" }));
    const signal = vi.mocked(v02.submissionSource).mock.calls[0][1]!;
    unmount();
    expect(signal.aborted).toBe(true);
  });
});
