# CodeStartrack / 码练星轨 V0.11 前端 API

## 服务与部署边界

```text
Browser → Frontend Service（frontend:80）→ Backend Service（backend:8081）
                                              ├→ PostgreSQL（postgres:5432）
                                              └→ Algorithm Service（algorithm:8000）
```

Frontend、Backend、Algorithm 各有独立代码、Dockerfile、依赖锁文件、构建命令和启动命令，可以独立构建、启动、部署。PostgreSQL 是基础设施。Frontend 负责页面、组件、交互、状态、API DTO 和 Mock；浏览器同源请求 `/api/v1/**`，由 frontend 反向代理到 `http://backend:8081`。Backend 是业务数据库唯一读写入口，负责认证权限、Codeforces Provider、标准化、同步和结果校验落库。Algorithm 是无状态独立 HTTP 服务，只接收后端 DTO，返回统计、六维画像和推荐。

Frontend 不连接数据库、不调用 Algorithm 或 Codeforces；Algorithm 不连接数据库、不调用 Codeforces，不接收密码、Session、Cookie，不依赖前端框架或后端 ORM。浏览器点击后端提供的原题链接属于页面导航，不是调用 Codeforces 数据 API。容器间地址使用服务名，不使用 localhost 或 127.0.0.1。

## 公开协议

所有路径加 `/api/v1`。JSON 使用 camelCase，Content-Type 为 application/json。下方 TypeScript 是跨语言 JSON 契约：未带 `?` 的字段必须出现，只有 `| null` 可为 null，数组始终为 Array，空数组为 `[]`。无 Request 的接口不发送 body；无 Query 的接口不发送参数。未知输入字段拒绝为 400，未声明的省略参数使用表中默认值。响应不得省略 nullable 字段。

ID（accountId/problemId/submissionId/externalSubmissionId）均为十进制字符串；snapshotId/analysisSnapshotId/batchId/jobId/publicId/requestId 为 UUID 字符串。数值难度、Rating、计数、分数为 JSON number。timeMs 为毫秒，memoryBytes 为字节；显示 MiB 时除以 1048576。所有 Instant 是 UTC，禁止省略时区或使用省略号时间。

普通成功为 `ApiResponse<T>`，分页成功为 `PageResponse<T>`；表中响应列写 T，分页明确标注 Page。204 没有 body。统一错误为 ApiError，客户端按 error.code 判断。分页默认 page=1、pageSize=20，范围 page≥1、1≤pageSize≤100；total 为过滤后总条数，hasNext=page*pageSize<total，超出末页返回空数组。每次请求内 total 与列表用同一数据库快照，跨页有新数据时允许变化。

认证使用后端不透明 Session Cookie：`cst_session`，HttpOnly、SameSite=Lax、Path=/，生产 Secure，固定 7 天有效。前端请求 `credentials: "include"`；不保存令牌，不存在刷新 Token 接口。登录/注册由 Set-Cookie 写入；退出、改密、重置密码及换邮箱撤销相应 Session。所有写请求由后端校验 Origin 等于配置 PUBLIC_ORIGIN；frontend 保留 Origin。只支持同源代理部署。开发 HTTP 可将 COOKIE_SECURE=false；生产必须 HTTPS。

除 `/auth/captcha`、`/auth/email-codes` 的注册/重置用途、`/auth/register`、`/auth/login`、`/auth/logout`、`/auth/password/reset` 外，均须登录。个人业务要求 STUDENT 角色；GUEST 仅可看公共页面和本地 Demo。后端逐次校验 Session、用户状态、角色与资源归属；他人或不存在的 account/job/snapshot/batch 返回同类 404，不能通过任意 userId 读取数据。

## 公共 DTO

```ts
type Id = string; // PostgreSQL bigint 的十进制正整数字符串；禁止转 JS number
type UUID = string; // 标准 UUID 字符串
type Instant = string; // ISO 8601 UTC，例 2026-10-02T02:30:00Z
type DateKey = string; // YYYY-MM-DD，按 timezone 的自然日
type AnalysisWindow = "7D" | "30D" | "365D" | "ALL";
type RecommendationMode = "LEVEL" | "WEAKNESS" | "HYBRID";
type Verdict = "ACCEPTED" | "PARTIAL" | "WRONG_ANSWER" | "TIME_LIMIT"
  | "MEMORY_LIMIT" | "RUNTIME_ERROR" | "COMPILE_ERROR" | "SKIPPED"
  | "CHALLENGED" | "IDLENESS_LIMIT" | "PRESENTATION_ERROR" | "PENDING" | "OTHER";
type DimensionCode = "IMPLEMENTATION" | "ALGORITHMS" | "DATA_STRUCTURES"
  | "DYNAMIC_PROGRAMMING" | "GRAPHS" | "MATH";
type ReasonCode = "WEAK_DIMENSION_MATCH" | "LEVEL_MATCH" | "SLIGHTLY_ABOVE_LEVEL"
  | "TAG_MATCH" | "BALANCED_PRACTICE" | "RECENT_WEAKNESS" | "LOW_ATTEMPT_COVERAGE"
  | "RATING_GROWTH_STEP" | "MIXED_SKILL_MATCH" | "DEFAULT_RECOMMENDATION";
interface Period { start: Instant | null; end: Instant }
interface Summary {
  attemptedProblemCount: number; solvedCount: number; unsolvedProblemCount: number;
  submissionCount: number; acceptedSubmissionCount: number;
  failedSubmissionCount: number; pendingSubmissionCount: number;
  ratedSolvedCount: number; unratedSolvedCount: number;
  averageSolvedDifficulty: number | null; maxSolvedDifficulty: number | null;
  activeDays: number;
}
interface TagStat {
  tag: string; attemptedProblemCount: number; solvedCount: number; submissionCount: number;
}
interface DifficultyStat {
  difficulty: number | null; attemptedProblemCount: number; solvedCount: number;
}
interface ActivityStat {
  date: DateKey; submissionCount: number; acceptedSubmissionCount: number;
  failedSubmissionCount: number; pendingSubmissionCount: number; solvedCount: number;
}
interface DimensionScore {
  code: DimensionCode; name: string; displayOrder: number; score: number;
  attemptedProblemCount: number; solvedCount: number; submissionCount: number;
  averageSolvedDifficulty: number | null; rankOrder: number;
}
interface AnalysisResult {
  window: AnalysisWindow; period: Period; summary: Summary;
  currentRating: number | null; maxRating: number | null;
  overallScore: number; dimensions: DimensionScore[];
  weakestDimension: DimensionCode;
  tagStats: TagStat[]; difficultyStats: DifficultyStat[]; activityStats: ActivityStat[];
}
type JobStatus = "QUEUED" | "RUNNING" | "SUCCESS" | "PARTIAL" | "FAILED";
type JobScope = "ACCOUNT_FULL" | "ANALYSIS_ONLY" | "PROBLEM_CATALOG";
type JobStage = "USER_INFO" | "SUBMISSIONS" | "RATING_HISTORY" | "PROBLEM_CATALOG" | "ANALYSIS" | "DONE";
interface UserDto {
  publicId: UUID; username: string; displayName: string | null; email: string;
  avatarUrl: string | null; emailVerified: boolean;
  accountStatus: "ACTIVE" | "LOCKED" | "DISABLED" | "DELETED";
  roles: string[]; primaryRole: string; locale: string; timezone: string;
}
interface OjAccountDto {
  accountId: Id; platform: "codeforces"; username: string;
  bindStatus: "ACTIVE" | "INVALID" | "UNBOUND";
  rating: number | null; maxRating: number | null; rank: string | null; maxRank: string | null;
  contribution: number | null; friendOfCount: number | null;
  firstName: string | null; lastName: string | null; country: string | null;
  city: string | null; organization: string | null; avatarUrl: string | null;
  titlePhotoUrl: string | null; registeredAt: Instant | null; lastOnlineAt: Instant | null;
  lastSyncedAt: Instant | null; lastSyncStatus: JobStatus | null;
  nextSyncAt: Instant | null; boundAt: Instant; unboundAt: Instant | null;
}
interface JobError { stage: JobStage; code: string; message: string; retryable: boolean }
interface SyncJobDto {
  jobId: UUID; accountId: Id | null; scope: JobScope;
  triggerType: "MANUAL" | "SCHEDULED" | "SYSTEM"; status: JobStatus;
  stage: JobStage | null; itemsFetched: number; itemsInserted: number; itemsUpdated: number;
  errors: JobError[]; requestedAt: Instant; startedAt: Instant | null; finishedAt: Instant | null;
}
interface SyncStatusDto {
  accountId: Id; lastSyncedAt: Instant | null; lastSyncStatus: JobStatus | null;
  nextSyncAt: Instant | null; latestJob: SyncJobDto | null;
}
interface ProblemDto {
  problemId: Id; platform: "codeforces"; externalProblemKey: string;
  title: string | null; difficulty: number | null; points: number | null;
  tags: string[]; solvedCount: number | null; url: string | null;
  isGym: boolean; catalogSource: "CATALOG" | "INFERRED";
}
interface ProblemProgressDto {
  accountId: Id; problem: ProblemDto;
  progress: { attemptCount: number; accepted: boolean; acceptedSubmissionCount: number;
    failedSubmissionCount: number; pendingSubmissionCount: number;
    firstSubmittedAt: Instant; lastSubmittedAt: Instant; acceptedAt: Instant | null };
}
interface SubmissionDto {
  submissionId: Id; accountId: Id; externalSubmissionId: Id; problem: ProblemDto;
  verdict: Verdict; verdictRaw: string | null; programmingLanguage: string | null;
  participantType: string | null; memberHandles: string[]; teamId: Id | null;
  teamName: string | null; testset: string | null; passedTestCount: number | null;
  timeMs: number | null; memoryBytes: number | null; submittedAt: Instant;
}
interface RatingChangeDto {
  accountId: Id; contestId: number; contestName: string; rank: number;
  oldRating: number; newRating: number; occurredAt: Instant;
}
interface AnalysisDto extends AnalysisResult {
  accountId: Id; snapshotId: UUID; algorithmVersion: string; mappingVersion: string;
  timezone: string; dataCutoffAt: Instant; sourceDataVersion: Id;
  createdAt: Instant; stale: boolean;
}
interface RecommendationDto {
  rank: number; problem: ProblemDto; score: number; reasonCode: ReasonCode; reason: string;
  matchedDimension: DimensionCode | null; solvedSinceGeneration: boolean;
}
interface RecommendationBatchDto {
  accountId: Id; batchId: UUID; analysisSnapshotId: UUID; mode: RecommendationMode;
  targetRating: number; targetDimension: DimensionCode | null;
  algorithmVersion: string; mappingVersion: string;
  candidateCount: number; resultCount: number; recommendations: RecommendationDto[];
  generatedAt: Instant; stale: boolean;
}
interface DashboardDto {
  accountId: Id; account: OjAccountDto; sync: SyncStatusDto;
  analysis: AnalysisDto | null; recommendationBatch: RecommendationBatchDto | null;
  nextAction: "SYNC" | "WAIT_SYNC" | "REBUILD_ANALYSIS" | "GENERATE_RECOMMENDATIONS" | "NONE";
}
interface ApiResponse<T> { data: T; requestId: UUID }
interface PageResponse<T> {
  data: T[]; meta: { page: number; pageSize: number; total: number; hasNext: boolean };
  requestId: UUID;
}
interface ApiError {
  error: { code: string; message: string; details: Record<string, unknown> }; requestId: UUID;
}
```

## 认证与用户 API

请求体记法 `{field: Type}` 为完整 JSON 类型，不是示例 JSON；所有 string 默认必填且非空。用户名为 3–32 位 ASCII 字母、数字、下划线，大小写不敏感；密码 12–128 字符，不 trim；邮箱 trim 后小写参与唯一性比较。邮箱代码为 6 位数字字符串。

| 方法与路径                | Request                                                                                                                                                  | 成功状态及响应 T                                                                                                                  |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| POST /auth/captcha        | 无                                                                                                                                                       | 200`{challengeId: UUID, imageData: string, expiresInSeconds: number}`；imageData 为 PNG data URL（base64）；有效 180 秒，一次性 |
| POST /auth/email-codes    | `{email: string, purpose: "REGISTER"\|"PASSWORD_RESET"\|"EMAIL_CHANGE_OLD"\|"EMAIL_CHANGE_NEW", captchaChallengeId: UUID, captchaAnswer: string}`         | 202`{verificationId: UUID, cooldownSeconds: number, expiresInSeconds: number}`；60、600 秒                                      |
| POST /auth/register       | `{username: string, email: string, password: string, verificationId: UUID, emailCode: string}`                                                         | 201`{user: UserDto}`；验证邮箱、注册并登录，默认 STUDENT                                                                        |
| POST /auth/login          | `{account: string, password: string, captchaChallengeId: UUID, captchaAnswer: string}`                                                                 | 200`{user: UserDto, requiresOjBinding: boolean}`；account 为用户名或邮箱；无 ACTIVE/INVALID 绑定才需绑定                        |
| POST /auth/logout         | 无                                                                                                                                                       | 204；当前 Session 撤销，无有效会话也成功                                                                                          |
| POST /auth/logout-all     | 无                                                                                                                                                       | 200`{revokedSessions: number}`；所有设备下线                                                                                    |
| GET /me                   | 无                                                                                                                                                       | 200 UserDto                                                                                                                       |
| GET /me/roles             | 无                                                                                                                                                       | 200`{primaryRole: string, roles: Array<{code: string, name: string}>}`                                                          |
| POST /me/password/change  | `{currentPassword: string, newPassword: string}`                                                                                                       | 200`{changed: true, reauthRequired: true}`；全部会话撤销                                                                        |
| POST /auth/password/reset | `{email: string, verificationId: UUID, emailCode: string, newPassword: string}`                                                                        | 200`{reset: true}`；全部会话撤销                                                                                                |
| POST /me/email/change     | `{password: string, oldEmail: string, oldVerificationId: UUID, oldEmailCode: string, newEmail: string, newVerificationId: UUID, newEmailCode: string}` | 200`{email: string, emailVerified: true, reauthRequired: true}`；全部会话撤销                                                   |

图形验证码每次发送邮箱代码、每次登录都需要；错误或提交后刷新 challenge。邮件发送按同邮箱跨用途至少 60 秒一次，并按 IP 限流；错误时返回 429 和 Retry-After 秒数。更换邮箱的两个用途必须登录，OLD 必须等于当前邮箱，NEW 必须未占用；最终换邮箱同时验证密码、旧/新两份未过期代码与所属用户。验证码最多错误 5 次、有效 600 秒、一次性事务消费。注册已含邮箱验证，邮箱验证页面用于录入验证码，不另造未定义的验证端点。找回密码邮件端点对不存在的邮箱也返回同形 202，使用不可兑换的 verificationId，不泄漏存在性。

## 多 CF 账号、同步 API

一个用户可同时绑定多个不同 CF。handle trim、小写仅用于冲突比较，显示以 user.info 返回的 canonical handle 为准；有效绑定包括 ACTIVE 和 INVALID。同一有效 CF 只能属于一个用户。绑定是公开数据关联，不宣称已经验证用户掌握该 CF 登录凭据。

每次解绑永久结束本次绑定，保留旧 accountId 的历史和原 userId；之后任何用户重新绑定已释放 handle 都新建 accountId，从公开 CF 数据重新同步，不转移旧快照、同步任务、推荐历史。原用户重绑也新建记录。有效占用时其他用户绑定返回 409 OJ_ACCOUNT_OWNERSHIP_CONFLICT；同用户重复绑定返回 409 OJ_ACCOUNT_ALREADY_BOUND，details.accountId 指向现有记录。INVALID 仍占位，可手动重试同步；短暂上游网络失败不改为 INVALID。

| 方法与路径                                     | Request / Query                                | 成功状态及响应 T                                                                            |
| ---------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------- |
| POST /oj-accounts                              | `{platform: "codeforces", username: string}` | 201`{account: OjAccountDto, initialSync: SyncJobDto}`；绑定和创建 QUEUED 任务同一事务     |
| GET /oj-accounts                               | `includeUnbound=false`，boolean，分页参数    | 200 Page<OjAccountDto></ojaccountdto>；默认 ACTIVE/INVALID，按 boundAt DESC、accountId DESC |
| GET /oj-accounts/{accountId}                   | 无                                             | 200 OjAccountDto；可读自己 UNBOUND 历史                                                     |
| DELETE /oj-accounts/{accountId}                | 无                                             | 204；幂等软解绑；停止后续写入与定时同步                                                     |
| POST /oj-accounts/{accountId}/sync             | 无                                             | 202 SyncJobDto，ACCOUNT_FULL；已有 QUEUED/RUNNING 时返回同一任务                            |
| GET /sync-jobs/{jobId}                         | 无                                             | 200 SyncJobDto；普通用户仅能读取自己账号任务                                                |
| GET /oj-accounts/{accountId}/sync-status       | 无                                             | 200 SyncStatusDto                                                                           |
| POST /oj-accounts/{accountId}/analysis/rebuild | 无                                             | 202 SyncJobDto，ANALYSIS_ONLY；一次重建四个窗口，已有在途账号任务则返回该任务               |

手动同步/重建在无在途任务时，每 accountId 至少间隔 60 秒，否则 429 SYNC_RATE_LIMITED。UNBOUND 可以读历史，sync/rebuild/recommendations/generate 返回 409 OJ_ACCOUNT_UNBOUND。INVALID 可以手动同步和解绑，rebuild/generate 返回 409 OJ_ACCOUNT_INVALID。lastSyncedAt 表示 USER_INFO、SUBMISSIONS、RATING_HISTORY 全部成功的时间，不依赖分析是否成功。

QUEUED/RUNNING 为处理中，SUCCESS 为全部完成，PARTIAL 为有成功阶段/已提交数据但部分失败，FAILED 为无任何可保留成功阶段。errors 是数组，失败项明确 stage/code/retryable；分析服务故障显示 ANALYSIS 阶段错误，已经同步的提交仍可查询。只重建分析不会修改 lastSyncedAt。

## 账号数据与统计 API

以下每条路径都要求 accountId，不提供隐式“当前唯一账号”。

| 方法与路径                                         | Query（均可省略）                                                                                                               | 成功状态及响应 T                                  |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| GET /oj-accounts/{accountId}/problems              | 分页；status=ALL（ALL/SOLVED/UNSOLVED），tag 精确匹配，minDifficulty/maxDifficulty 整数，sort=LAST_SUBMITTED_DESC（唯一排序值） | 200 Page<ProblemProgressDto></problemprogressdto> |
| GET /oj-accounts/{accountId}/submissions           | 分页；verdict: Verdict，problemId: Id，from/to: Instant                                                                         | 200 Page<SubmissionDto></submissiondto>           |
| GET /oj-accounts/{accountId}/rating-changes        | 分页                                                                                                                            | 200 Page<RatingChangeDto></ratingchangedto>       |
| GET /oj-accounts/{accountId}/training/overview     | window=30D（AnalysisWindow）                                                                                                    | 200 AnalysisDto 或 null                           |
| GET /oj-accounts/{accountId}/analysis/latest       | window=ALL（AnalysisWindow）                                                                                                    | 200 AnalysisDto 或 null                           |
| GET /oj-accounts/{accountId}/analysis/history      | window=ALL，分页                                                                                                                | 200 Page<AnalysisDto></analysisdto>               |
| GET /oj-accounts/{accountId}/analysis/{snapshotId} | 无                                                                                                                              | 200 AnalysisDto                                   |
| GET /oj-accounts/{accountId}/dashboard             | 无                                                                                                                              | 200 DashboardDto                                  |

做题列表只含当前 accountId 有提交的题，按 lastSubmittedAt DESC、problemId DESC；SOLVED 为全历史至少一次 AC，UNSOLVED 为有提交且从未 AC。难度过滤时 null 不匹配，两个边界包含且 min≤max。提交列表按 submittedAt DESC、submissionId DESC；from 包含、to 不包含，无边界代表不限。Rating 列表按 occurredAt DESC、contestId DESC。分析历史按 dataCutoffAt DESC、createdAt DESC、snapshotId DESC，最新使用同序取第一条。不存在 snapshotId 返回 404 RESOURCE_NOT_FOUND。

training/overview 返回完整 AnalysisDto，直接使用 summary 和三个 Stats；与 analysis/latest 在同一 accountId/window 下必须取同一快照。未生成返回 data=null；已分析但没提交则返回零统计快照。stale 表示快照 sourceDataVersion 与账号当前数据版本不一致、分析/映射版本不匹配或 dataCutoffAt 距当前超过 24 小时；历史数据如实展示。Dashboard 使用最新 ALL 快照与最新 HYBRID 批次，无数据字段为 null；优先 nextAction：在途任务 WAIT_SYNC → 无成功同步或最近一次 ACCOUNT_FULL 数据阶段失败 SYNC → 无画像或画像过期 REBUILD_ANALYSIS → 无推荐或推荐过期 GENERATE_RECOMMENDATIONS → NONE。INVALID 返回 SYNC，UNBOUND 返回 NONE。

## 题目推荐 API

| 方法与路径                                             | Request / Query                                                                                                    | 成功状态及响应 T                                          |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| POST /oj-accounts/{accountId}/recommendations/generate | `{mode?: RecommendationMode, limit?: number}`；默认 HYBRID、10，limit 整数 1..50；必需 `Idempotency-Key: UUID` | 首次 201 RecommendationBatchDto；同 key 重放 200 原批次   |
| GET /oj-accounts/{accountId}/recommendations/latest    | mode=HYBRID                                                                                                        | 200 RecommendationBatchDto 或 null                        |
| GET /oj-accounts/{accountId}/recommendations/history   | mode 可省略（省略=所有模式），分页                                                                                 | 200 Page<RecommendationBatchDto></recommendationbatchdto> |
| GET /oj-accounts/{accountId}/recommendations/{batchId} | 无                                                                                                                 | 200 RecommendationBatchDto                                |

推荐只能基于该 accountId 最新、未过期、完整 ALL 画像；无可用画像为 409 PROFILE_NOT_READY。WEAKNESS 自动取 weakestDimension，V0.11 不提供手动维度覆盖。LEVEL/WEAKNESS/HYBRID 由算法排序；前端不计算目标难度和排名。候选池来自完整题库并排除当前账号已 AC；不足 limit 时返回实际数量，包括 0 项成功批次，显示“当前难度范围暂无候选题”，不展示服务异常。

Idempotency-Key 为一次点击生成的 UUID；网络失败重试复用，同 key 不同 mode/limit 返回 409 IDEMPOTENCY_CONFLICT。同 key 在途返回 409 REQUEST_IN_PROGRESS，Retry-After: 2。失败未提交批次可使用相同 key 重试。成功历史批次不可变；后续已 AC 的题仍保留原 rank 并标 solvedSinceGeneration=true，latest/history 不触发新计算。stale 为关联画像 stale=true、analysisSnapshotId 已不是当前最新 ALL、推荐/映射版本不匹配、sourceDataVersion 与账号不一致或生成超过 24 小时。排序为 generatedAt DESC、batchId DESC。非法 batchId 或不属于当前账号返回 404 RESOURCE_NOT_FOUND。

## 公共错误码

所有错误都有 ApiError；details 默认为 `{}`，字段校验错误可含 `{fields: Array<{field: string, reason: string}>}`。

| HTTP | code                                                                                                              | 客户端行为                          |
| ---- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| 400  | INVALID_ARGUMENT、INVALID_ANALYSIS_WINDOW、INVALID_RECOMMENDATION_MODE、PLATFORM_NOT_SUPPORTED、PASSWORD_TOO_WEAK | 修正输入                            |
| 400  | CAPTCHA_INVALID、CAPTCHA_EXPIRED、EMAIL_CODE_INVALID、EMAIL_CODE_EXPIRED                                          | 刷新验证码或重新获取邮件代码        |
| 401  | INVALID_CREDENTIALS、SESSION_EXPIRED                                                                              | 登录失败提示或跳转登录              |
| 403  | ACCOUNT_LOCKED、ACCOUNT_DISABLED、FORBIDDEN、ORIGIN_REJECTED                                                      | 停止受限操作                        |
| 404  | OJ_ACCOUNT_NOT_FOUND、RESOURCE_NOT_FOUND、SYNC_JOB_NOT_FOUND、CF_ACCOUNT_NOT_FOUND                                | 刷新列表或核对 handle               |
| 409  | USERNAME_ALREADY_EXISTS、EMAIL_ALREADY_REGISTERED、OJ_ACCOUNT_ALREADY_BOUND、OJ_ACCOUNT_OWNERSHIP_CONFLICT        | 显示占用提示                        |
| 409  | OJ_ACCOUNT_UNBOUND、OJ_ACCOUNT_INVALID、PROFILE_NOT_READY、SYNC_REQUIRED、DATA_CHANGED                            | 刷新账号/同步状态，必要时同步或重建 |
| 409  | IDEMPOTENCY_CONFLICT、REQUEST_IN_PROGRESS                                                                         | 复用正确 key 或稍后重试             |
| 429  | EMAIL_CODE_RATE_LIMITED、SYNC_RATE_LIMITED、RATE_LIMITED                                                          | 按 Retry-After 秒数倒计时           |
| 502  | UPSTREAM_CODEFORCES_UNAVAILABLE、ALGORITHM_BAD_RESPONSE、ALGORITHM_VERSION_MISMATCH                               | 保留已有数据，允许重试              |
| 503  | ALGORITHM_UNAVAILABLE、EMAIL_DELIVERY_FAILED                                                                      | 保留已有数据，允许重试              |
| 504  | UPSTREAM_CODEFORCES_TIMEOUT、ALGORITHM_TIMEOUT                                                                    | 使用同一 key 重试生成               |
| 500  | INTERNAL_ERROR                                                                                                    | 展示 requestId，允许重试            |

异步任务中的错误存入 errors，不把轮询 GET 变成 5xx：上述上游/算法码以及 SUBMISSION_PARSE_FAILED、SYNC_INTERRUPTED、OJ_ACCOUNT_UNBOUND、DATA_CHANGED、SYNC_REQUIRED 可出现在任务错误中。JobError.retryable 在上游/算法不可达或超时、SYNC_INTERRUPTED、DATA_CHANGED 时为 true；解析、非法 DTO、版本、身份及输入问题为 false，需要先修复数据或配置再发新任务。返回日志信息必须去除 token、邮箱代码、SQL 和堆栈。

## 分析时间与统计口径

每次输入固定 `dataCutoffAt`，结束点为该时刻且不包含端点。7D/30D/365D 的开始点为该时刻在 `timezone` 中所在日期的零点向前数 N−1 个自然日；包含今天已发生部分，共 N 个自然日。ALL 的开始点为 null，包含截止前全部已同步历史。V0.11 固定 `timezone="Asia/Shanghai"`，用户时区仅影响页面显示，不改变计算口径。输入时间仍全部为 UTC。

后端提供当前 accountId 截止前完整逐条提交及其题目，不能截取最近若干条冒充 ALL。算法在每个窗口按 `[start,end)` 筛选。团队提交归入 Provider 查询账号的数据集，每个 accountId 内按 externalSubmissionId 去重；不同账号独立计算，不合并为用户总数。

- attemptedProblemCount：窗口内提交涉及的去重题数；solvedCount：窗口内至少一次 ACCEPTED 的去重题数。即使过去已 AC，窗口内再 AC 也计为窗口 solved；unsolvedProblemCount=attemptedProblemCount−solvedCount。
- submissionCount：窗口内全部提交数；acceptedSubmissionCount 仅 ACCEPTED；pendingSubmissionCount 仅 PENDING；failedSubmissionCount 为其余最终/未知非 AC 判定数。必须满足 submissionCount=acceptedSubmissionCount+failedSubmissionCount+pendingSubmissionCount，等待判题不显示为失败。
- ratedSolvedCount 与 unratedSolvedCount 按题目 difficulty 是否为 null 划分，二者之和为 solvedCount。averageSolvedDifficulty、maxSolvedDifficulty 只按有难度的去重已 AC 题计算；无样本均为 null，不能填 0。
- tagStats 按原始 tag 字符串去重后统计，每个标签一项；多标签题可以计入多项，标签之和不要求等于总题数。空标签不造伪标签。按 tag 字典序输出。
- difficultyStats 每个难度一项，包含 difficulty=null 的未评级桶；按数值升序、null 最后；各桶 solvedCount 之和等于 summary.solvedCount。没有题则 `[]`。
- activityStats 按自然日升序，仅返回有提交的日期；缺失日期在图表视为零。每日 AC 次数按提交计数；每日 solvedCount 为该题在本窗口首次 AC 所在日的题数，跨日重复 AC 不再次计数，因此各日 solvedCount 之和等于窗口 solvedCount。它不是“全历史首次 AC”。activeDays=activityStats.length。
- dimensions 始终六项，按 displayOrder 排列；rankOrder 按 score 升序，分数相同按 displayOrder，连续 1..6，1 为最弱；weakestDimension 为 rankOrder=1 的 code。空数据仍返回六项零分、overallScore=0，最弱按固定顺序取第一项。页面标注“暂无训练证据”。
- 所有 count 为非负安全整数；分数及平均难度保留两位小数，推荐 score 保留六位，使用十进制 ROUND_HALF_UP；JSON 不允许 NaN/Infinity。currentRating/maxRating 是此次同步时资料，不伪装为窗口开始时 Rating。

## reasonCode 与固定展示文案

| reasonCode             | reason                             |
| ---------------------- | ---------------------------------- |
| WEAK_DIMENSION_MATCH   | 这道题覆盖你当前相对薄弱的能力。   |
| LEVEL_MATCH            | 这道题的难度与你当前训练水平接近。 |
| SLIGHTLY_ABOVE_LEVEL   | 这道题略高于你的当前训练水平。     |
| TAG_MATCH              | 这道题包含适合你训练的知识标签。   |
| BALANCED_PRACTICE      | 这道题兼顾难度与能力覆盖。         |
| RECENT_WEAKNESS        | 这道题适合巩固近期较少训练的能力。 |
| LOW_ATTEMPT_COVERAGE   | 这道题包含你尚未完成过的知识标签。 |
| RATING_GROWTH_STEP     | 这道题适合作为提高难度的下一步。   |
| MIXED_SKILL_MATCH      | 这道题可以练习多种能力的组合。     |
| DEFAULT_RECOMMENDATION | 这道题适合作为下一道练习题。       |

## 页面调用与交互状态

| 页面/时机      | 调用顺序与状态                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------------- |
| 首页、Demo     | 游客可访问；Demo 使用标注“示例数据”的本地 fixture，不访问真实他人账号                                             |
| 应用初始化     | GET /me；401 清空用户状态；成功后分页读取 GET /oj-accounts 构建账号选择器                                           |
| 登录           | POST /auth/captcha → POST /auth/login；成功刷新 /me 和账号列表                                                     |
| 注册、邮箱验证 | captcha → email-codes(REGISTER) → 输入邮件代码 → register；发送按钮按 60 秒倒计时                                |
| 找回密码       | captcha → email-codes(PASSWORD_RESET) → password/reset → 登录页                                                  |
| 安全设置       | 换密码、分别验证新旧邮箱后换邮箱、退出当前或全部；reauthRequired=true 清空状态并登录                                |
| 平台账号管理   | GET/POST /oj-accounts；卡片必须有 accountId、handle、同步状态、同步/解绑按钮；可选 includeUnbound=true 展示历史记录 |
| 学生主页       | GET /oj-accounts/{accountId}/dashboard；以 nextAction 引导同步、等待、重建或生成推荐                                |
| 个人数据       | training/overview?window=30D + problems；题目抽屉查询 submissions?problemId=...；比赛趋势读 rating-changes          |
| 能力画像       | analysis/latest?window=ALL；渲染 dimensions 六项、name 和 score，0..100；不按 CF rating 缩放雷达图                  |
| 个人分析       | 切换 7D/30D/365D/ALL 后重取 analysis/latest/history，走势图按 dataCutoffAt 展示；点历史条目读 snapshotId            |
| 推荐           | 进入读 recommendations/latest?mode=HYBRID；切模式只读对应模式；点击生成才 POST，查看历史使用 history 和 batchId     |

账号选择状态为 selectedAccountId: Id|null；仅从属于当前用户的账号列表选择，可按 publicId 保存偏好。首次无偏好选择列表第一条有效账号是前端行为，每次请求仍显式带 accountId；后端不会猜默认账号。无有效账号展示绑定引导，不请求缺少 accountId 的 dashboard。解绑当前账号后清理当前数据并选其他有效账号；未解绑的其他 CF 数据不受影响。历史绑定可进入只读页面，不把同 handle 的新旧 accountId 合并。

所有查询 cache key 包括 publicId、accountId、接口、window/mode/分页/过滤参数。切换账号立即取消旧请求或用请求代次忽略迟到响应，重置页面页码；不得将 A 的慢响应写进 B 的视图。退出清空全部私人缓存。分析 Response.accountId、推荐 Response.accountId 与当前选择不一致时丢弃。

- loading：首次请求展示骨架；重新筛选保留旧数据时加明确加载提示，避免误认新账号数据。
- empty：账号列表 [] → 绑定；提交/做题列表 [] → 暂无记录；analysis=null → 尚未分析；零统计画像 → 暂无训练证据；recommendationBatch=null → 尚未生成；recommendations=[] → 范围内无候选。
- syncing：收到 202 job 后按 jobId 每 3 秒轮询；页面隐藏可暂停，恢复先查一次。终态停止；网络失败指数退避至 30 秒，重新进入用 sync-status 恢复，不重复创建任务。
- PARTIAL：显示失败阶段和可重试提示；CF 数据已成功而 ANALYSIS 失败时刷新提交/做题记录，保留旧画像并标 stale，提供 analysis/rebuild。数据阶段失败则提供完整 sync。
- error：401 回登录、404 刷新账号列表、409 按 code 处理、429 倒计时；5xx 保留已有成功数据并给重试。展示 requestId 方便定位，禁用重复提交按钮。
- 图表：tagStats/difficultyStats/activityStats 均是数组；缺日期补零只用于显示；difficulty=null 显示“未评级”，max/average=null 显示“暂无”；problem.title=null 用 externalProblemKey 兜底，url=null 禁用跳转。
- 推荐历史：solvedSinceGeneration=true 显示“已完成”，保留原 rank；点击“生成”才重新排序。原题链接按返回 url 打开，不自行调用 CF API。solvedCount 显示“Codeforces 通过人数”，不可改名为通过率。

请求示例：

```ts
const response = await fetch(`/api/v1/oj-accounts/${encodeURIComponent(accountId)}/analysis/latest?window=30D`, {
  credentials: "include",
  signal: abortController.signal
});
```

推荐请求的 Idempotency-Key 在一次操作重试期间保持不变；切模式或用户明确开始新操作才生成新 key。请求期间离开页面不保证后端取消，返回后可读取 latest/history 找到已成功批次。

## Mock 与联调数据

按本文完整 DTO 构建 Mock，不省略必填字段。至少准备同用户两个 CF、无绑定、未定级、Gym INFERRED、团队提交、PENDING、空分析、四窗口分析、成功/部分失败任务、三模式推荐、空候选和解绑历史。ApiResponse<null></null> 示例：

```json
{"data":null,"requestId":"00000000-0000-4000-8000-000000000001"}
```

空分页示例：

```json
{"data":[],"meta":{"page":1,"pageSize":20,"total":0,"hasNext":false},"requestId":"00000000-0000-4000-8000-000000000001"}
```

错误示例：

```json
{"error":{"code":"PROFILE_NOT_READY","message":"请先完成账号分析。","details":{}},"requestId":"00000000-0000-4000-8000-000000000001"}
```

前端独立 Dockerfile 必须构建静态产物并启动 HTTP 服务器；/api/v1/** 反向代理至 http://backend:8081，保留路径与 Origin，proxy_read_timeout=30s，SPA 页面回退 index.html。只使用公开 DTO，不需要读取后端或算法文件即可完成主要页面。
