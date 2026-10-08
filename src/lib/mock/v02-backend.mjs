import { createHash } from "node:crypto";
import { demoSubmissions, fixtureUuid } from "../demo/fixtures.ts";
import {
  v02Analysis,
  v02ExternalProblem,
  v02Instant,
  v02Languages,
  v02LearningProfile,
  v02ProblemSummary,
  v02Problems,
  v02RecommendationBatch,
  v02SourceCode,
  v02Submission,
  v02UnsafeStatement,
} from "../demo/v02-fixtures.ts";
import { uuidSchema } from "../api/schemas.ts";
import { isV02Path } from "./v02-requests.mjs";

const digest = (value) => createHash("sha256").update(value).digest("hex");
const identity = (problem) => {
  const ref = problem.problemRef ?? problem;
  return `${ref.source}:${ref.platform}:${ref.problemId}`;
};
const canonical = (value) =>
  JSON.stringify(value, (_, item) =>
    item && typeof item === "object" && !Array.isArray(item)
      ? Object.fromEntries(
          Object.keys(item)
            .sort()
            .map((key) => [key, item[key]]),
        )
      : item,
  );
const pendingJudge = (status) =>
  ["QUEUED", "DISPATCHING", "RUNNING"].includes(status);
const terminalAnalysis = (status) =>
  ["SUCCEEDED", "PARTIAL", "FAILED", "SKIPPED", "NOT_REQUESTED"].includes(
    status,
  );
const taskError = (code, retryable = true) => ({
  code,
  message: `Synthetic ${code.toLowerCase().replaceAll("_", " ")}`,
  retryable,
});
const sourceNotReady = (bound) =>
  bound.some(
    (item) =>
      item.bindStatus !== "UNBOUND" &&
      (!item.lastSyncedAt ||
        ["QUEUED", "RUNNING"].includes(item.lastSyncStatus)),
  );
const currentSourcesStale = (bound) =>
  sourceNotReady(bound) || bound.some((item) => item.bindStatus === "INVALID");

// Each backend instance and each public identity has independent synthetic state.
export function createV02Mock() {
  let users = new Map();
  let catalog;
  let versions;
  let imports;
  let catalogVersion = 12n;
  let sequence = 30000;
  let submissionSequence = 9007199254748000n;
  const nextId = () => fixtureUuid(sequence++);
  const timestamp = () =>
    new Date(Date.parse(v02Instant) + sequence++ * 1000).toISOString();
  function reset() {
    users = new Map();
    sequence = 30000;
    submissionSequence = 9007199254748000n;
    catalogVersion = 12n;
    catalog = structuredClone(v02Problems);
    versions = new Map(
      catalog.map((item) => [
        item.problemRef.problemVersionId,
        structuredClone(item),
      ]),
    );
    const old = structuredClone(catalog[0]);
    old.problemRef.problemVersionId = fixtureUuid(2090);
    old.statement.content =
      "# Sum of Two Integers (original version)\n\nPrint the sum of the two integers.";
    versions.set(old.problemRef.problemVersionId, old);
    imports = new Map();
  }
  reset();
  function advanceCatalog() {
    catalogVersion++;
    catalog.forEach(
      (problem) => (problem.catalogVersion = String(catalogVersion)),
    );
    return String(catalogVersion);
  }

  function sourceEvents(bound, config) {
    if (config.zero || config.emptyRecords) return [];
    const events = new Map();
    for (const account of bound.filter(
      (item) => item.bindStatus !== "UNBOUND" && item.lastSyncedAt,
    )) {
      for (const submission of demoSubmissions(account.accountId)) {
        const key = `${submission.problem.platform}:${submission.externalSubmissionId}`;
        if (events.has(key)) continue;
        const problem = {
          problemRef: {
            source: "EXTERNAL",
            platform: "codeforces",
            problemId: submission.problem.problemId,
            problemVersionId: null,
          },
          title: submission.problem.title,
          difficulty: submission.problem.difficulty,
          difficultyScale:
            submission.problem.difficulty === null ? "UNRATED" : "CF_RATING",
          tags: submission.problem.tags,
          url: submission.problem.url,
        };
        events.set(key, {
          problem,
          status:
            submission.verdict === "PENDING"
              ? "PENDING"
              : submission.verdict === "ACCEPTED"
                ? "AC"
                : "FAILED",
          submittedAt: submission.submittedAt,
          submissionId: submission.submissionId,
        });
      }
    }
    if (
      config.v02ExternalAccepted &&
      bound.some((item) => item.bindStatus === "ACTIVE" && item.lastSyncedAt)
    ) {
      events.set("codeforces:synthetic-external-result", {
        problem: structuredClone(v02ExternalProblem),
        status: config.v02ExternalRevoked ? "FAILED" : "AC",
        submittedAt: "2026-10-07T02:20:00Z",
        submissionId: "9007199254747999",
      });
    }
    return [...events.values()];
  }
  function events(state, bound, config) {
    const platform = [...state.submissions.values()]
      .filter(
        (submission) =>
          !(
            submission.judgeStatus === "CANCELLED" ||
            (submission.judgeStatus === "FAILED" &&
              !pendingJudge(submission.judgeStatus))
          ),
      )
      .map((submission) => ({
        problem: submission.problem,
        submittedAt: submission.submittedAt,
        submissionId: submission.submissionId,
        status: pendingJudge(submission.judgeStatus)
          ? "PENDING"
          : submission.judgeResult?.verdict === "AC"
            ? "AC"
            : "FAILED",
      }));
    return [...platform, ...sourceEvents(bound, config)];
  }
  function fingerprint(state, bound, config) {
    return digest(
      canonical({
        events: events(state, bound, config),
        evidence: [...state.evidence].map(([id, result]) => [
          id,
          result.resultHash,
        ]),
        catalog: catalog.map((item) => [
          item.problemRef,
          item.status,
          item.catalogVersion,
        ]),
        accounts: bound
          .filter((item) => item.bindStatus !== "UNBOUND")
          .map((item) => [
            item.accountId,
            item.bindStatus,
            item.lastSyncedAt,
            item.lastSyncStatus,
          ]),
      }),
    );
  }
  function profile(
    state,
    user,
    bound,
    config,
    window,
    profileJobId,
    cutoff = timestamp(),
  ) {
    const result = v02LearningProfile(window, true);
    result.publicId = user.publicId;
    result.snapshotId = nextId();
    result.profileJobId = profileJobId;
    result.dataCutoffAt = cutoff;
    result.createdAt = cutoff;
    result.period.end = cutoff;
    if (window !== "ALL") {
      const day = new Date(cutoff);
      const shanghai = new Date(day.getTime() + 8 * 3600000);
      const days = { "7D": 7, "30D": 30, "365D": 365 }[window];
      result.period.start = new Date(
        Date.UTC(
          shanghai.getUTCFullYear(),
          shanghai.getUTCMonth(),
          shanghai.getUTCDate() - days + 1,
        ) -
          8 * 3600000,
      ).toISOString();
    }
    const all = events(state, bound, config).filter(
      (item) =>
        item.submittedAt < cutoff &&
        (!result.period.start || item.submittedAt >= result.period.start),
    );
    const attempted = new Map(
      all.map((item) => [identity(item.problem), item.problem]),
    );
    const solved = new Map(
      all
        .filter((item) => item.status === "AC")
        .map((item) => [identity(item.problem), item.problem]),
    );
    const rated = [...solved.values()].filter(
      (problem) => problem.difficultyScale === "CF_RATING",
    );
    result.summary = {
      attemptedProblemCount: attempted.size,
      solvedCount: solved.size,
      unsolvedProblemCount: attempted.size - solved.size,
      submissionCount: all.length,
      acceptedSubmissionCount: all.filter((item) => item.status === "AC")
        .length,
      failedSubmissionCount: all.filter((item) => item.status === "FAILED")
        .length,
      pendingSubmissionCount: all.filter((item) => item.status === "PENDING")
        .length,
      ratedSolvedCount: rated.length,
      unratedSolvedCount: solved.size - rated.length,
      averageSolvedDifficulty: rated.length
        ? rated.reduce((sum, problem) => sum + problem.difficulty, 0) /
          rated.length
        : null,
      maxSolvedDifficulty: rated.length
        ? Math.max(...rated.map((problem) => problem.difficulty))
        : null,
      activeDays: new Set(
        all.map((item) =>
          new Date(Date.parse(item.submittedAt) + 8 * 3600000)
            .toISOString()
            .slice(0, 10),
        ),
      ).size,
    };
    const active = bound.filter((item) => item.bindStatus !== "UNBOUND");
    const ratings = active.filter((item) => item.rating !== null);
    result.currentRating = ratings.length
      ? Math.max(...ratings.map((item) => item.rating))
      : null;
    result.maxRating = active.some((item) => item.maxRating !== null)
      ? Math.max(...active.map((item) => item.maxRating ?? 0))
      : null;
    result.overallScore = solved.size ? Math.min(100, solved.size * 15) : 0;
    result.dimensions.forEach((item, index) => {
      item.score = solved.size
        ? Math.min(100, solved.size * 10 + index * 3)
        : 0;
      item.attemptedProblemCount = attempted.size;
      item.solvedCount = solved.size;
      item.submissionCount = all.length;
      item.averageSolvedDifficulty = result.summary.averageSolvedDifficulty;
    });
    result.tagStats = [
      ...new Set([...attempted.values()].flatMap((problem) => problem.tags)),
    ].map((tag) => ({
      tag,
      attemptedProblemCount: [...attempted.values()].filter((problem) =>
        problem.tags.includes(tag),
      ).length,
      solvedCount: [...solved.values()].filter((problem) =>
        problem.tags.includes(tag),
      ).length,
      submissionCount: all.filter((item) => item.problem.tags.includes(tag))
        .length,
    }));
    const buckets = new Map();
    for (const problem of attempted.values()) {
      const key = `${problem.difficultyScale}:${problem.difficulty}`;
      if (!buckets.has(key))
        buckets.set(key, {
          difficulty: problem.difficulty,
          difficultyScale: problem.difficultyScale,
          attemptedProblemCount: 0,
          solvedCount: 0,
        });
      const bucket = buckets.get(key);
      bucket.attemptedProblemCount++;
      if (solved.has(identity(problem))) bucket.solvedCount++;
    }
    result.difficultyStats = [...buckets.values()];
    const days = new Map();
    const counted = new Set();
    for (const event of [...all].sort((a, b) =>
      a.submittedAt.localeCompare(b.submittedAt),
    )) {
      const date = new Date(Date.parse(event.submittedAt) + 8 * 3600000)
        .toISOString()
        .slice(0, 10);
      if (!days.has(date))
        days.set(date, {
          date,
          submissionCount: 0,
          acceptedSubmissionCount: 0,
          failedSubmissionCount: 0,
          pendingSubmissionCount: 0,
          solvedCount: 0,
        });
      const day = days.get(date);
      day.submissionCount++;
      day[
        event.status === "AC"
          ? "acceptedSubmissionCount"
          : event.status === "PENDING"
            ? "pendingSubmissionCount"
            : "failedSubmissionCount"
      ]++;
      if (event.status === "AC" && !counted.has(identity(event.problem))) {
        counted.add(identity(event.problem));
        day.solvedCount++;
      }
    }
    result.activityStats = [...days.values()];
    const evidence = [...state.evidence]
      .filter(([id]) => all.some((item) => item.submissionId === id))
      .map(([, value]) => value);
    result.sources = {
      platformSubmissionCount: all.filter(
        (item) => item.problem.problemRef.source === "PLATFORM",
      ).length,
      externalSubmissionCount: all.filter(
        (item) => item.problem.problemRef.source === "EXTERNAL",
      ).length,
      codeAnalysisCount: evidence.length,
      sourceAccountIds: active.map((item) => item.accountId),
    };
    result.codeQuality = {
      analyzedSubmissionCount: evidence.length,
      warningCount: evidence
        .flatMap((item) => item.findings)
        .filter((finding) => finding.severity === "WARNING").length,
      errorCount: evidence
        .flatMap((item) => item.findings)
        .filter((finding) => finding.severity === "ERROR").length,
      maxCyclomaticComplexity: evidence.some(
        (item) => item.metrics.maxCyclomaticComplexity !== null,
      )
        ? Math.max(
            ...evidence.map(
              (item) => item.metrics.maxCyclomaticComplexity ?? 0,
            ),
          )
        : null,
    };
    result.sourceFingerprint = fingerprint(state, bound, config);
    result.stale = !!config.stale || currentSourcesStale(bound);
    return result;
  }
  function appendProfiles(state, user, bound, config, jobId = nextId()) {
    const cutoff = timestamp();
    const profiles = ["7D", "30D", "365D", "ALL"].map((window) =>
      profile(state, user, bound, config, window, jobId, cutoff),
    );
    state.profiles.unshift(...profiles);
    return profiles;
  }
  function analysisResult(submission, source, partial) {
    const result = v02Analysis(
      submission.submissionId,
      submission.analysisId,
      partial,
    );
    const sourceSha256 = digest(source);
    result.sourceSha256 = sourceSha256;
    result.languageId = submission.languageId;
    result.reproducibility.sourceSha256 = sourceSha256;
    result.metrics.sourceLines = source.split(/\r?\n/).length;
    result.resultHash = digest(canonical({ ...result, resultHash: undefined }));
    return result;
  }
  function initialize(user, bound, config) {
    if (users.has(user.publicId)) return users.get(user.publicId);
    const state = {
      submissions: new Map(),
      sources: new Map(),
      analyses: new Map(),
      evidence: new Map(),
      training: new Map(),
      profiles: [],
      batches: [],
      jobs: new Map(),
      replay: new Map(),
      counters: new Map(),
    };
    users.set(user.publicId, state);
    if (!config.v02EmptyTraining && !config.zero && !config.emptyRecords) {
      const seed = config.v02AllVerdicts
        ? [
            "AC",
            "WA",
            "TLE",
            "MLE",
            "RE",
            "CE",
            "OLE",
            "IE",
            "CANCELLED",
            "LOCAL_FAILED",
          ]
        : ["WA", "AC"];
      seed.forEach((verdict, index) => {
        const problem = config.v02AllVerdicts
          ? catalog[index % 2]
          : catalog[index === 0 ? 1 : 2];
        const submission = v02Submission(String(++submissionSequence), {
          problem: v02ProblemSummary(problem),
          judgeTaskId: nextId(),
          analysisId: nextId(),
          submittedAt: `2026-10-07T02:${String(10 + index).padStart(2, "0")}:00Z`,
        });
        submission.judgeResult.verdict = ["CANCELLED", "LOCAL_FAILED"].includes(
          verdict,
        )
          ? "IE"
          : verdict;
        if (verdict !== "AC") submission.judgeResult.passedTestCount = 2;
        if (verdict === "CE") {
          submission.judgeResult.compileLog =
            "main.cpp:3: expected ';' before return";
          submission.judgeResult.timeMs = null;
          submission.judgeResult.memoryBytes = null;
        }
        if (verdict === "IE") {
          submission.judgeStatus = "FAILED";
          submission.judgeError = taskError("JUDGE_EXECUTION_FAILED");
        }
        if (verdict === "CANCELLED" || verdict === "LOCAL_FAILED") {
          submission.judgeStatus =
            verdict === "CANCELLED" ? "CANCELLED" : "FAILED";
          submission.judgeResult = null;
          if (verdict === "LOCAL_FAILED") {
            submission.judgeTaskId = null;
            submission.judgeError = taskError("JUDGE_UNAVAILABLE");
          }
        }
        submission.analysisStatus =
          config.v02NoAnalysis || submission.judgeStatus !== "COMPLETED"
            ? "NOT_REQUESTED"
            : (config.v02AnalysisStatus ?? "SUCCEEDED");
        if (submission.analysisStatus === "NOT_REQUESTED") {
          submission.analysisId = null;
          submission.analysisRevision = 0;
        }
        state.submissions.set(submission.submissionId, submission);
        state.sources.set(submission.submissionId, v02SourceCode);
        const result = ["SUCCEEDED", "PARTIAL"].includes(
          submission.analysisStatus,
        )
          ? analysisResult(
              submission,
              v02SourceCode,
              submission.analysisStatus === "PARTIAL",
            )
          : null;
        submission.analysisError = ["FAILED", "PARTIAL", "SKIPPED"].includes(
          submission.analysisStatus,
        )
          ? taskError(
              submission.analysisStatus === "SKIPPED"
                ? "ANALYSIS_TEMPORARILY_UNAVAILABLE"
                : "TOOL_TIMEOUT",
            )
          : null;
        state.analyses.set(submission.submissionId, {
          analysisId: submission.analysisId,
          status: submission.analysisStatus,
          revision: submission.analysisRevision,
          result,
          error: submission.analysisError,
        });
        if (result) state.evidence.set(submission.submissionId, result);
        projectTraining(state, submission);
      });
    }
    if (!config.v02NoProfile && !config.noAnalysis)
      appendProfiles(state, user, bound, config);
    if (!config.v02NoBatch && !config.noBatch && state.profiles.length)
      for (const source of ["ALL", "PLATFORM", "EXTERNAL"])
        for (const mode of ["LEVEL", "WEAKNESS", "HYBRID"])
          state.batches.push(
            makeBatch(state, user, bound, config, { source, mode, limit: 10 }),
          );
    return state;
  }
  function trainingRecord(state, problem, attribution = null) {
    const key = identity(problem);
    const existing = state.training.get(key);
    if (existing) {
      if (!existing.recommendationBatchId && attribution)
        existing.recommendationBatchId = attribution;
      return existing;
    }
    const now = timestamp();
    const record = {
      trainingRecordId: nextId(),
      problem: v02ProblemSummary(problem),
      status: "PLANNED",
      recommendationBatchId: attribution,
      firstSubmittedAt: null,
      lastSubmittedAt: null,
      attemptCount: 0,
      acceptedSubmissionCount: 0,
      lastSubmissionId: null,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    state.training.set(key, record);
    return record;
  }
  function projectTraining(state, submission) {
    const record = trainingRecord(state, submission.problem);
    const attempts = [...state.submissions.values()]
      .filter((item) => identity(item.problem) === identity(submission.problem))
      .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
    const accepted = attempts.filter(
      (item) =>
        item.judgeStatus === "COMPLETED" && item.judgeResult?.verdict === "AC",
    );
    record.status = accepted.length
      ? "COMPLETED"
      : attempts.length
        ? "IN_PROGRESS"
        : "PLANNED";
    record.attemptCount = attempts.length;
    record.acceptedSubmissionCount = accepted.length;
    record.firstSubmittedAt = attempts[0]?.submittedAt ?? null;
    record.lastSubmittedAt = attempts.at(-1)?.submittedAt ?? null;
    record.lastSubmissionId = attempts.at(-1)?.submissionId ?? null;
    record.completedAt = accepted[0]?.judgeResult.judgedAt ?? null;
    record.updatedAt = timestamp();
    return record;
  }
  function projectExternal(state, bound, config) {
    const external = sourceEvents(bound, config);
    for (const record of state.training.values()) {
      if (record.problem.problemRef.source !== "EXTERNAL") continue;
      const attempts = external
        .filter((item) => identity(item.problem) === identity(record.problem))
        .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
      if (!attempts.length) continue;
      const accepted = attempts.filter((item) => item.status === "AC");
      const projection = {
        status: accepted.length ? "COMPLETED" : "IN_PROGRESS",
        attemptCount: attempts.length,
        acceptedSubmissionCount: accepted.length,
        firstSubmittedAt: attempts[0].submittedAt,
        lastSubmittedAt: attempts.at(-1).submittedAt,
        lastSubmissionId: attempts.at(-1).submissionId,
        completedAt: accepted[0]?.submittedAt ?? null,
      };
      if (
        Object.entries(projection).some(([key, value]) => record[key] !== value)
      )
        Object.assign(record, projection, { updatedAt: timestamp() });
    }
  }
  function candidates(state, bound, config, source, mode) {
    if (config.emptyCandidates || config.v02EmptyCandidates) return [];
    const solved = new Set(
      events(state, bound, config)
        .filter((item) => item.status === "AC")
        .map((item) => identity(item.problem)),
    );
    return [
      ...catalog
        .filter((problem) => problem.status === "PUBLISHED")
        .map(v02ProblemSummary),
      structuredClone(v02ExternalProblem),
    ].filter(
      (problem) =>
        (source === "ALL" || problem.problemRef.source === source) &&
        !solved.has(identity(problem)) &&
        (mode !== "LEVEL" || problem.difficultyScale === "CF_RATING"),
    );
  }
  function makeBatch(state, user, bound, config, query) {
    const batch = v02RecommendationBatch(query.source, query.mode);
    const latest = state.profiles.find((item) => item.window === "ALL");
    const problems = candidates(state, bound, config, query.source, query.mode);
    batch.batchId = nextId();
    batch.analysisSnapshotId = latest.snapshotId;
    batch.sourceFingerprint = latest.sourceFingerprint;
    batch.generatedAt = timestamp();
    batch.stale = !!config.stale;
    batch.candidateCount = problems.length;
    batch.recommendations = problems
      .slice(0, query.limit)
      .map((problem, index) => ({
        rank: index + 1,
        problem,
        score: 0.95 - index * 0.1,
        reasonCode:
          query.mode === "WEAKNESS"
            ? "WEAK_DIMENSION_MATCH"
            : problem.difficultyScale === "CF_RATING"
              ? "LEVEL_MATCH"
              : "DEFAULT_RECOMMENDATION",
        reason:
          problem.difficultyScale === "CF_RATING"
            ? "A comparable CF rating for implementation practice."
            : "Platform difficulty uses a separate scale; selected by tags and introductory practice rules.",
        matchedDimension: "IMPLEMENTATION",
        solvedSinceGeneration: false,
      }));
    batch.resultCount = batch.recommendations.length;
    return batch;
  }
  function readBatch(state, batch, bound, config) {
    if (!batch) return null;
    const copy = structuredClone(batch);
    const solved = new Set(
      events(state, bound, config)
        .filter((item) => item.status === "AC")
        .map((item) => identity(item.problem)),
    );
    copy.recommendations.forEach(
      (item) =>
        (item.solvedSinceGeneration = solved.has(identity(item.problem))),
    );
    copy.stale ||=
      fingerprint(state, bound, config) !== batch.sourceFingerprint;
    return copy;
  }
  function startAnalysis(state, submission, config, retry = false) {
    const unavailable =
      config.v02AnalysisUnavailable || submission.languageId !== "cpp17";
    submission.analysisId = unavailable ? null : nextId();
    submission.analysisStatus = unavailable ? "SKIPPED" : "QUEUED";
    submission.analysisRevision = unavailable ? 0 : 1;
    submission.analysisError = unavailable
      ? taskError(
          submission.languageId !== "cpp17"
            ? "LANGUAGE_NOT_ANALYZABLE"
            : "ANALYSIS_TEMPORARILY_UNAVAILABLE",
          submission.languageId === "cpp17",
        )
      : null;
    state.analyses.set(submission.submissionId, {
      analysisId: submission.analysisId,
      status: submission.analysisStatus,
      revision: submission.analysisRevision,
      result: null,
      error: submission.analysisError,
    });
    state.counters.set(`analysis:${submission.submissionId}`, {
      polls: 0,
      retry,
    });
  }
  function advanceJudge(state, submission, user, bound, config) {
    const counter = state.counters.get(`judge:${submission.submissionId}`);
    if (!counter) return;
    counter.polls++;
    if (
      submission.judgeStatus === "FAILED" &&
      submission.judgeTaskId === null &&
      submission.judgeError?.retryable &&
      config.v02RecoverLocalFailure !== false &&
      counter.polls >= 2
    ) {
      submission.judgeTaskId = nextId();
      submission.judgeStatus = "RUNNING";
      submission.judgeError = null;
      submission.judgeRevision++;
      return;
    }
    if (
      !pendingJudge(submission.judgeStatus) ||
      config.v02KeepJudge ||
      config.keepQueued ||
      config.keepRunning
    )
      return;
    submission.judgeStatus =
      counter.polls === 1
        ? "DISPATCHING"
        : counter.polls === 2
          ? "RUNNING"
          : (config.v02JudgeStatus ??
            (config.v02JudgeVerdict === "IE" ? "FAILED" : "COMPLETED"));
    if (submission.judgeStatus !== "DISPATCHING")
      submission.judgeTaskId ??= nextId();
    submission.judgeRevision++;
    submission.updatedAt = timestamp();
    if (!pendingJudge(submission.judgeStatus)) {
      if (submission.judgeStatus === "CANCELLED") submission.judgeResult = null;
      else {
        const verdict =
          config.v02JudgeVerdict ??
          (submission.judgeStatus === "FAILED" ? "IE" : "AC");
        submission.judgeResult = {
          verdict,
          timeMs: verdict === "CE" ? null : 12,
          memoryBytes: verdict === "CE" ? null : 1048576,
          passedTestCount: verdict === "AC" ? 12 : 0,
          totalTestCount: 12,
          score: null,
          compileLog:
            verdict === "CE" ? "main.cpp:3: expected ';' before return" : null,
          diagnosticCode: verdict === "IE" ? "SANDBOX_UNAVAILABLE" : null,
          judgedAt: timestamp(),
        };
        submission.judgeError =
          submission.judgeStatus === "FAILED"
            ? taskError("JUDGE_EXECUTION_FAILED")
            : null;
      }
      projectTraining(state, submission);
      appendProfiles(state, user, bound, { ...config, stale: false });
      if (submission.judgeStatus === "COMPLETED")
        startAnalysis(state, submission, config);
      state.batches.forEach((batch) => (batch.stale = true));
    }
  }
  function advanceAnalysis(state, submission, user, bound, config) {
    const view = state.analyses.get(submission.submissionId);
    const counter = state.counters.get(`analysis:${submission.submissionId}`);
    if (!counter || terminalAnalysis(view.status) || config.v02KeepAnalysis)
      return view;
    counter.polls++;
    view.status =
      counter.polls === 1
        ? "RUNNING"
        : ((counter.retry
            ? config.v02AnalysisRetryStatus
            : config.v02AnalysisStatus) ?? "SUCCEEDED");
    view.revision++;
    view.error = ["PARTIAL", "FAILED", "SKIPPED"].includes(view.status)
      ? taskError(
          view.status === "SKIPPED"
            ? "ANALYSIS_TEMPORARILY_UNAVAILABLE"
            : "TOOL_TIMEOUT",
        )
      : null;
    if (["SUCCEEDED", "PARTIAL"].includes(view.status)) {
      view.result = analysisResult(
        submission,
        state.sources.get(submission.submissionId),
        view.status === "PARTIAL",
      );
      state.evidence.set(submission.submissionId, view.result);
      appendProfiles(state, user, bound, { ...config, stale: false });
    }
    submission.analysisStatus = view.status;
    submission.analysisRevision = view.revision;
    submission.analysisError = view.error;
    submission.updatedAt = timestamp();
    return view;
  }

  function handle(context) {
    const {
      path,
      method,
      body,
      query,
      config,
      user,
      bound,
      data,
      paginated,
      error,
      request,
      response,
    } = context;
    if (!isV02Path(path)) return false;
    const roles = config.roles ?? (config.guest ? ["GUEST"] : user.roles);
    if (
      path.startsWith("/admin/")
        ? !roles.includes("ADMIN")
        : !path.startsWith("/platform-problems") &&
          path !== "/judge-languages" &&
          !roles.includes("STUDENT")
    ) {
      error("ROLE_REQUIRED", 403);
      return true;
    }
    if (
      config.publicOrigin &&
      method !== "GET" &&
      request.headers.origin !== config.publicOrigin
    ) {
      error("ORIGIN_REJECTED", 403);
      return true;
    }
    const state = initialize(user, bound, config);
    const send = (value, status = 200, headers) =>
      data(structuredClone(value), status, headers);
    const missing = (code) => {
      error(code, 404);
      return true;
    };
    const write = (create, status) => {
      const key = request.headers["idempotency-key"];
      if (!uuidSchema.safeParse(key).success) {
        error("INVALID_ARGUMENT", 400);
        return true;
      }
      const operation = `${path}:${key}`;
      const params = canonical(body);
      const previous = state.replay.get(operation);
      if (previous) {
        if (previous.params !== params) error("IDEMPOTENCY_CONFLICT", 409);
        else send(previous.value, 200);
        return true;
      }
      if (
        state.counters.has(operation) &&
        state.counters.get(operation) !== params
      ) {
        error("IDEMPOTENCY_CONFLICT", 409);
        return true;
      }
      if (config.v02InProgress && !state.counters.has(operation)) {
        state.counters.set(operation, params);
        error("REQUEST_IN_PROGRESS", 409, { "Retry-After": "2" });
        return true;
      }
      const value = create();
      if (value === undefined) return true;
      state.replay.set(operation, { params, value: structuredClone(value) });
      if (config.v02LoseResponse && !state.counters.has("lost-response")) {
        state.counters.set("lost-response", true);
        response.destroy();
        return true;
      }
      send(value, typeof status === "function" ? status() : status);
      return true;
    };
    if (path === "/judge-languages") {
      const capability = structuredClone(v02Languages);
      if (config.v02AnalysisUnavailable)
        capability.languages.forEach(
          (item) => (item.analysisSupported = false),
        );
      if (config.v02LanguageUnavailable)
        capability.languages = capability.languages.filter(
          (item) => item.languageId !== "c11",
        );
      capability.capabilityVersion = digest(
        canonical(
          [...capability.languages].sort((a, b) =>
            a.languageId.localeCompare(b.languageId),
          ),
        ),
      );
      send(capability);
      return true;
    }
    if (path === "/platform-problems") {
      const items = catalog
        .filter(
          (problem) =>
            problem.status === "PUBLISHED" &&
            (!query.q ||
              problem.title.toLowerCase().includes(query.q.toLowerCase())) &&
            (!query.tag || problem.tags.includes(query.tag)) &&
            (query.minDifficulty === undefined ||
              (problem.difficultyScale === "PLATFORM_RATING" &&
                problem.difficulty >= query.minDifficulty)) &&
            (query.maxDifficulty === undefined ||
              (problem.difficultyScale === "PLATFORM_RATING" &&
                problem.difficulty <= query.maxDifficulty)),
        )
        .sort(
          (a, b) =>
            b.updatedAt.localeCompare(a.updatedAt) ||
            (BigInt(a.problemRef.problemId) > BigInt(b.problemRef.problemId)
              ? -1
              : 1),
        )
        .map((problem) => ({
          ...v02ProblemSummary(problem),
          status: problem.status,
          catalogVersion: problem.catalogVersion,
          timeLimitMs: problem.timeLimitMs,
          memoryLimitBytes: problem.memoryLimitBytes,
          languageIds: problem.languageIds,
          updatedAt: problem.updatedAt,
        }));
      paginated(items);
      return true;
    }
    if (path.startsWith("/platform-problems/")) {
      const [, , problemId, , versionId] = path.split("/");
      const current = catalog.find(
        (item) => item.problemRef.problemId === problemId,
      );
      const problem = versionId ? versions.get(versionId) : current;
      if (
        !current ||
        !problem ||
        problem.problemRef.problemId !== problemId ||
        (!versionId && current.status !== "PUBLISHED") ||
        (versionId &&
          problem.status === "DRAFT" &&
          !roles.includes("ADMIN") &&
          ![...state.submissions.values()].some(
            (item) => item.problem.problemRef.problemVersionId === versionId,
          ))
      )
        return missing("PROBLEM_NOT_FOUND");
      send({
        ...problem,
        statement:
          config.v02UnsafeStatement &&
          problemId === v02Problems[0].problemRef.problemId
            ? { ...problem.statement, content: v02UnsafeStatement }
            : problem.statement,
        status: problem.status === "DRAFT" ? "DRAFT" : current.status,
        catalogVersion: current.catalogVersion,
      });
      return true;
    }
    if (path === "/submissions" && method === "POST")
      return write(() => {
        if (body.problemRef.source !== "PLATFORM") {
          error("INVALID_PROBLEM_REF", 400);
          return;
        }
        if (!body.sourceCode.trim()) {
          error("INVALID_ARGUMENT", 400);
          return;
        }
        if (Buffer.byteLength(body.sourceCode, "utf8") > 262144) {
          error("SOURCE_TOO_LARGE", 413);
          return;
        }
        const problem = catalog.find(
          (item) => item.problemRef.problemId === body.problemRef.problemId,
        );
        if (!problem) {
          error("PROBLEM_NOT_FOUND", 404);
          return;
        }
        if (problem.status !== "PUBLISHED") {
          error("PROBLEM_NOT_SUBMITTABLE", 409);
          return;
        }
        if (config.v02VersionConflict) {
          const next = structuredClone(problem);
          next.problemRef.problemVersionId = nextId();
          next.catalogVersion = advanceCatalog();
          Object.assign(problem, next);
          versions.set(next.problemRef.problemVersionId, structuredClone(next));
          config.v02VersionConflict = false;
        }
        if (
          problem.problemRef.problemVersionId !==
          body.problemRef.problemVersionId
        ) {
          error("PROBLEM_VERSION_CONFLICT", 409);
          return;
        }
        if (
          !problem.languageIds.includes(body.languageId) ||
          !v02Languages.languages.some(
            (item) => item.languageId === body.languageId,
          ) ||
          (config.v02LanguageUnavailable && body.languageId === "c11")
        ) {
          error("LANGUAGE_NOT_SUPPORTED", 409);
          return;
        }
        const selected =
          body.trainingRecordId &&
          [...state.training.values()].find(
            (item) =>
              item.trainingRecordId === body.trainingRecordId &&
              identity(item.problem) === identity(problem),
          );
        if (body.trainingRecordId && !selected) {
          error("TRAINING_RECORD_NOT_FOUND", 404);
          return;
        }
        const submission = v02Submission(String(++submissionSequence), {
          problem: v02ProblemSummary(problem),
          languageId: body.languageId,
          judgeTaskId: null,
          judgeStatus: config.v02JudgeLocalFailure ? "FAILED" : "QUEUED",
          judgeRevision: 0,
          judgeResult: null,
          judgeError: config.v02JudgeLocalFailure
            ? taskError("JUDGE_UNAVAILABLE", config.v02JudgeRetryable !== false)
            : null,
          analysisId: null,
          analysisStatus: "NOT_REQUESTED",
          analysisRevision: 0,
          analysisError: null,
          submittedAt: timestamp(),
          updatedAt: timestamp(),
        });
        state.submissions.set(submission.submissionId, submission);
        state.sources.set(submission.submissionId, body.sourceCode);
        state.analyses.set(submission.submissionId, {
          analysisId: null,
          status: "NOT_REQUESTED",
          revision: 0,
          result: null,
          error: null,
        });
        state.counters.set(`judge:${submission.submissionId}`, { polls: 0 });
        projectTraining(state, submission);
        return submission;
      }, 202);
    if (path === "/submissions") {
      paginated(
        [...state.submissions.values()]
          .filter(
            (item) =>
              (!query.problemId ||
                item.problem.problemRef.problemId === query.problemId) &&
              (!query.judgeStatus || item.judgeStatus === query.judgeStatus) &&
              (!query.verdict || item.judgeResult?.verdict === query.verdict) &&
              (!query.from || item.submittedAt >= query.from) &&
              (!query.to || item.submittedAt < query.to),
          )
          .sort(
            (a, b) =>
              b.submittedAt.localeCompare(a.submittedAt) ||
              (BigInt(a.submissionId) > BigInt(b.submissionId) ? -1 : 1),
          ),
      );
      return true;
    }
    if (path.startsWith("/submissions/")) {
      const submissionId = path.split("/")[2];
      const submission = state.submissions.get(submissionId);
      if (!submission) return missing("SUBMISSION_NOT_FOUND");
      if (path.endsWith("/source"))
        send(
          {
            submissionId,
            sourceCode: state.sources.get(submissionId),
            sourceSha256: digest(state.sources.get(submissionId)),
            languageId: submission.languageId,
          },
          200,
          { "Cache-Control": "private, no-store" },
        );
      else if (path.endsWith("/analysis/retry")) {
        let alreadyActive = false;
        return write(
          () => {
            if (submission.analysisStatus === "SUCCEEDED") {
              error("ANALYSIS_ALREADY_COMPLETE", 409);
              return;
            }
            if (
              submission.judgeStatus !== "COMPLETED" ||
              submission.languageId !== "cpp17"
            ) {
              error("ANALYSIS_NOT_RETRYABLE", 409);
              return;
            }
            if (config.v02AnalysisUnavailable) {
              error("ALGORITHM_UNAVAILABLE", 503);
              return;
            }
            if (["QUEUED", "RUNNING"].includes(submission.analysisStatus)) {
              alreadyActive = true;
              return state.analyses.get(submissionId);
            }
            startAnalysis(state, submission, config, true);
            return state.analyses.get(submissionId);
          },
          () => (alreadyActive ? 200 : 202),
        );
      } else if (path.endsWith("/analysis"))
        send(advanceAnalysis(state, submission, user, bound, config));
      else {
        advanceJudge(state, submission, user, bound, config);
        send(submission);
      }
      return true;
    }
    if (path === "/me/training-records" && method === "POST") {
      let existing;
      return write(
        () => {
          const ref = body.problemRef;
          const problem =
            ref.source === "PLATFORM"
              ? versions.get(ref.problemVersionId)
              : [
                  v02ExternalProblem,
                  ...sourceEvents(bound, config).map((item) => item.problem),
                ].find((item) => identity(item) === identity(ref));
          if (!problem || identity(problem) !== identity(ref)) {
            error("RESOURCE_NOT_FOUND", 404);
            return;
          }
          if (body.recommendationBatchId) {
            const batch = state.batches.find(
              (item) => item.batchId === body.recommendationBatchId,
            );
            if (
              !batch?.recommendations.some(
                (item) => identity(item.problem) === identity(ref),
              )
            ) {
              error("RESOURCE_NOT_FOUND", 404);
              return;
            }
          }
          existing = state.training.has(identity(ref));
          return trainingRecord(
            state,
            problem,
            body.recommendationBatchId ?? null,
          );
        },
        () => (existing ? 200 : 201),
      );
    }
    if (path === "/me/training-records") {
      projectExternal(state, bound, config);
      paginated(
        [...state.training.values()]
          .filter(
            (item) =>
              (!query.source ||
                item.problem.problemRef.source === query.source) &&
              (!query.status || item.status === query.status) &&
              (!query.from ||
                (item.lastSubmittedAt && item.lastSubmittedAt >= query.from)) &&
              (!query.to ||
                (item.lastSubmittedAt && item.lastSubmittedAt < query.to)),
          )
          .sort(
            (a, b) =>
              b.updatedAt.localeCompare(a.updatedAt) ||
              b.trainingRecordId.localeCompare(a.trainingRecordId),
          ),
      );
      return true;
    }
    if (path.startsWith("/me/training-records/")) {
      projectExternal(state, bound, config);
      const record = [...state.training.values()].find(
        (item) => item.trainingRecordId === path.split("/")[3],
      );
      if (!record) return missing("TRAINING_RECORD_NOT_FOUND");
      send(record);
      return true;
    }
    if (path === "/me/learning-profile/rebuild") {
      let alreadyActive = false;
      return write(
        () => {
          if (sourceNotReady(bound)) {
            error("USER_SOURCE_NOT_READY", 409);
            return;
          }
          const existing = [...state.jobs.values()].find((item) =>
            ["QUEUED", "RUNNING"].includes(item.status),
          );
          if (existing) {
            alreadyActive = true;
            return existing;
          }
          const job = {
            jobId: nextId(),
            status: "QUEUED",
            sourceFingerprint: fingerprint(state, bound, config),
            profileJobId: null,
            error: null,
            createdAt: timestamp(),
            updatedAt: timestamp(),
            finishedAt: null,
          };
          state.jobs.set(job.jobId, job);
          return job;
        },
        () => (alreadyActive ? 200 : 202),
      );
    }
    if (path.startsWith("/learning-profile-jobs/")) {
      const job = state.jobs.get(path.split("/")[2]);
      if (!job) return missing("TASK_NOT_FOUND");
      if (job.status === "QUEUED") job.status = "RUNNING";
      else if (job.status === "RUNNING" && !config.v02KeepProfileJob) {
        job.status = config.v02ProfileJobFailed ? "FAILED" : "SUCCEEDED";
        job.finishedAt = timestamp();
        if (job.status === "FAILED")
          job.error = taskError("PROFILE_COMPUTATION_FAILED");
        else {
          job.profileJobId = nextId();
          job.sourceFingerprint = fingerprint(state, bound, config);
          appendProfiles(
            state,
            user,
            bound,
            { ...config, stale: false },
            job.profileJobId,
          );
        }
      }
      job.updatedAt = timestamp();
      send(job);
      return true;
    }
    if (path === "/me/learning-profile/latest") {
      const latest = state.profiles.find(
        (item) => item.window === query.window,
      );
      send(
        latest
          ? {
              ...latest,
              stale:
                latest.stale ||
                currentSourcesStale(bound) ||
                fingerprint(state, bound, config) !== latest.sourceFingerprint,
            }
          : null,
      );
      return true;
    }
    if (path === "/me/learning-profile/history") {
      paginated(
        state.profiles
          .filter((item) => item.window === query.window)
          .sort(
            (a, b) =>
              b.dataCutoffAt.localeCompare(a.dataCutoffAt) ||
              b.createdAt.localeCompare(a.createdAt) ||
              b.snapshotId.localeCompare(a.snapshotId),
          ),
      );
      return true;
    }
    if (path.startsWith("/me/learning-profile/")) {
      const snapshot = state.profiles.find(
        (item) => item.snapshotId === path.split("/")[3],
      );
      if (!snapshot) return missing("RESOURCE_NOT_FOUND");
      send(snapshot);
      return true;
    }
    if (path === "/me/recommendations/generate")
      return write(() => {
        const latest = state.profiles.find((item) => item.window === "ALL");
        if (
          !latest ||
          latest.stale ||
          currentSourcesStale(bound) ||
          fingerprint(state, bound, config) !== latest.sourceFingerprint
        ) {
          error("PROFILE_NOT_READY", 409);
          return;
        }
        const batch = makeBatch(state, user, bound, config, body);
        state.batches.unshift(batch);
        return batch;
      }, 201);
    if (path === "/me/recommendations/latest") {
      send(
        readBatch(
          state,
          state.batches
            .filter(
              (item) =>
                item.source === query.source && item.mode === query.mode,
            )
            .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt))[0],
          bound,
          config,
        ),
      );
      return true;
    }
    if (path === "/me/recommendations/history") {
      paginated(
        state.batches
          .filter(
            (item) =>
              (!query.source || item.source === query.source) &&
              (!query.mode || item.mode === query.mode),
          )
          .sort(
            (a, b) =>
              b.generatedAt.localeCompare(a.generatedAt) ||
              b.batchId.localeCompare(a.batchId),
          )
          .map((item) => readBatch(state, item, bound, config)),
      );
      return true;
    }
    if (path.startsWith("/me/recommendations/")) {
      const batch = state.batches.find(
        (item) => item.batchId === path.split("/")[3],
      );
      if (!batch) return missing("RESOURCE_NOT_FOUND");
      send(readBatch(state, batch, bound, config));
      return true;
    }
    if (path === "/admin/problem-imports")
      return write(() => {
        const job = {
          importJobId: nextId(),
          requestId: nextId(),
          revision: 1,
          status: "QUEUED",
          error: null,
          createdAt: timestamp(),
          updatedAt: timestamp(),
          finishedAt: null,
          source: body.source,
          repositoryUrl: body.repositoryUrl,
          sourceRevision: body.revision,
          packageCount: body.packagePaths.length,
          completedPackageCount: 0,
          items: body.packagePaths.map((packagePath) => ({
            packagePath,
            status: "PENDING",
            problemId: null,
            problemVersionId: null,
            licenseStatus: "PENDING",
            validationStatus: "PENDING",
            errors: [],
          })),
        };
        imports.set(job.importJobId, job);
        return job;
      }, 202);
    if (path.startsWith("/admin/problem-imports/")) {
      const job = imports.get(path.split("/")[3]);
      if (!job) return missing("TASK_NOT_FOUND");
      if (job.status === "QUEUED") job.status = "RUNNING";
      else if (job.status === "RUNNING") {
        job.items.forEach((item, index) => {
          const rejected =
            config.v02ImportFailed || (config.v02ImportPartial && index > 0);
          item.status = rejected ? "REJECTED" : "VALIDATED";
          item.licenseStatus = rejected ? "MISSING" : "VERIFIED";
          item.validationStatus = rejected ? "FAILED" : "PASSED";
          item.errors = rejected
            ? [taskError("PACKAGE_LICENSE_MISSING", false)]
            : [];
          if (!rejected) {
            item.problemId = catalog[3].problemRef.problemId;
            item.problemVersionId = catalog[3].problemRef.problemVersionId;
          }
        });
        job.completedPackageCount = job.packageCount;
        job.status = job.items.every((item) => item.status === "VALIDATED")
          ? "SUCCEEDED"
          : job.items.some((item) => item.status === "VALIDATED")
            ? "PARTIAL"
            : "FAILED";
        job.finishedAt = timestamp();
      }
      job.revision++;
      job.updatedAt = timestamp();
      send(job);
      return true;
    }
    if (path.startsWith("/admin/platform-problems/"))
      return write(
        () => {
          const problem = catalog.find(
            (item) => item.problemRef.problemId === path.split("/")[3],
          );
          if (!problem) {
            error("PROBLEM_NOT_FOUND", 404);
            return;
          }
          if (path.endsWith("/metadata-versions")) {
            if (
              problem.problemRef.problemVersionId !== body.baseProblemVersionId
            ) {
              error("PROBLEM_VERSION_CONFLICT", 409);
              return;
            }
            const draft = {
              ...structuredClone(problem),
              problemRef: { ...problem.problemRef, problemVersionId: nextId() },
              status: "DRAFT",
              tags: body.tags,
              difficulty: body.difficulty,
              difficultyScale: body.difficultyScale,
              updatedAt: timestamp(),
            };
            versions.set(draft.problemRef.problemVersionId, draft);
            return draft;
          }
          if (path.endsWith("/publish")) {
            const version = versions.get(body.problemVersionId);
            if (
              !version ||
              version.problemRef.problemId !== problem.problemRef.problemId
            ) {
              error("PROBLEM_VERSION_CONFLICT", 409);
              return;
            }
            if (config.v02LicenseMissing) {
              error("PACKAGE_LICENSE_MISSING", 422);
              return;
            }
            Object.assign(problem, structuredClone(version), {
              status: "PUBLISHED",
              catalogVersion: advanceCatalog(),
              updatedAt: timestamp(),
            });
            versions.set(body.problemVersionId, structuredClone(problem));
            return problem;
          }
          problem.status = "WITHDRAWN";
          problem.catalogVersion = advanceCatalog();
          problem.updatedAt = timestamp();
          return {
            problemId: problem.problemRef.problemId,
            status: "WITHDRAWN",
            catalogVersion: problem.catalogVersion,
          };
        },
        path.endsWith("/metadata-versions") ? 201 : 200,
      );
    return missing("RESOURCE_NOT_FOUND");
  }
  function sourceChanged({ user, bound, config, event }) {
    const state = initialize(user, bound, config);
    if (event === "sync-completed") projectExternal(state, bound, config);
    const currentFingerprint = fingerprint(state, bound, config);
    state.batches.forEach(
      (batch) =>
        (batch.stale ||= batch.sourceFingerprint !== currentFingerprint),
    );
    if (sourceNotReady(bound)) return;
    const latest = state.profiles.find((item) => item.window === "ALL");
    if (!latest || latest.sourceFingerprint !== currentFingerprint) {
      // The legacy mutation/task event advances the synthetic scheduled projection.
      appendProfiles(state, user, bound, { ...config, stale: false });
    }
  }
  return { reset, handle, sourceChanged };
}
