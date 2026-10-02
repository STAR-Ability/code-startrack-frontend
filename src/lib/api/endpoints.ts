import { z } from "zod";
import {
  readData,
  readPage,
  request,
  queryString,
  assertAccount,
} from "./client";
import {
  accountSchema,
  analysisSchema,
  batchSchema,
  dashboardSchema,
  jobSchema,
  problemProgressSchema,
  ratingSchema,
  submissionSchema,
  syncStatusSchema,
  userSchema,
  captchaSchema,
  emailCodeSchema,
  idSchema,
  uuidSchema,
  type AnalysisWindow,
  type RecommendationMode,
  type OjAccountDto,
} from "./schemas";

const accountPath = (id: string) =>
  `/oj-accounts/${encodeURIComponent(idSchema.parse(id))}`;
export const api = {
  me: (signal?: AbortSignal) => readData("/me", userSchema, { signal }),
  roles: (signal?: AbortSignal) =>
    readData(
      "/me/roles",
      z.object({
        primaryRole: z.string(),
        roles: z.array(z.object({ code: z.string(), name: z.string() })),
      }),
      { signal },
    ),
  captcha: () => readData("/auth/captcha", captchaSchema, { method: "POST" }),
  emailCode: (body: {
    email: string;
    purpose:
      "REGISTER" | "PASSWORD_RESET" | "EMAIL_CHANGE_OLD" | "EMAIL_CHANGE_NEW";
    captchaChallengeId: string;
    captchaAnswer: string;
  }) =>
    readData("/auth/email-codes", emailCodeSchema, { method: "POST", body }),
  login: (body: {
    account: string;
    password: string;
    captchaChallengeId: string;
    captchaAnswer: string;
  }) =>
    readData(
      "/auth/login",
      z.object({ user: userSchema, requiresOjBinding: z.boolean() }),
      { method: "POST", body },
    ),
  register: (body: {
    username: string;
    email: string;
    password: string;
    verificationId: string;
    emailCode: string;
  }) =>
    readData("/auth/register", z.object({ user: userSchema }), {
      method: "POST",
      body,
    }),
  resetPassword: (body: {
    email: string;
    verificationId: string;
    emailCode: string;
    newPassword: string;
  }) =>
    readData("/auth/password/reset", z.object({ reset: z.literal(true) }), {
      method: "POST",
      body,
    }),
  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    readData(
      "/me/password/change",
      z.object({ changed: z.literal(true), reauthRequired: z.literal(true) }),
      { method: "POST", body },
    ),
  changeEmail: (body: {
    password: string;
    oldEmail: string;
    oldVerificationId: string;
    oldEmailCode: string;
    newEmail: string;
    newVerificationId: string;
    newEmailCode: string;
  }) =>
    readData(
      "/me/email/change",
      z.object({
        email: z.string(),
        emailVerified: z.literal(true),
        reauthRequired: z.literal(true),
      }),
      { method: "POST", body },
    ),
  logout: () => request("/auth/logout", z.undefined(), { method: "POST" }),
  logoutAll: () =>
    readData(
      "/auth/logout-all",
      z.object({ revokedSessions: z.number().int().nonnegative() }),
      { method: "POST" },
    ),
  async accounts(includeUnbound: boolean, signal?: AbortSignal) {
    const accounts = new Map<string, OjAccountDto>();
    let page = 1;
    while (true) {
      const result = await readPage(
        `/oj-accounts${queryString({ includeUnbound, page, pageSize: 100 })}`,
        accountSchema,
        signal,
      );
      result.data.forEach((account) =>
        accounts.set(account.accountId, account),
      );
      if (!result.meta.hasNext) return [...accounts.values()];
      if (result.meta.page !== page || !result.data.length)
        throw new Error("Invalid account pagination");
      page++;
    }
  },
  account: (id: string, signal?: AbortSignal) =>
    readData(accountPath(id), accountSchema, { signal }, id),
  async bind(username: string) {
    const result = await readData(
      "/oj-accounts",
      z.object({ account: accountSchema, initialSync: jobSchema }),
      {
        method: "POST",
        body: { platform: "codeforces", username: username.trim() },
      },
    );
    assertAccount(result.initialSync, result.account.accountId);
    return result;
  },
  unbind: (id: string) =>
    request(accountPath(id), z.undefined(), { method: "DELETE" }),
  sync: (id: string) =>
    readData(`${accountPath(id)}/sync`, jobSchema, { method: "POST" }, id),
  rebuild: (id: string) =>
    readData(
      `${accountPath(id)}/analysis/rebuild`,
      jobSchema,
      { method: "POST" },
      id,
    ),
  syncStatus: (id: string, signal?: AbortSignal) =>
    readData(
      `${accountPath(id)}/sync-status`,
      syncStatusSchema,
      { signal },
      id,
    ),
  job: (id: string, jobId: string, signal?: AbortSignal) =>
    readData(
      `/sync-jobs/${uuidSchema.parse(jobId)}`,
      jobSchema,
      { signal },
      id,
      { jobId },
    ),
  dashboard: (id: string, signal?: AbortSignal) =>
    readData(`${accountPath(id)}/dashboard`, dashboardSchema, { signal }, id),
  overview: (id: string, window: AnalysisWindow, signal?: AbortSignal) =>
    readData(
      `${accountPath(id)}/training/overview${queryString({ window })}`,
      analysisSchema.nullable(),
      { signal },
      id,
      { window },
    ),
  analysis: (id: string, window: AnalysisWindow, signal?: AbortSignal) =>
    readData(
      `${accountPath(id)}/analysis/latest${queryString({ window })}`,
      analysisSchema.nullable(),
      { signal },
      id,
      { window },
    ),
  analysisHistory: (
    id: string,
    window: AnalysisWindow,
    page: number,
    signal?: AbortSignal,
  ) =>
    readPage(
      `${accountPath(id)}/analysis/history${queryString({ window, page })}`,
      analysisSchema,
      signal,
      id,
      { window },
    ),
  snapshot: (id: string, snapshotId: string, signal?: AbortSignal) =>
    readData(
      `${accountPath(id)}/analysis/${uuidSchema.parse(snapshotId)}`,
      analysisSchema,
      { signal },
      id,
      { snapshotId },
    ),
  problems: (
    id: string,
    filters: {
      page: number;
      status?: "ALL" | "SOLVED" | "UNSOLVED";
      tag?: string;
      minDifficulty?: number;
      maxDifficulty?: number;
    },
    signal?: AbortSignal,
  ) =>
    readPage(
      `${accountPath(id)}/problems${queryString(filters)}`,
      problemProgressSchema,
      signal,
      id,
    ),
  submissions: (
    id: string,
    filters: {
      page: number;
      problemId?: string;
      verdict?: string;
      from?: string;
      to?: string;
    },
    signal?: AbortSignal,
  ) =>
    readPage(
      `${accountPath(id)}/submissions${queryString(filters)}`,
      submissionSchema,
      signal,
      id,
    ),
  ratings: (id: string, page: number, signal?: AbortSignal) =>
    readPage(
      `${accountPath(id)}/rating-changes${queryString({ page })}`,
      ratingSchema,
      signal,
      id,
    ),
  recommendations: (
    id: string,
    mode: RecommendationMode,
    signal?: AbortSignal,
  ) =>
    readData(
      `${accountPath(id)}/recommendations/latest${queryString({ mode })}`,
      batchSchema.nullable(),
      { signal },
      id,
      { mode },
    ),
  recommendationHistory: (
    id: string,
    mode: RecommendationMode | undefined,
    page: number,
    signal?: AbortSignal,
  ) =>
    readPage(
      `${accountPath(id)}/recommendations/history${queryString({ mode, page })}`,
      batchSchema,
      signal,
      id,
      mode ? { mode } : {},
    ),
  batch: (id: string, batchId: string, signal?: AbortSignal) =>
    readData(
      `${accountPath(id)}/recommendations/${uuidSchema.parse(batchId)}`,
      batchSchema,
      { signal },
      id,
      { batchId },
    ),
  generate: (
    id: string,
    mode: RecommendationMode,
    limit: number,
    key: string,
  ) =>
    readData(
      `${accountPath(id)}/recommendations/generate`,
      batchSchema,
      {
        method: "POST",
        body: { mode, limit },
        idempotencyKey: uuidSchema.parse(key),
      },
      id,
      { mode },
    ),
};
