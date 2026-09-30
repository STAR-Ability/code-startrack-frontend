import { z } from "zod";

const identifier = z.number().int().safe();
const count = z.number().int().min(0).max(2_147_483_647);
const difficulty = z.number().int().min(0).max(2_147_483_647);
const timestamp = z.iso
  .datetime({ offset: true, local: true })
  .refine((value) => Number.isFinite(Date.parse(value)));

// An unusable supplied URL disables the later action, without guessing a URL.
const externalUrl = z
  .unknown()
  .transform((value): string | null | undefined => {
    if (value === undefined) return undefined;
    if (typeof value !== "string" || value !== value.trim()) return null;
    try {
      const url = new URL(value);
      if (
        !/^https?:\/\//.test(value) ||
        !["http:", "https:"].includes(url.protocol) ||
        url.username ||
        url.password
      ) {
        return null;
      }
      return value;
    } catch {
      return null;
    }
  });

export const profileSchema = z.object({
  userId: identifier,
  totalSolved: count,
  averageDifficulty: z.number().min(0),
  maxDifficulty: difficulty,
  recentActivity: z.object({
    last_7_days: count,
    last_30_days: count,
  }),
  updatedAt: timestamp,
});

export const recommendationsSchema = z.object({
  userId: identifier,
  recommendations: z.array(
    z.object({
      problemId: identifier,
      platform: z.string().min(1),
      externalProblemId: z.string().min(1),
      title: z.string().optional(),
      difficulty: difficulty.nullable().optional(),
      tags: z.array(z.string()).optional(),
      url: externalUrl.optional(),
      reason: z.string(),
    }),
  ),
  generatedAt: timestamp,
});

export type TrainingProfile = z.infer<typeof profileSchema>;
export type TrainingRecommendations = z.infer<typeof recommendationsSchema>;
