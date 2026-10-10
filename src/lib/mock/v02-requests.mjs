import { z } from "zod";
import {
  idSchema,
  instantSchema,
  modes,
  uuidSchema,
  windows,
} from "../api/schemas.ts";

const empty = z.strictObject({});
const paging = {
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
};
const source = z.enum(["ALL", "PLATFORM", "EXTERNAL"]);
const problemRef = z.union([
  z.strictObject({
    source: z.literal("PLATFORM"),
    platform: z.literal("startrack"),
    problemId: idSchema,
    problemVersionId: uuidSchema,
  }),
  z.strictObject({
    source: z.literal("EXTERNAL"),
    platform: z.literal("codeforces"),
    problemId: idSchema,
    problemVersionId: z.null(),
  }),
]);
const verdicts = ["AC", "WA", "TLE", "MLE", "RE", "CE", "OLE", "IE"];
const judgeStatuses = [
  "QUEUED",
  "DISPATCHING",
  "RUNNING",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
];
const range = (schema) =>
  schema.refine(
    (v) => !v.from || !v.to || Date.parse(v.from) < Date.parse(v.to),
  );
const text = z.string().min(1);
const trimmedQuery = z.string().trim().min(1);
const metadata = z
  .strictObject({
    baseProblemVersionId: uuidSchema,
    tags: z
      .array(text.max(128))
      .max(32)
      .refine((tags) => new Set(tags).size === tags.length),
    difficulty: z.number().int().positive().nullable(),
    difficultyScale: z.enum(["PLATFORM_RATING", "UNRATED"]),
  })
  .refine((value) =>
    value.difficultyScale === "UNRATED"
      ? value.difficulty === null
      : value.difficulty !== null,
  );
export const v02Routes = [
  [
    "GET",
    /^\/platform-problems$/,
    empty,
    z
      .strictObject({
        ...paging,
        q: trimmedQuery.max(100).optional(),
        tag: text.max(128).optional(),
        minDifficulty: z.coerce.number().int().positive().optional(),
        maxDifficulty: z.coerce.number().int().positive().optional(),
        status: z.literal("PUBLISHED").default("PUBLISHED"),
      })
      .refine(
        (v) =>
          v.minDifficulty === undefined ||
          v.maxDifficulty === undefined ||
          v.minDifficulty <= v.maxDifficulty,
      ),
  ],
  ["GET", /^\/platform-problems\/[^/]+(?:\/versions\/[^/]+)?$/, empty],
  ["GET", /^\/judge-languages$/, empty],
  [
    "POST",
    /^\/submissions$/,
    z.strictObject({
      problemRef,
      languageId: text,
      sourceCode: z.string(),
      trainingRecordId: uuidSchema.optional(),
    }),
  ],
  [
    "GET",
    /^\/submissions$/,
    empty,
    range(
      z.strictObject({
        ...paging,
        problemId: idSchema.optional(),
        judgeStatus: z.enum(judgeStatuses).optional(),
        verdict: z.enum(verdicts).optional(),
        from: instantSchema.optional(),
        to: instantSchema.optional(),
      }),
    ),
  ],
  ["GET", /^\/submissions\/[^/]+(?:\/(?:source|analysis))?$/, empty],
  ["POST", /^\/submissions\/[^/]+\/analysis\/retry$/, empty],
  [
    "POST",
    /^\/me\/training-records$/,
    z.strictObject({
      problemRef,
      recommendationBatchId: uuidSchema.optional(),
    }),
  ],
  [
    "GET",
    /^\/me\/training-records$/,
    empty,
    range(
      z.strictObject({
        ...paging,
        source: z.enum(["PLATFORM", "EXTERNAL"]).optional(),
        status: z.enum(["PLANNED", "IN_PROGRESS", "COMPLETED"]).optional(),
        from: instantSchema.optional(),
        to: instantSchema.optional(),
      }),
    ),
  ],
  ["GET", /^\/me\/training-records\/[^/]+$/, empty],
  [
    "GET",
    /^\/me\/learning-profile\/latest$/,
    empty,
    z.strictObject({ window: z.enum(windows).default("ALL") }),
  ],
  [
    "GET",
    /^\/me\/learning-profile\/history$/,
    empty,
    z.strictObject({ ...paging, window: z.enum(windows).default("ALL") }),
  ],
  ["GET", /^\/me\/learning-profile\/[^/]+$/, empty],
  ["POST", /^\/me\/learning-profile\/rebuild$/, empty],
  ["GET", /^\/learning-profile-jobs\/[^/]+$/, empty],
  [
    "POST",
    /^\/me\/recommendations\/generate$/,
    z.strictObject({
      source: source.default("ALL"),
      mode: z.enum(modes).default("HYBRID"),
      limit: z.number().int().min(1).max(50).default(10),
    }),
  ],
  [
    "GET",
    /^\/me\/recommendations\/latest$/,
    empty,
    z.strictObject({
      source: source.default("ALL"),
      mode: z.enum(modes).default("HYBRID"),
    }),
  ],
  [
    "GET",
    /^\/me\/recommendations\/history$/,
    empty,
    z.strictObject({
      ...paging,
      source: source.optional(),
      mode: z.enum(modes).optional(),
    }),
  ],
  ["GET", /^\/me\/recommendations\/[^/]+$/, empty],
  [
    "POST",
    /^\/admin\/problem-imports$/,
    z.strictObject({
      source: z.literal("OJ_LAB"),
      repositoryUrl: z.literal("https://github.com/oj-lab/problem-packages"),
      revision: z.string().regex(/^[0-9a-f]{40}$/),
      packagePaths: z
        .array(
          z
            .string()
            .regex(/^problems\/[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)*$/)
            .refine(
              (path) =>
                !path.split("/").some((part) => part === ".." || part === "."),
            ),
        )
        .min(1)
        .max(100)
        .refine((paths) => new Set(paths).size === paths.length),
    }),
  ],
  ["GET", /^\/admin\/problem-imports\/[^/]+$/, empty],
  [
    "POST",
    /^\/admin\/platform-problems\/[^/]+\/publish$/,
    z.strictObject({ problemVersionId: uuidSchema }),
  ],
  [
    "POST",
    /^\/admin\/platform-problems\/[^/]+\/withdraw$/,
    z.strictObject({ reason: text.refine((value) => value.trim().length > 0) }),
  ],
  ["POST", /^\/admin\/platform-problems\/[^/]+\/metadata-versions$/, metadata],
];

export const isV02Path = (path) =>
  /^\/(?:platform-problems(?:\/|$)|judge-languages(?:\/|$)|submissions(?:\/|$)|me\/(?:training-records|learning-profile|recommendations)(?:\/|$)|learning-profile-jobs(?:\/|$)|admin\/(?:problem-imports|platform-problems)(?:\/|$))/.test(
    path,
  );

export function validateV02Request(method, path, body, searchParams) {
  const rule = v02Routes.find(
    ([verb, pattern]) => verb === method && pattern.test(path),
  );
  if (!rule) return { success: false, missing: true };
  const entries = [...searchParams];
  if (new Set(entries.map(([key]) => key)).size !== entries.length)
    return { success: false };
  if (
    (rule[2] === empty || ["GET", "DELETE"].includes(method)) &&
    body !== undefined
  )
    return { success: false };
  const parsedBody = rule[2].safeParse(body ?? {});
  const query = (rule[3] ?? empty).safeParse(Object.fromEntries(entries));
  if (!parsedBody.success || !query.success)
    return {
      success: false,
      code:
        !query.success &&
        path.includes("/learning-profile/") &&
        searchParams.has("window")
          ? "INVALID_ANALYSIS_WINDOW"
          : !parsedBody.success &&
              body?.problemRef &&
              !problemRef.safeParse(body.problemRef).success
            ? "INVALID_PROBLEM_REF"
            : "INVALID_ARGUMENT",
    };
  return { success: true, body: parsedBody.data, query: query.data };
}
