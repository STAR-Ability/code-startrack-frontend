# Code Training Startrack (codeStartrack) Product Focus Plan

> Version: Product Focus V2\
> Product name: 码练星轨\
> English name: codeStartrack\
> Current stage: Demo V2 / Pre-MVP Validation\
> Core principle: **Keep the frontend extremely simple while keeping the underlying capabilities extensible. Externally, emphasize only "programming practice + Agent assistance."**

---

# 1. Why the Product Needs to Refocus

The previous product direction was more centered on ACM training teams, coach management, team training analytics, learner profiling, and team dashboards.

These capabilities may still be valuable in the future, but if they are exposed directly as the product homepage and primary information architecture, general programming learners may feel that "this product is not for me." It also creates too many visible features, too many roles, and too much cognitive load.

Therefore, the new version should no longer organize the product around separate scenarios such as ACM, 408, interviews, job hunting, or training programs.

Instead, the entire product should be organized around one unified programming-training loop.

---

# 2. New Product Positioning

## 2.1 One-Sentence Positioning

> **codeStartrack is an intelligent training Agent for programming learners. It recommends the next appropriate problem based on the learner's training goal and training performance, and provides progressive Agent assistance during practice without revealing too much too early.**

## 2.2 Target Users

In principle, anyone actively practicing programming can become a user, including:

- beginners learning programming;
- data structures and algorithms learners;
- ACM / ICPC trainees;
- LeetCode / algorithm interview candidates;
- 408 learners who need programming practice;
- job assessment / coding-test candidates;
- students in university programming courses;
- self-taught programmers;
- university programming contest teams;
- classes;
- training groups;
- coaches;
- teachers;
- student-led mentoring groups.

However, these audiences must **not** become multiple parallel "zones" or "portals" on the homepage.

They should be treated only as different:

- training goals;
- training strategies;
- problem sources.

---

# 3. Externally Show Only One Core Product Idea

The external product perception of codeStartrack should always be:

# Programming Practice + Agent Assistance

Users should not need to understand whether codeStartrack is:

- an ACM platform;
- a 408 platform;
- an interview platform;
- a coach platform;
- an online judge platform;
- a course platform.

The user only needs to understand:

> **I come here to practice programming. The system tells me what problem I should solve next, and when I get stuck, the Agent helps me continue thinking.**

---

# 4. The Two Core Product Capabilities

## 4.1 Recommend the Next Problem

The product should not primarily present a huge problem library and ask users to search manually.

Instead, it should answer:

> **"What should I practice next?"**

A recommendation should contain at least:

- recommended problem;
- difficulty;
- training objective;
- why it is recommended;
- estimated training time;
- problem source;
- recommendation rationale.

The first-stage recommendation algorithm can be fully rule-based and hardcoded.

Example:

```text
Current learner level: Beginner
Most recent problem: Basic Arrays — AC
Time spent: 18 minutes
Hints used: 0
Current goal: Basic algorithm practice

Next problem:
Basic 2D Array Problem

Reason:
The previous problem was completed independently at an appropriate difficulty.
The next problem adds one dimension without significantly increasing algorithmic complexity.
```

## 4.2 Agent Assistance During Training

The Agent should not behave like an independent general-purpose chatbot.

It must be embedded in the context of the current problem.

When the user clicks:

```text
I'm stuck
```

the system should first help identify the type of difficulty:

- did not understand the problem statement;
- does not know how to start;
- has an idea but does not know how to implement it;
- compilation error;
- runtime error;
- WA;
- TLE;
- wants to verify an approach;
- other.

The Agent then provides progressive assistance.

Recommended levels:

### Level 1: Clarify the Problem

Help the learner identify exactly what is unclear.

### Level 2: Directional Hint

Do not reveal the full algorithm. Suggest what the learner should observe or think about.

### Level 3: Key Structure

Provide the key idea, state design, or implementation structure.

### Level 4: Review

After the learner explicitly ends the independent attempt, provide a more complete explanation.

Core principle:

> **The Agent's goal is not to help the learner obtain AC as quickly as possible. Its goal is to help the learner complete a meaningful training attempt.**

---

# 5. All Scenarios Share the Same Training Loop

Whether the learner is preparing for ACM, interviews, 408, coursework, or general algorithm practice, the product uses the same core loop:

```text
Set training goal
    ↓
System recommends the next problem
    ↓
Learner starts training
    ↓
Run sample / submit for judging
    ↓
Learner encounters difficulty
    ↓
Agent provides progressive assistance
    ↓
Learner continues training
    ↓
AC / unfinished
    ↓
Record training result
    ↓
Recommend the next problem
```

Different training goals should **not** create different primary product interfaces.

---

# 6. Information Architecture for Regular Users

The main navigation for regular users should remain minimal:

```text
Training
History
Profile
```

## 6.1 Training

This is the default entry page.

Primary content:

- current training goal;
- exactly one system-recommended problem;
- recommendation reason;
- start training;
- most recent training result.

Do not show dozens of recommended problems at the same time.

The user's most important action should be:

> **Start the next problem.**

## 6.2 History

Used to review:

- completed / attempted problems;
- AC / WA / TLE / CE;
- number of hints used;
- recent training time;
- current dominant error types;
- recent recommendation changes.

The first stage does not need a complex ability radar chart.

## 6.3 Profile

Used to manage:

- current training goal;
- current difficulty level;
- daily training time;
- language preference;
- team membership;
- account settings.

If the user has team / coach permissions, conditionally show:

```text
Manage Team
```

Regular users should not see a coach entry point.

---

# 7. Do Not Create Separate "ACM / 408 / Interview" Homepage Zones

The correct approach is to ask during onboarding or under "My Training Goal":

```text
What is your primary training goal?
```

Examples:

- programming fundamentals;
- data structures and algorithms;
- competitive programming;
- algorithm interviews;
- course practice;
- custom training goal.

This choice affects:

- recommended problems;
- difficulty;
- tag weighting;
- Training Policy;
- training pace.

It must **not** change the main product interface.

---

# 8. Positioning of the Coach Experience

The coach experience is not the primary product for regular users.

It belongs to:

# Team / Coach Upgrade Service

Individual product:

```text
Problem recommendation
+
Real judging
+
Agent assistance
+
Training history
```

Team product:

```text
Individual training capability
+
Team management
+
Coach experience
```

---

# 9. The Coach Experience Solves Only Three Problems

## 9.1 How Is Everyone Training?

Show:

- number of members;
- recently active members;
- today's / this week's completion status;
- recent submissions.

## 9.2 Where Is Everyone Getting Stuck?

Show:

- frequent WA problems;
- frequent knowledge areas / tags;
- problems with the most Agent requests;
- issues that may require human intervention;
- members who have not trained for a long period.

## 9.3 What Should We Arrange Next?

Provide:

- suggested next training problem set;
- people who may need more attention;
- suggested topic for the next explanation session;
- ability for the coach to manually override system suggestions.

The previous loop:

```text
Training Data → Ability Analysis → Coach Decision → New Training Plan
```

is still retained, but as an upgrade service rather than the primary entry point for regular users.

---

# 10. The Real Goal of Demo V2

Demo V2 does **not** attempt to validate the entire commercial platform.

It validates one minimum end-to-end loop:

# Can the system recommend one problem, let the learner actually solve and submit it, return a real judge result, provide Agent assistance when the learner is stuck, and then recommend the next problem?

Complete flow:

```text
Enter student experience
    ↓
See one system-recommended problem
    ↓
Read why it was recommended
    ↓
Open the problem
    ↓
Read the problem statement
    ↓
Write C++17 code
    ↓
Run sample
    ↓
Submit
    ↓
Real Judge
    ↓
AC / WA / TLE / CE
    ↓
If stuck, invoke Agent
    ↓
Agent provides rule-based hints
    ↓
Continue submitting
    ↓
Write training result to database
    ↓
Recommendation logic produces the next problem
```

---

# 11. Demo V2 Scope

## P0: Must Be Real

### Student Experience

- Demo user entry;
- current training goal;
- recommend one problem;
- recommendation reason;
- problem details;
- samples;
- C++17 editor;
- run sample;
- submit;
- real judging;
- AC / WA / TLE / CE;
- submission history;
- Agent help entry;
- rule-based progressive hints;
- recommend the next problem after AC.

### Problem Bank

- 20–30 problems;
- stored in the database;
- problem statement;
- input specification;
- output specification;
- sample input;
- sample output;
- difficulty;
- tags;
- hidden test data;
- time limit;
- memory limit;
- recommendation metadata.

### Recommendation

The first version should not use real machine learning.

Use rule-based logic.

At minimum, consider:

- current goal;
- problems already attempted;
- most recent result;
- current difficulty;
- tags;
- whether hints were used;
- training duration.

### Agent

A real large language model is not required.

Start with:

```text
Problem + ErrorType + HintLevel
→ Hardcoded Hint
```

The goal is Demo stability.

---

# 12. Demo V2 Coach Experience

The coach experience should exist, but it is clearly lower priority than the student experience.

Recommended minimum scope:

## Team Overview

- 5–10 simulated members;
- recent training status;
- AC count;
- submission count;
- current recommendation;
- recent error.

## Member List

A coach can open a member and view:

- recent problems;
- recent judge results;
- Agent usage;
- current system recommendation.

## Team Problems

Display:

- most common WA problem;
- most common tags;
- problem with the most Agent usage;
- members with unfinished training.

## Recommendation

Display:

> System suggestion for the team's next training direction.

The first version may use hardcoded / rule-based data.

---

# 13. Out of Scope for Demo V2

Explicitly do **not** implement:

- real LLM Agent;
- vector database;
- RAG;
- AI-generated problems;
- complex learner profiling;
- ability radar chart as a core feature;
- large-scale problem bank;
- crawling every online judge;
- multi-language judging;
- microservice cluster;
- community;
- leaderboard;
- payments;
- complex organization permissions;
- mobile app;
- automated course system;
- nationwide university data;
- interview-specific homepage zone;
- 408-specific homepage zone;
- ACM-specific homepage zone.

---

# 14. Demo V2 Recommendation Rules

The first recommendation system should optimize for:

> **Stability, explainability, and demonstrability — not intelligence.**

Example rules:

```text
if the user has never solved a problem:
    recommend a basic problem with difficulty = 1

if the previous problem was AC and no Hint was used:
    increase difficulty by at most 1 level

if the previous problem was AC but Level 3/4 Hint was used:
    keep the same difficulty

if the user has 2 consecutive WA results:
    recommend a problem with the same tag and equal or lower difficulty

if the user performs poorly on a tag repeatedly:
    increase the weight of that tag

never recommend a problem that the user has already AC'd
```

Output:

```text
Recommended Problem
Recommendation Reason
Recommended Training Objective
```

---

# 15. Demo V2 Agent Rules

Each problem should predefine:

```text
hint1
hint2
hint3
solutionOutline
```

After the user selects the type of difficulty, different hint content can be returned.

Example:

```text
Did not understand the statement
→ Restate the problem

Does not know how to start
→ Hint 1

Has an idea but cannot implement it
→ Hint 2 / implementation structure

WA
→ Suggest boundary-condition checks

TLE
→ Remind the learner to inspect complexity

Review
→ solutionOutline
```

The Agent does not need a real model call, but the interaction should feel like a real Agent workflow.

---

# 16. Real Judge Requirements

Demo V2 must provide the minimum capabilities of a real online judge:

- C++17;
- compilation;
- execution;
- standard input;
- standard output;
- multiple test cases;
- time limit;
- memory limit;
- CE;
- RE;
- TLE;
- WA;
- AC;
- execute test cases individually;
- output comparison;
- submission history.

Important:

> **The Demo Judge is only a minimum viable judge. It must not be presented as having production-grade sandbox isolation for an internet-facing public OJ.**

If the product is later opened to untrusted public users, the Judge Sandbox must be upgraded separately.

---

# 17. Demo V2 Technical Architecture Recommendation

Recommended high-level architecture:

```text
Browser
   ↓
Next.js + TypeScript
   ↓
Application API
   ↓
PostgreSQL
   ↓
Judge Service
```

The Judge Service can be an independent lightweight service.

Recommended:

```text
Python + FastAPI
```

Reasons:

- compilation / execution logic is straightforward to implement;
- easy to evolve independently;
- decouples judge logic from the main web application;
- can later be replaced by Judge0 / isolate / nsjail or another sandbox solution.

The first version should support only:

```text
C++17
```

Do not begin by supporting ten programming languages.

---

# 18. Database Recommendation

Use PostgreSQL.

At minimum, the data model should include:

```text
users
problems
problem_test_cases
submissions
training_records
recommendations
agent_sessions
teams
team_members
```

Insert the 20–30 Demo problems through a seed script.

---

# 19. Problem Bank Recommendation

Demo problems should approximately cover:

- input / output;
- conditionals;
- loops;
- arrays;
- strings;
- sorting;
- binary search;
- hashing;
- stack;
- queue;
- simple DFS / BFS;
- simple greedy;
- simple DP.

Difficulty should remain relatively low.

Each problem must include:

- title;
- description;
- input;
- output;
- samples;
- explanation (optional);
- hidden tests;
- tags;
- difficulty;
- timeLimit;
- memoryLimit;
- hint1;
- hint2;
- hint3;
- solutionOutline.

---

# 20. Demo Page Structure

## Regular User

```text
/training
/history
/profile
/problem/[id]
```

Default entry:

```text
/training
```

## Coach

Conditionally available:

```text
/coach
/coach/students
/coach/student/[id]
```

Coach routes should not appear in the regular user's primary navigation.

For the Demo, a top-right control may provide:

```text
Demo Role Switch
```

to enter the coach role.

---

# 21. Student Experience Priorities

## `/training`

Only emphasize:

- current goal;
- one recommended problem;
- recommendation reason;
- start training.

Below that, recent information may be displayed with much lower visual emphasis:

- recent training;
- training streak;
- recent errors.

Do not build a complex dashboard.

---

# 22. Problem Page

Recommended layout:

```text
Left: Problem statement
Right: Code editor
Bottom / Side: Judge result + Agent
```

Key actions:

```text
Run Sample
Submit
I'm Stuck
```

---

# 23. Coach Page Priorities

Do not copy the previous large, all-in-one dashboard.

The Demo only needs:

```text
Team Overview
Members
Problems
```

Every metric should help explain a possible next action.

---

# 24. Future Product Expansion

If the product later supports:

- ACM;
- 408;
- interviews;
- courses;
- job preparation;

do not add new homepage zones.

Expand through configurable:

```text
Training Policy
Problem Source
Difficulty Policy
Goal
Evaluation Policy
```

---

# 25. Most Important Product Principles

## Keep the Frontend Simple

The user should primarily see:

> **What is my next problem?**

## Keep the Backend Extensible

The system should be able to support different:

- learning goals;
- problem sources;
- recommendation strategies;
- teams;
- coaches.

## First-Stage Focus

Validate only:

> **Recommendation + Training + Judging + Agent + Next Recommendation**

---

# 26. Demo V2 Success Criteria

The Demo must be able to reliably demonstrate at least the following sequence:

1. Student enters the product.
2. The system recommends one problem.
3. The system explains why the problem was recommended.
4. The student writes C++ code.
5. The student runs the sample.
6. The student submits.
7. The Judge returns a real result.
8. After WA, the student uses the Agent.
9. The Agent provides progressive hints.
10. The student submits again.
11. The result is AC.
12. The system records the training result.
13. The system recommends the next problem.
14. The Demo switches to the coach role.
15. The coach can see the training data generated by the preceding student flow.

If these 15 steps can be demonstrated reliably, Demo V2 is successful.
