
# Codeforces 可获取字段

来源：官方公开 API，2026-09-29 实测。样本：tourist（5491 条提交）、23lpx（1381 条，rating 1471）。
无需登录、无需凭据。

**本文只讲字段与分析；原始抓取响应见 `cf-data-samples.md`。**

---

## **1. `user.info?handles=` — 账号信息**

**字段类型覆盖说明**`handle`string总是用户名，大小写不敏感`rating`int已定级未定级账号**无此字段**`maxRating`int已定级同上`rank`string已定级称号，如 `expert`。**非枚举**`maxRank`string已定级同上`contribution`int总是`friendOfCount`int总是关注者数`registrationTimeSeconds`long总是epoch 秒`lastOnlineTimeSeconds`long总是epoch 秒`avatar` / `titlePhoto`string总是图片 URL`firstName` / `lastName`string**可选**普通学生账号常缺`country` / `city`string**可选**普通学生账号常缺`organization`string**可选**单位/学校，普通学生账号常缺

实测：23lpx 有 11 个字段，tourist 有 16 个。

---

## **2. `user.rating?handle=` — 比赛记录**

每条记录字段固定，**无缺失**。

**字段类型实测范围**`contestId`int2 ~ 2268`contestName`string`handle`string`rank`int1 ~ 166`oldRating`int0 ~ 4009（首场为 0）`newRating`int1602 ~ 4009`ratingUpdateTimeSeconds`longepoch 秒

---

## **3. `user.status?handle=&from=&count=` — 提交记录**

**下列字段每条提交都有：**

**字段类型说明**`id`long提交编号，最大 392217392`contestId`int1 ~ 103104（100000+ 为 Gym）`creationTimeSeconds`longepoch 秒`relativeTimeSeconds`int最大值恰为 `Integer.MAX_VALUE`，是哨兵值`problem.contestId`int`problem.index`string`A`~`Z` 等，79 种`problem.name`string`problem.type`string`PROGRAMMING` / `QUESTIONproblem.tags`string[]长度 0 ~ 11`programmingLanguage`string**自由文本，非枚举**`verdict`string11 种，**从不为空**`testset`string13 种`passedTestCount`int0 ~ 1000`timeConsumedMillis`long0 ~ 20000`memoryConsumedBytes`long0 ~ 794931200`author.members[].handle`string[]长度 1 ~ 3（>1 为团队提交）`author.participantId`int`author.participantType`string4 种`author.ghost`bool`author.startTimeSeconds`long99.9% 存在

**下列字段经常缺失（出现率为实测）：**

**字段tourist23lpx说明**`problem.rating`76.7%91.1%题目难度分，800 ~ 3500`problem.points`58.3%25.4%题目分值`points`16.3%0%本条得分，仅 ICPC 赛制`pointsInfo`5.7%—得分说明`author.room`45.2%3.0%房间号，仅正式比赛`author.teamId` / `teamName`14.2%5.4%团队提交

---

## **4. `problemset.problems` — 题库**

11425 道题。**不含 Gym**（`contestId` 只到 2269，Gym 为 100000+）。

**字段类型说明**`problems[].contestId`int1 ~ 2269`problems[].index`string`problems[].name`string`problems[].type`string恒为 `PROGRAMMINGproblems[].points`double58% 存在`problems[].rating`int**800 ~ 3500**，2.6% 缺失`problems[].tags`string[]38 个标签`problemStatistics[].contestId` / `.index`与上面配对`problemStatistics[].solvedCount`int0 ~ 733078，通过人数

---

## **5. 关键字段的取值域**

**`verdict`（11 种）**：`OK`、`PARTIAL`、`WRONG_ANSWER`、`TIME_LIMIT_EXCEEDED`、
`RUNTIME_ERROR`、`SKIPPED`、`COMPILATION_ERROR`、`MEMORY_LIMIT_EXCEEDED`、
`CHALLENGED`、`IDLENESS_LIMIT_EXCEEDED`、`PRESENTATION_ERROR`

**`participantType`（4 种）**：`CONTESTANT` 正式参赛、`VIRTUAL` 虚拟参赛、
`PRACTICE` 赛后练习、`OUT_OF_COMPETITION` 打星参赛

**`testset`（13 种）**：`TESTS`、`PRETESTS`、`TESTS1`~`TESTS10`、`CHALLENGES`

**`programmingLanguage`**：自由文本，27 种，同一语言因编译器版本分裂
（`C++17 (GCC 9-64)`、`C++20 (GCC 13-64)` 各算一个），且混有 `Secret 2021`、`UnknownX` 等异常值

**标签**：题库 38 个，提交记录里出现过 39 个（多出 `*broken`）。**集合不封闭**

**难度分**：以 100 为步长，800 ~ 3500；**3500 是「3500 及以上」的合并桶**

---

## **6. 解析时要注意的两点**

**「缺失」有两种写法，解析必须都能吃。**（原始样本见 `cf-data-samples.md`）

- `user.status` 里是**显式 null**：`"rating": null`
- `problemset.problems` 里是**键不存在**：整条记录里根本没有 `rating` 键

**`problem.rating` 缺失有两个不同原因，含义不一样：**

**原因识别方式例（23lpx 实测）**新比赛尚未评级`contestId` 是近期比赛contestId 2264Gym 题，压根不进题库`contestId` ≥ 100000contestId 105632

第二类就是「题库只覆盖 86.9%」的那个缺口。

## **7. 未验证**

样本 5 个账号，rating 1471 ~ 3676，段位偏窄。以下未实测：

- 完全没参加过比赛的账号（`user.rating` 为空）
- 是否存在 `verdict` 为 null 的提交（6872 条样本未见）
- `problemsetName`（acmsguru 等非比赛题的字段）何时非空 —— 现有样本中从未出现
- 团队账号在 `user.info` / `user.status` 中的归属规则
- 学生改过 handle 后旧数据是否还能查到
