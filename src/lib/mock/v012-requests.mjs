import { z } from "zod";
import { uuidSchema, windows } from "../api/schemas.ts";
import {
  applicationStatuses,
  invitationStatuses,
  privacyScopes,
  teamModes,
  audiences,
} from "../api/v012-schemas.ts";
const empty = z.strictObject({});
const paging = {
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
};
const text = z.string().trim().min(1);
const teamInput = {
  name: text,
  description: z.string().nullable(),
  avatarUrl: z.string().nullable(),
};
export const v012Routes = [
  [
    "GET",
    /^\/me\/(training\/overview|analysis\/latest)$/,
    empty,
    z.strictObject({ window: z.enum(windows).optional() }),
  ],
  [
    "GET",
    /^\/me\/analysis\/history$/,
    empty,
    z.strictObject({ ...paging, window: z.enum(windows).default("ALL") }),
  ],
  ["GET", /^\/me\/analysis\/[^/]+$/, empty],
  ["POST", /^\/me\/analysis\/rebuild$/, empty],
  ["GET", /^\/me\/reports$/, empty, z.strictObject(paging)],
  ["GET", /^\/me\/reports\/[^/]+$/, empty],
  ["POST", /^\/me\/reports\/generate$/, empty],
  ["GET", /^\/ai-jobs\/[^/]+$/, empty],
  ["POST", /^\/teams$/, z.strictObject(teamInput)],
  [
    "GET",
    /^\/teams\/mine$/,
    empty,
    z.strictObject({
      ...paging,
      scope: z.enum(["ALL", "JOINED", "MANAGED"]).default("ALL"),
    }),
  ],
  ["GET", /^\/teams\/search$/, empty, z.strictObject({ ...paging, q: text })],
  ["GET", /^\/teams\/[^/]+$/, empty],
  [
    "PATCH",
    /^\/teams\/[^/]+$/,
    z.strictObject({
      name: text.optional(),
      description: z.string().nullable().optional(),
      avatarUrl: z.string().nullable().optional(),
    }),
  ],
  [
    "POST",
    /^\/teams\/[^/]+\/(archive|activate|leave|analysis\/rebuild)$/,
    empty,
  ],
  [
    "POST",
    /^\/teams\/[^/]+\/dissolve$/,
    z.strictObject({ confirmation: text }),
  ],
  [
    "POST",
    /^\/teams\/[^/]+\/transfer$/,
    z.strictObject({ newOwnerPublicId: uuidSchema }),
  ],
  [
    "POST",
    /^\/teams\/[^/]+\/applications$/,
    z.strictObject({ message: z.string().optional() }),
  ],
  [
    "GET",
    /^\/(me\/team-applications|teams\/[^/]+\/applications)$/,
    empty,
    z.strictObject({
      ...paging,
      status: z.enum(applicationStatuses).optional(),
    }),
  ],
  ["POST", /^\/team-applications\/[^/]+\/(cancel|approve)$/, empty],
  [
    "POST",
    /^\/team-applications\/[^/]+\/reject$/,
    z.strictObject({ reason: z.string().optional() }),
  ],
  [
    "POST",
    /^\/teams\/[^/]+\/invitations$/,
    z.strictObject({ email: z.email() }),
  ],
  [
    "GET",
    /^\/(me\/team-invitations|teams\/[^/]+\/invitations)$/,
    empty,
    z.strictObject({
      ...paging,
      status: z.enum(invitationStatuses).optional(),
    }),
  ],
  ["POST", /^\/team-invitations\/[^/]+\/(cancel|resend|accept|reject)$/, empty],
  ["GET", /^\/teams\/[^/]+\/members$/, empty, z.strictObject(paging)],
  ["DELETE", /^\/teams\/[^/]+\/members\/[^/]+$/, empty],
  ["GET", /^\/me\/privacy$/, empty],
  [
    "PATCH",
    /^\/me\/privacy$/,
    z.strictObject(
      Object.fromEntries(
        [
          "basicTraining",
          "abilityProfile",
          "detailedSubmissions",
          "analysisReport",
        ].map((key) => [key, z.enum(privacyScopes).optional()]),
      ),
    ),
  ],
  [
    "GET",
    /^\/teams\/[^/]+\/members\/[^/]+\/(training\/overview|profile)$/,
    empty,
  ],
  [
    "GET",
    /^\/teams\/[^/]+\/members\/[^/]+\/(submissions|reports)$/,
    empty,
    z.strictObject(paging),
  ],
  ["GET", /^\/teams\/[^/]+\/members\/[^/]+\/reports\/[^/]+$/, empty],
  ["GET", /^\/teams\/[^/]+\/analysis\/latest$/, empty],
  ["GET", /^\/teams\/[^/]+\/analysis\/history$/, empty, z.strictObject(paging)],
  [
    "POST",
    /^\/teams\/[^/]+\/recommendations\/generate$/,
    z.strictObject({
      audience: z.enum(audiences),
      mode: z.enum(teamModes).optional(),
      limit: z.number().int().positive().optional(),
    }),
  ],
  [
    "GET",
    /^\/teams\/[^/]+\/recommendations\/latest$/,
    empty,
    z.strictObject({
      audience: z.enum(audiences),
      mode: z.enum(teamModes).default("HYBRID"),
    }),
  ],
  [
    "GET",
    /^\/teams\/[^/]+\/recommendations\/history$/,
    empty,
    z.strictObject({
      ...paging,
      audience: z.enum(audiences),
      mode: z.enum(teamModes).optional(),
    }),
  ],
  ["GET", /^\/teams\/[^/]+\/recommendations\/[^/]+$/, empty],
  ["GET", /^\/coach\/dashboard$/, empty],
  ["POST", /^\/coach-invite-codes\/redeem$/, z.strictObject({ code: text })],
  [
    "GET",
    /^\/notifications$/,
    empty,
    z.strictObject({
      ...paging,
      unreadOnly: z.enum(["true", "false"]).default("false"),
    }),
  ],
  ["GET", /^\/notifications\/unread-count$/, empty],
  ["POST", /^\/notifications\/(read-all|[^/]+\/read)$/, empty],
];
