import type {
  SubmissionDto,
  SyncJobDto,
  OjAccountDto,
} from "@/lib/api/schemas";

type Tone = "info" | "success" | "warning" | "destructive" | "secondary";
export const verdictTone = {
  ACCEPTED: "success",
  PARTIAL: "warning",
  PENDING: "warning",
  WRONG_ANSWER: "destructive",
  TIME_LIMIT: "destructive",
  MEMORY_LIMIT: "destructive",
  RUNTIME_ERROR: "destructive",
  COMPILE_ERROR: "destructive",
  CHALLENGED: "destructive",
  IDLENESS_LIMIT: "destructive",
  PRESENTATION_ERROR: "destructive",
  SKIPPED: "secondary",
  OTHER: "secondary",
} satisfies Record<SubmissionDto["verdict"], Tone>;
export const jobTone = {
  QUEUED: "info",
  RUNNING: "info",
  SUCCESS: "success",
  PARTIAL: "warning",
  FAILED: "destructive",
} satisfies Record<SyncJobDto["status"], Tone>;
export const accountTone = {
  ACTIVE: "success",
  INVALID: "warning",
  UNBOUND: "secondary",
} satisfies Record<OjAccountDto["bindStatus"], Tone>;
