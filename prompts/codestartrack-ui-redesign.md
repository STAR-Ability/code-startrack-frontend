# codeStartrack UI Redesign — 页面布局与交互方案

> 目标：只重做前端 UI、页面布局与交互表现，不改后端接口、不改推荐逻辑、不新增真实认证能力。\
> 颜色、字体、圆角、语义 Token、Base UI / Nova 组件基础全部沿用仓库现有 `design-system.md` 与现有主题实现。\
> 本文不重新定义颜色，只描述页面结构、组件形态与交互细节。

---

## 1. 整体产品结构

将当前“训练画像 + 推荐题目挤在同一个 Dashboard”拆开，形成清晰的三页产品结构：

```text
/
  品牌首页 / Landing Page

/profile
  个人中心 / Training Profile

/practice
  写题训练 / Practice & Recommendation
```

### 桌面端产品导航

首页使用独立的品牌型顶部导航，不使用后台式侧边栏。

进入 `/profile` 与 `/practice` 后，使用固定左侧 Sidebar：

```text
┌──────────────────┬──────────────────────────────────────┐
│  codeStartrack   │                                      │
│  码练星轨         │                                      │
│                  │                                      │
│  首页             │             Page Content             │
│  个人中心         │                                      │
│  写题训练         │                                      │
│                  │                                      │
│                  │                                      │
│  ─────────────   │                                      │
│  语言             │                                      │
│  用户 / 登录      │                                      │
└──────────────────┴──────────────────────────────────────┘
```

Sidebar 不做传统后台菜单感，保持轻量、安静、留白充足。当前页面使用轻微底色、图标与文字强调，不使用大面积蓝色背景。

移动端收起 Sidebar，改为顶部品牌栏 + Drawer，或精简底部导航。

---

# 2. 首页 `/` — 品牌展示页

首页的目标不是展示数据，而是让用户第一次进入时立刻理解：

> 码练星轨是什么、为什么有价值、产品未来会是什么样。

首页允许“炫技”，但视觉仍然遵守仓库现有 white / neutral-first 品牌体系。

---

## 2.1 顶部导航

顶部导航固定在页面顶部，采用半透明白色表面 + 轻微背景模糊。

左侧：

- 品牌图标
- `码练星轨`
- `codeStartrack`

中间：

- 产品能力
- 训练画像
- 智能推荐
- 关于项目

右侧：

- 语言切换
- 登录
- `开始训练` 主按钮

### 交互

- 页面顶部时导航几乎融入背景。
- 页面向下滚动后，导航增加细边框与轻微阴影，形成浮层感。
- 导航项 hover 时出现短下划线或轻微背景反馈。
- `开始训练` hover 时轻微上浮 1–2px，并增加阴影。
- Logo 可有非常轻的星轨旋转或轨迹点动画，但不要持续大幅旋转。

---

## 2.2 Hero 首屏

Hero 是整个首页最重要的视觉区域。

建议采用左右不完全对称布局：

```text
┌───────────────────────────────────────────────────────┐
│                                                       │
│   你的每一道代码，             Interactive Product    │
│   都留下成长轨迹。             Preview / Star Track    │
│                                                       │
│   聚合程序设计训练记录，       Profile / Problem /     │
│   建立统一训练画像，并找到      Activity floating       │
│   下一道值得做的题。           cards                   │
│                                                       │
│   [开始训练] [查看产品演示]                             │
│                                                       │
└───────────────────────────────────────────────────────┘
```

### Hero 左侧

包含：

- 小型状态 Badge，例如 `Unified Programming Training`
- 大标题，建议 2–3 行
- 1 段非常简短的产品价值说明
- 两个 CTA
- 下方小型可信信息：
  - Multi-source
  - Unified Profile
  - Recommendation

### Hero 右侧：炫技区域

不要放普通截图，做成“可交互产品预览”。

#### A. Training Profile Floating Card

显示模拟的：

- Solved
- Average Difficulty
- Recent Activity
- Data Source

卡片微微倾斜，不与屏幕完全平行。

鼠标移入：

- 卡片向上移动 4–6px
- 阴影加深
- 根据鼠标位置产生非常轻的 3D tilt
- 离开后平滑回正

#### B. Recommendation Card

在画像卡旁边悬浮一张推荐题卡：

- Problem title
- Difficulty
- Tags
- Source
- Recommendation reason
- CTA

hover 时：

- 外框略增强
- 箭头向右移动
- CTA 图标产生位移反馈

#### C. Star Track / Data Orbit

两张卡之间使用 SVG 曲线、节点与轨迹点表达：

```text
Training Data
     ●
      ╲
       ╲──●───●───→ Recommendation
       ╱
     ●
```

动画只做：

- 轨迹线逐步绘制
- 小节点沿路径缓慢移动
- hover 某个卡片时，对应轨迹变清晰

这就是“码练星轨”的品牌视觉，不需要大面积插画。

#### D. Cursor Spotlight

鼠标移动到 Hero 右侧预览区时，卡片附近产生非常轻的局部高亮 / spotlight。

只影响局部表面层次，不改变整个页面背景颜色。

---

## 2.3 平台数据 → 画像 → 推荐：产品流程展示

Hero 下方做一个横向产品流程：

```text
训练数据
   ↓
统一数据层
   ↓
训练画像
   ↓
智能推荐
   ↓
继续训练
```

每一步是一张精致小卡片。

卡片之间不是普通箭头，而是使用“星轨路径”连接。

### 卡片 hover

鼠标进入某一步时：

- 卡片上浮
- 对应路径节点亮起
- 其他卡片略微降低视觉权重
- 显示一小段补充说明
- 图标进行 150–250ms 微动画

---

## 2.4 Bento Feature Grid

使用 Bento Grid 展示核心能力。

建议布局：

```text
┌───────────────────────┬───────────────┐
│ Unified Profile       │ Recommendation│
│ 大卡                  │ 小卡           │
│                       ├───────────────┤
│                       │ Multi-source  │
├──────────────┬────────┴───────────────┤
│ Activity     │ Training Journey       │
│ 小卡         │ 横向大卡                │
└──────────────┴────────────────────────┘
```

卡片内容可以展示：

- Unified Training Profile
- Problem Recommendation
- Multi-platform Sources
- Activity Timeline
- Training Journey

### Bento Card 设计

默认：

- 与页面背景有明确层级
- 轻边框
- 轻阴影
- 较大圆角
- 内部留白充分

hover：

- `translateY(-4px)`
- shadow 提升一档
- border 对比略增强
- 内部示意图产生局部动画
- 标题旁 ArrowUpRight / ChevronRight 轻微位移
- 动画控制在 180–260ms

不要每张卡都使用同样的动画。

---

## 2.5 动态训练轨迹展示

增加一块横向“训练轨迹”区域，强化品牌。

视觉类似：

```text
Day 1        Day 8        Day 15       Today
 ●────────────●─────────────●────────────●
 Easy          Graph          DP           Next
```

滚动进入视口时：

- 路径从左向右绘制
- 节点依次出现
- 数值轻微 Count-up
- 当前节点有很轻的脉冲

用户移动鼠标到节点：

- 展开小 Popover
- 显示模拟的题目 / 标签 / 难度

这里只是品牌演示，不代表真实用户数据。

---

## 2.6 Interactive Problem Stack

做 3–4 张叠放的题目卡，展示未来推荐体验。

默认：

```text
      ┌──────────────┐
    ┌──────────────┐
  ┌──────────────┐
  │ Problem A    │
  └──────────────┘
```

鼠标进入区域后：

- 卡片稍微展开
- 每张产生不同的轻微位移
- 当前卡片上浮
- 标签、难度、来源逐渐显现

不要做成游戏式卡牌，仍保持专业产品感。

---

## 2.7 Logo / Platform Marquee

加入非常克制的平台能力横向 Marquee。

例如只展示：

- Codeforces
- Future connectors
- Unified training data
- More sources coming

不要伪装成已经接入的平台。

Marquee：

- 缓慢移动
- hover 时暂停
- 支持 reduced-motion
- Logo / 文本统一降低视觉权重

---

## 2.8 CTA 收尾区域

首页最后做一个大面积留白 CTA。

核心文案：

> 下一道题，不再只是随机开始。

按钮：

- 开始训练
- 查看个人画像

背景可以使用淡淡的星轨线条或抽象代码路径，不要使用大型彩色渐变。

---

# 3. 个人页面 `/profile`

个人页面只负责：

> 我是谁、我练了什么、我的训练状态怎么样。

不要再把推荐题塞进个人画像主体。

---

## 3.1 页面整体

```text
Sidebar
│
└── Main
    ├── Profile Header
    ├── Key Metrics
    ├── Recent Activity
    ├── Training Overview
    └── Data Sources / Update Info
```

Main 区域使用浅层背景，内容卡片使用独立表面，使组件与页面明显分层。

---

## 3.2 Profile Header

顶部是一张宽卡片：

```text
┌──────────────────────────────────────────────┐
│ Avatar   Demo Learner                       │
│          Unified Training Profile           │
│          Codeforces · Current source        │
│                                             │
│                    Last updated ...         │
└──────────────────────────────────────────────┘
```

以后真实登录后可以替换 Demo 信息。

### hover

整张 Header 不需要明显浮动，仅：

- 阴影轻微增强
- Avatar 外圈轻微出现强调
- 数据来源标签出现更清晰边界

---

## 3.3 核心指标区域

4–5 张 Metric Card：

- 已通过题目
- 平均难度
- 最高难度
- 近 7 天提交
- 近 30 天提交

桌面端横向排列，移动端 2 列或单列。

### Metric Card

卡片重点不是颜色，而是数字排版。

```text
Solved Problems
156
+ recent activity hint
```

hover：

- 上浮 3px
- 阴影增强
- 数字轻微 scale 到 1.01–1.02
- 图标背景出现轻微强调

不要做五张不同颜色卡片。

---

## 3.4 Recent Activity

做成一张宽卡。

当前数据有限时，可以先展示：

- 7 天提交
- 30 天提交
- 更新时间

如果未来有每日数据，再升级为 activity chart / contribution heatmap。

当前不要制造不存在的数据。

右上角可以放 `Activity` Badge / Info tooltip。

---

## 3.5 Training Overview

使用两栏：

左：

- 当前训练摘要
- 数据来源
- 难度口径

右：

- 更新时间
- 数据状态
- 未来 Connected Accounts 入口占位说明

组件使用 Collapsible / Tooltip / Badge 让辅助信息不占主视觉。

---

# 4. 写题页面 `/practice`

写题页的核心不是 Dashboard，而是：

> 今天下一道题做什么？

页面要明显比个人页面更聚焦。

---

## 4.1 页面结构

```text
Sidebar
│
└── Main
    ├── Practice Header
    ├── Primary Recommendation
    ├── Recommendation Reason
    └── Training Context / Future Queue
```

---

## 4.2 Practice Header

文案：

```text
今天练什么？
根据当前训练记录，为你选择下一道值得做的题。
```

右侧可以放：

- 当前来源
- 更新时间
- 推荐状态

不要出现很多统计卡。

---

## 4.3 Primary Recommendation

整页最重要的一张大卡。

```text
┌────────────────────────────────────────────────────┐
│ Recommended                                        │
│                                                    │
│ Codeforces · 1600                                  │
│ D. Problem Title                                   │
│                                                    │
│ DP    Graph    Greedy                              │
│                                                    │
│ 为什么推荐                                         │
│ 根据当前可用训练记录……                              │
│                                                    │
│ 当前推荐仍处于早期验证阶段                          │
│                                                    │
│                         [开始做题 ↗]                │
└────────────────────────────────────────────────────┘
```

### 推荐卡 hover

整张卡不要剧烈移动。

hover 时：

- 卡片上浮 3–4px
- 阴影增强
- 顶部 source badge 边界更明显
- CTA 箭头向右上移动 2px
- 标签轻微提升对比度

CTA hover：

- 按钮自身上浮 1px
- icon 位移
- active 时回落形成按压感

---

## 4.4 Recommendation Reason

推荐理由建议独立成内部 Surface：

```text
Why this problem?
┌──────────────────────────────┐
│ Recommendation explanation   │
└──────────────────────────────┘
```

让“题目是什么”和“为什么推荐”形成明确层级。

如果后端 reason 不可用，则显示真实 unavailable 状态，不创造 AI 分析。

---

## 4.5 Future Queue

页面底部可以设计一个“下一步训练”视觉区域，但 V0.1 不伪造额外推荐。

可以显示：

```text
Training Queue
More recommendations will appear here as the system evolves.
```

使用 Skeleton / Empty State 体现未来扩展空间。

不要假装已经有 5 道推荐题。

---

# 5. 登录 Modal

进入 `/profile` 或 `/practice` 时，如果当前产品状态需要表现“受保护页面”，使用统一 Login Modal。

由于当前后端没有真实认证能力，本轮只实现 UI 和交互状态，不制造真实登录成功。

---

## 5.1 Modal 布局

```text
              backdrop blur
┌─────────────────────────────────┐
│            码练星轨              │
│                                 │
│       登录后继续你的训练          │
│                                 │
│  Email / Username               │
│  ┌───────────────────────────┐  │
│  │                           │  │
│  └───────────────────────────┘  │
│                                 │
│  Password                       │
│  ┌───────────────────────────┐  │
│  │                           │  │
│  └───────────────────────────┘  │
│                                 │
│  [          登录           ]    │
│                                 │
│      还没有账号？注册            │
└─────────────────────────────────┘
```

### Modal 交互

打开：

- 背景内容轻微 blur
- 页面不发生明显缩放
- Modal 以 opacity + translateY(8px → 0) 进入
- 动画约 180–220ms

关闭：

- ESC
- Close icon
- 点击遮罩层（可选）

Input：

- focus 时边界 / ring 使用仓库已有语义 Token
- label 保持可见，不只依赖 placeholder

登录按钮：

- hover 上浮 1px
- active 回落
- loading 时显示 Spinner，但不伪造真实后端登录

Modal 底部可以提供：

- `体验 Demo`
- `暂不登录`

具体是否显示根据当前 Demo 流程决定。

---

# 6. 通用组件交互规范

## Card

普通卡片：

- 默认轻边框 + 轻阴影
- 页面背景与 Card 表面必须能明显区分
- hover `translateY(-2px ~ -4px)`
- hover shadow 提升一档
- transition 180–260ms
- 不要所有卡片都持续浮动

重要卡片：

- 不依赖 hover 才能看清层级
- 默认状态已经有清晰层级

## Button

Primary：

- 使用仓库现有 primary Token
- hover 上浮 1px
- active 回落
- icon 可移动 1–2px
- focus ring 始终明显

Secondary：

- 轻表面 + 边框
- hover 提升背景层级

Ghost：

- 导航和辅助操作使用
- hover 出现轻背景

## Badge

用于：

- Platform
- Difficulty
- Status
- Feature label

Badge 尽量小，不要把所有信息都做成彩色标签。

## Tooltip

适合：

- 数据口径
- 难度说明
- 更新时间解释
- 图标按钮

Tooltip 不承载必须阅读的重要信息。

## Popover

适合：

- 语言切换
- 用户菜单
- 训练轨迹节点详情

打开时轻微 scale / fade，避免夸张动画。

## Skeleton

Profile 与 Practice 加载状态不要使用普通 Spinner 占满页面。

使用与最终布局一致的 Skeleton：

- Metric skeleton
- Recommendation skeleton
- Header skeleton

让加载过程也保持完整产品感。

## Empty State

Empty State 不要只有一句“暂无数据”。

包含：

- 简洁图标
- 一句原因
- 一句下一步说明
- 仅在真的有可执行动作时提供按钮

## Sidebar Item

默认：

- Lucide icon
- Label
- 无边框

hover：

- 轻背景
- icon/文字略增强

active：

- 轻背景 + 强文字
- 可以有极细 active indicator
- 不使用整块高饱和蓝色

---

# 7. 动效规范

动效用于“增加产品质感”，不是展示动画技术。

推荐：

- Hover lift
- Arrow micro-motion
- Scroll reveal
- SVG path draw
- Node pulse
- Number count-up
- Subtle card tilt
- Spotlight
- Marquee
- Modal fade / slide
- Popover scale / fade

避免：

- 大面积持续漂浮
- 过度弹簧动画
- 全屏粒子
- 霓虹发光
- 强烈渐变
- 频繁视差
- 所有组件同时运动

所有动画都应支持 `prefers-reduced-motion`。

---

# 8. 响应式

## Desktop

- Landing：大面积品牌展示
- App：Sidebar + Main
- 内容最大宽度保持舒适，不铺满超宽屏

## Tablet

- Sidebar 收窄为 icon rail 或 Drawer
- Bento Grid 重新排列
- Hero 允许上下布局

## Mobile

- Hero 单列
- 产品预览放在文案下方
- Card 全宽
- Metric 2 列或单列
- Sidebar 改 Drawer / Bottom Navigation
- CTA 全宽
- 推荐理由始终可读

---

# 9. 本轮 UI 改造边界

本轮只做：

- 首页品牌视觉重构
- 新的产品导航结构
- Sidebar
- `/profile` 页面布局
- `/practice` 页面布局
- Login Modal UI
- Card / Button / Badge / Tooltip / Popover / Skeleton / Empty State 等现有组件的合理复用
- Hover / focus / press / scroll / entrance 等微交互
- 响应式布局
- 更明确的页面背景与组件层级

本轮不做：

- 新后端接口
- 真实认证系统
- 修改推荐算法
- 修改训练画像计算逻辑
- 新的数据字段
- 伪造真实账号
- 伪造多题推荐
- 改变 Docker / API Gateway / 部署结构

---

# 10. 目标体验

最终产品应该形成两个明显不同的视觉层级：

```text
首页
=
品牌展示 + 产品故事 + 视觉表现力
允许炫技

个人中心 / 写题训练
=
真正的软件工作区
克制、清晰、高级、有层次
```

首页负责让用户觉得：

> “这个产品看起来很有意思，我想试一下。”

个人中心负责让用户觉得：

> “这是我的训练数据。”

写题页面负责让用户觉得：

> “我现在知道下一题该做什么。”

整体保持码练星轨自己的品牌感，而不是传统教学后台、数据管理系统或 Codeforces 的换皮页面。
