export const v02CommonZh = {
  "v02.navTraining": "平台与综合训练",
  "v02.navCodeforces": "Codeforces 训练",
  "v02.codeforcesProfile": "CF 综合画像",
  "v02.codeforcesPractice": "CF 账号推荐",
  "v02.error.INVALID_PROBLEM_REF": "题目引用无效，请刷新题目详情后重试。",
  "v02.error.PROBLEM_VERSION_CONFLICT":
    "题目版本已更新。源码已保留，请刷新详情并确认后再次提交。",
  "v02.error.PROBLEM_NOT_SUBMITTABLE":
    "题目当前不可提交。源码已保留，可刷新题库查看可用题目。",
  "v02.error.LANGUAGE_NOT_SUPPORTED":
    "当前题目或服务不再支持此语言。请刷新语言能力后重新选择。",
  "v02.error.SOURCE_TOO_LARGE":
    "源码超过 262144 字节的 UTF-8 限制，请修改后提交。",
  "v02.error.INPUT_TOO_LARGE":
    "完整分析输入超过服务限制，请检查数据来源；历史不会被截断。",
  "v02.error.IDEMPOTENCY_CONFLICT":
    "此次操作的内容与原请求不一致，请以新的操作重新提交。",
  "v02.error.ANALYSIS_ALREADY_COMPLETE": "分析已完成，请刷新现有结果。",
  "v02.error.ANALYSIS_NOT_RETRYABLE":
    "此次分析暂不可重试，请刷新判题与分析状态。",
  "v02.error.JUDGE_UNAVAILABLE":
    "判题服务暂不可用，请稍后重试。已接受的提交仍可查看。",
  "v02.error.JUDGE_TIMEOUT":
    "判题服务响应超时。请查询原提交，或使用原请求重试。",
  "v02.error.JUDGE_BAD_RESPONSE":
    "判题结果暂不可读取，请刷新原提交查看恢复状态。",
  "v02.error.ALGORITHM_UNAVAILABLE": "分析服务暂不可用，已有判题结果仍然有效。",
  "v02.error.ALGORITHM_TIMEOUT":
    "分析服务响应超时，请稍后查询原任务或重试原操作。",
  "v02.error.ALGORITHM_BAD_RESPONSE":
    "分析结果暂不可读取，请保留原任务并刷新查询。",
  "v02.error.USER_SOURCE_NOT_READY":
    "部分 Codeforces 数据尚未就绪，请先同步或检查账号；平台提交仍可查看。",
  "v02.error.DATA_CHANGED": "训练数据已更新，请重建综合学习画像后再生成推荐。",
} as const;

export const v02CommonEn = {
  "v02.navTraining": "Platform & learning",
  "v02.navCodeforces": "Codeforces practice",
  "v02.codeforcesProfile": "CF combined profile",
  "v02.codeforcesPractice": "CF account recommendations",
  "v02.error.INVALID_PROBLEM_REF":
    "The problem reference is invalid. Refresh the problem before retrying.",
  "v02.error.PROBLEM_VERSION_CONFLICT":
    "The problem version changed. Your source is preserved. Refresh and confirm before submitting again.",
  "v02.error.PROBLEM_NOT_SUBMITTABLE":
    "This problem is currently unavailable for submission. Your source is preserved; refresh the bank for available problems.",
  "v02.error.LANGUAGE_NOT_SUPPORTED":
    "This language is no longer available for the problem or service. Refresh language capabilities and select again.",
  "v02.error.SOURCE_TOO_LARGE":
    "Source exceeds the 262144-byte UTF-8 limit. Edit it before submitting.",
  "v02.error.INPUT_TOO_LARGE":
    "The complete analysis input exceeds the service limit. Check its sources; history is not truncated.",
  "v02.error.IDEMPOTENCY_CONFLICT":
    "This operation differs from its original request. Submit it as a new operation.",
  "v02.error.ANALYSIS_ALREADY_COMPLETE":
    "Analysis is complete. Refresh the existing result.",
  "v02.error.ANALYSIS_NOT_RETRYABLE":
    "This analysis cannot currently be retried. Refresh judging and analysis status.",
  "v02.error.JUDGE_UNAVAILABLE":
    "Judging is temporarily unavailable. Retry later; accepted submissions remain accessible.",
  "v02.error.JUDGE_TIMEOUT":
    "Judging timed out. Query the original submission or retry its original request.",
  "v02.error.JUDGE_BAD_RESPONSE":
    "The judging result cannot currently be read. Refresh the original submission to check recovery.",
  "v02.error.ALGORITHM_UNAVAILABLE":
    "Analysis is temporarily unavailable. Existing judging results remain valid.",
  "v02.error.ALGORITHM_TIMEOUT":
    "Analysis timed out. Query the original task or retry the original operation later.",
  "v02.error.ALGORITHM_BAD_RESPONSE":
    "The analysis result cannot currently be read. Keep the original task and refresh.",
  "v02.error.USER_SOURCE_NOT_READY":
    "Some Codeforces sources are not ready. Sync or check those accounts; platform submissions remain accessible.",
  "v02.error.DATA_CHANGED":
    "Training data changed. Rebuild the combined learning profile before generating recommendations.",
} satisfies Record<keyof typeof v02CommonZh, string>;
