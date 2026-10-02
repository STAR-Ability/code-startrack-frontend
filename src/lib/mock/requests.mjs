import { z } from "zod";
import {
  idSchema,
  instantSchema,
  modes,
  uuidSchema,
  verdicts,
  windows,
} from "../api/schemas.ts";

const text = z.string().trim().min(1);
const password = z.string().min(12).max(128);
const email = z.email();
const code = z.string().regex(/^\d{6}$/);
const pagination = {
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
};
const verification = { verificationId: uuidSchema, emailCode: code };
const captcha = { captchaChallengeId: uuidSchema, captchaAnswer: text };
const empty = z.strictObject({});
const routes = [
  ["POST", /^\/auth\/captcha$/, empty],
  [
    "POST",
    /^\/auth\/email-codes$/,
    z.strictObject({
      email,
      purpose: z.enum([
        "REGISTER",
        "PASSWORD_RESET",
        "EMAIL_CHANGE_OLD",
        "EMAIL_CHANGE_NEW",
      ]),
      ...captcha,
    }),
  ],
  [
    "POST",
    /^\/auth\/login$/,
    z.strictObject({ account: text, password, ...captcha }),
  ],
  [
    "POST",
    /^\/auth\/register$/,
    z.strictObject({
      username: z.string().regex(/^[A-Za-z0-9_]{3,32}$/),
      email,
      password,
      ...verification,
    }),
  ],
  [
    "POST",
    /^\/auth\/password\/reset$/,
    z.strictObject({ email, newPassword: password, ...verification }),
  ],
  ["POST", /^\/(auth\/logout(-all)?)$/, empty],
  [
    "POST",
    /^\/me\/password\/change$/,
    z.strictObject({ currentPassword: text, newPassword: password }),
  ],
  [
    "POST",
    /^\/me\/email\/change$/,
    z.strictObject({
      password: text,
      oldEmail: email,
      newEmail: email,
      oldVerificationId: uuidSchema,
      newVerificationId: uuidSchema,
      oldEmailCode: code,
      newEmailCode: code,
    }),
  ],
  ["GET", /^\/me(\/roles)?$/, empty],
  [
    "GET",
    /^\/oj-accounts$/,
    empty,
    z.strictObject({
      ...pagination,
      includeUnbound: z.enum(["true", "false"]).default("false"),
    }),
  ],
  [
    "POST",
    /^\/oj-accounts$/,
    z.strictObject({ platform: z.literal("codeforces"), username: text }),
  ],
  ["GET", /^\/sync-jobs\/[^/]+$/, empty],
  ["GET", /^\/oj-accounts\/\d+(\/(dashboard|sync-status))?$/, empty],
  ["DELETE", /^\/oj-accounts\/\d+$/, empty],
  ["POST", /^\/oj-accounts\/\d+\/(sync|analysis\/rebuild)$/, empty],
  [
    "GET",
    /^\/oj-accounts\/\d+\/problems$/,
    empty,
    z
      .strictObject({
        ...pagination,
        status: z.enum(["ALL", "SOLVED", "UNSOLVED"]).default("ALL"),
        tag: text.optional(),
        minDifficulty: z.coerce.number().int().optional(),
        maxDifficulty: z.coerce.number().int().optional(),
        sort: z.literal("LAST_SUBMITTED_DESC").default("LAST_SUBMITTED_DESC"),
      })
      .refine(
        (v) =>
          v.minDifficulty === undefined ||
          v.maxDifficulty === undefined ||
          v.minDifficulty <= v.maxDifficulty,
      ),
  ],
  [
    "GET",
    /^\/oj-accounts\/\d+\/submissions$/,
    empty,
    z
      .strictObject({
        ...pagination,
        verdict: z.enum(verdicts).optional(),
        problemId: idSchema.optional(),
        from: instantSchema.optional(),
        to: instantSchema.optional(),
      })
      .refine((v) => !v.from || !v.to || Date.parse(v.from) < Date.parse(v.to)),
  ],
  [
    "GET",
    /^\/oj-accounts\/\d+\/rating-changes$/,
    empty,
    z.strictObject(pagination),
  ],
  [
    "GET",
    /^\/oj-accounts\/\d+\/(training\/overview|analysis\/latest)$/,
    empty,
    z.strictObject({ window: z.enum(windows).optional() }),
  ],
  [
    "GET",
    /^\/oj-accounts\/\d+\/analysis\/history$/,
    empty,
    z.strictObject({ ...pagination, window: z.enum(windows).default("ALL") }),
  ],
  ["GET", /^\/oj-accounts\/\d+\/analysis\/[^/]+$/, empty],
  [
    "GET",
    /^\/oj-accounts\/\d+\/recommendations\/latest$/,
    empty,
    z.strictObject({ mode: z.enum(modes).default("HYBRID") }),
  ],
  [
    "GET",
    /^\/oj-accounts\/\d+\/recommendations\/history$/,
    empty,
    z.strictObject({ ...pagination, mode: z.enum(modes).optional() }),
  ],
  [
    "POST",
    /^\/oj-accounts\/\d+\/recommendations\/generate$/,
    z.strictObject({
      mode: z.enum(modes).default("HYBRID"),
      limit: z.number().int().min(1).max(50).default(10),
    }),
  ],
  ["GET", /^\/oj-accounts\/\d+\/recommendations\/[^/]+$/, empty],
];

export function validateMockRequest(method, path, body, searchParams) {
  const rule = routes.find(
    ([verb, pattern]) => verb === method && pattern.test(path),
  );
  if (!rule) return { success: false, missing: true };
  if (rule[2] === empty && body !== undefined) return { success: false };
  // Repeated query fields are ambiguous and rejected just like unknown fields.
  const entries = [...searchParams];
  if (new Set(entries.map(([key]) => key)).size !== entries.length)
    return { success: false };
  const parsedBody = rule[2].safeParse(body ?? {});
  const query = (rule[3] ?? empty).safeParse(Object.fromEntries(entries));
  if (!parsedBody.success || !query.success) return { success: false };
  if (["GET", "DELETE"].includes(method) && body !== undefined)
    return { success: false };
  return {
    success: true,
    body: body === undefined && method !== "POST" ? undefined : parsedBody.data,
    query: query.data,
  };
}
