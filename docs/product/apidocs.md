# 码练星轨 CodeStarTrack API


**简介**:码练星轨 CodeStarTrack API


**HOST**:/


**联系人**:


**Version**:v0.1


**接口路径**:/v3/api-docs


[TOC]






# 用户


## 获取用户能力画像


**接口地址**:`/api/users/{userId}/profile`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>指标是<strong>实时计算</strong>的，不是读快照里的旧值。</p>
<p>一个人绑了多个平台时，这里是他所有账号的合计：通过题数按题目去重后相加，
平均难度按「有难度分的题数」加权。</p>
<p>注意 <code>skills</code>（知识点能力分）目前是<strong>占位数据</strong>，画像算法尚未接入。</p>



**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|userId|用户 ID|path|true|integer(int64)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- |
|200|成功|ProfileResponse|
|404|用户不存在，或还没同步过数据没有画像|ApiError|


**响应状态码-200**:


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- |
|userId|用户 ID|integer(int64)|integer(int64)|
|totalSolved|通过题数，跨账号按题目去重|integer(int32)|integer(int32)|
|averageDifficulty|已通过题目的平均难度。**只算有难度分的题**，另有约 9%~23% 的题没有难度分不计入|number||
|maxDifficulty|已通过题目中的最高难度|integer(int32)|integer(int32)|
|skills|各知识点能力分，取值 0.0~1.0。**画像算法尚未接入，当前是占位数据**|array|SkillScore|
|&emsp;&emsp;name|知识点名称|string||
|&emsp;&emsp;score|能力分，0.0~1.0|number||
|recentActivity||RecentActivity|RecentActivity|
|&emsp;&emsp;last_7_days|近 7 天提交数|integer(int32)||
|&emsp;&emsp;last_30_days|近 30 天提交数|integer(int32)||
|updatedAt|画像生成时间|string(date-time)|string(date-time)|


**响应示例**:
```javascript
{
	"userId": 1,
	"totalSolved": 644,
	"averageDifficulty": 1131.4,
	"maxDifficulty": 2400,
	"skills": [
		{
			"name": "dp",
			"score": 0.42
		}
	],
	"recentActivity": {
		"last_7_days": 12,
		"last_30_days": 45
	},
	"updatedAt": "2026-09-29T08:10:00Z"
}
```


**响应状态码-404**:


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- |
|error|错误标识，供程序判断分支。取值稳定，不要用于展示|string||
|message|给人看的说明|string||


**响应示例**:
```javascript
{
	"error": "account_not_found",
	"message": "账号 99 不存在"
}
```


## 获取推荐题目列表


**接口地址**:`/api/users/{userId}/recommendations`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>已有推荐批次、且批次不早于最新画像时直接返回；否则重新生成一批。</p>
<p>候选池是平台题目目录里<strong>该用户没做过的题</strong>，因此题库目录必须先同步过
（<code>POST /api/problems/sync/{platform}</code>），否则候选池只剩用户自己做过的题。</p>
<p><code>reason</code> 是展示文案；结构化的原因另存在库里的 <code>reason_codes</code>。</p>
<p><strong>推荐算法尚未接入</strong>，当前返回的是硬编码的占位结果。</p>



**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|userId|用户 ID|path|true|integer(int64)||
|limit|返回条数上限，最大 50|query|false|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- |
|200|成功|RecommendationResponse|
|404|用户不存在、未绑定账号，或暂时生成不出推荐|ApiError|


**响应状态码-200**:


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- |
|userId|用户 ID|integer(int64)|integer(int64)|
|recommendations|推荐结果。**推荐算法尚未接入，当前是硬编码的占位数据**|array|RecommendedProblem|
|&emsp;&emsp;problemId|内部题目 ID|integer(int64)||
|&emsp;&emsp;platform|平台标识|string||
|&emsp;&emsp;externalProblemId|平台内的题目标识|string||
|&emsp;&emsp;title|题目标题|string||
|&emsp;&emsp;difficulty|题目难度分。**可能为空** —— 最新比赛的题常常还没标难度|integer(int32)||
|&emsp;&emsp;tags|算法标签，可能为空数组|array|string|
|&emsp;&emsp;url|题目链接，直接跳转到平台做题|string||
|&emsp;&emsp;score|推荐分数，0.0~1.0|number||
|&emsp;&emsp;reason|推荐理由（展示文案）。结构化的原因另存在库里的 reason_codes|string||
|generatedAt|本批推荐的生成时间|string(date-time)|string(date-time)|


**响应示例**:
```javascript
{
	"userId": 1,
	"recommendations": [
		{
			"problemId": 101,
			"platform": "codeforces",
			"externalProblemId": "1234B",
			"title": "",
			"difficulty": 1300,
			"tags": [],
			"url": "https://codeforces.com/problemset/problem/1234/B",
			"score": 0.84,
			"reason": "当前 DP 是你的相对薄弱知识点，该题难度略高于当前稳定水平。"
		}
	],
	"generatedAt": "2026-09-29T08:10:00Z"
}
```


**响应状态码-404**:


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- |
|error|错误标识，供程序判断分支。取值稳定，不要用于展示|string||
|message|给人看的说明|string||


**响应示例**:
```javascript
{
	"error": "account_not_found",
	"message": "账号 99 不存在"
}
```


# 账号


## 绑定外部平台账号


**接口地址**:`/api/accounts`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:<p>会立即向平台校验账号是否存在，不存在则返回 404。
只收平台用户名，不收密码或 cookie —— 本项目只读取平台的公开数据。</p>
<p>一个平台账号只能归属一名学生；同一学生在一个平台也只能绑一个账号。</p>



**请求示例**:


```javascript
{
  "user_id": 1,
  "platform": "codeforces",
  "username": "tourist"
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|bindAccountRequest|绑定账号的请求体|body|true|BindAccountRequest|BindAccountRequest|
|&emsp;&emsp;user_id|内部用户 ID||true|integer(int64)||
|&emsp;&emsp;platform|平台标识。V0.1 仅支持 codeforces||true|string||
|&emsp;&emsp;username|平台上的用户名||true|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- |
|201|绑定成功|BindAccountResponse|
|400|参数缺失或平台不支持|ApiError|
|404|用户不存在，或平台上查无此账号|ApiError|
|409|该账号已被绑定，或该用户已绑过此平台|ApiError|
|502|外部平台不可用|ApiError|


**响应状态码-201**:


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- |
|account_id|账号 ID，后续同步接口用它|integer(int64)|integer(int64)|
|platform|平台标识|string||
|username|平台上的用户名，保留平台返回的原始大小写|string||
|created_at|绑定时间|string(date-time)|string(date-time)|


**响应示例**:
```javascript
{
	"account_id": 1,
	"platform": "codeforces",
	"username": "tourist",
	"created_at": "2026-09-29T08:00:00Z"
}
```


**响应状态码-400**:


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- |
|error|错误标识，供程序判断分支。取值稳定，不要用于展示|string||
|message|给人看的说明|string||


**响应示例**:
```javascript
{
	"error": "account_not_found",
	"message": "账号 99 不存在"
}
```


**响应状态码-404**:


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- |
|error|错误标识，供程序判断分支。取值稳定，不要用于展示|string||
|message|给人看的说明|string||


**响应示例**:
```javascript
{
	"error": "account_not_found",
	"message": "账号 99 不存在"
}
```


**响应状态码-409**:


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- |
|error|错误标识，供程序判断分支。取值稳定，不要用于展示|string||
|message|给人看的说明|string||


**响应示例**:
```javascript
{
	"error": "account_not_found",
	"message": "账号 99 不存在"
}
```


**响应状态码-502**:


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- |
|error|错误标识，供程序判断分支。取值稳定，不要用于展示|string||
|message|给人看的说明|string||


**响应示例**:
```javascript
{
	"error": "account_not_found",
	"message": "账号 99 不存在"
}
```


## 同步指定账号的训练数据


**接口地址**:`/api/accounts/{accountId}/sync`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>拉取该账号在平台上的全部提交记录并写入数据库，自动去重。</p>
<p>会阻塞到同步结束（拉全量历史通常几秒到几十秒）。
重复同步是幂等的：<code>new_submissions</code> 会是 0，但 <code>total_submissions</code> 不变。</p>



**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|accountId|账号 ID|path|true|integer(int64)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- |
|200|同步完成|SyncResponse|
|404|账号不存在|ApiError|
|502|外部平台不可用|ApiError|


**响应状态码-200**:


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- |
|status|固定为 success；失败会走错误响应|string||
|new_submissions|本次新增的提交数。重复同步幂等，此时为 0|integer(int32)|integer(int32)|
|total_submissions|该账号在库里的提交总数（不是本次拉取数）|integer(int32)|integer(int32)|
|synced_at|本次同步完成时间|string(date-time)|string(date-time)|


**响应示例**:
```javascript
{
	"status": "success",
	"new_submissions": 35,
	"total_submissions": 428,
	"synced_at": "2026-09-29T08:05:00Z"
}
```


**响应状态码-404**:


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- |
|error|错误标识，供程序判断分支。取值稳定，不要用于展示|string||
|message|给人看的说明|string||


**响应示例**:
```javascript
{
	"error": "account_not_found",
	"message": "账号 99 不存在"
}
```


**响应状态码-502**:


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- |
|error|错误标识，供程序判断分支。取值稳定，不要用于展示|string||
|message|给人看的说明|string||


**响应示例**:
```javascript
{
	"error": "account_not_found",
	"message": "账号 99 不存在"
}
```


# 题库


## 同步题目目录


**接口地址**:`/api/problems/sync/{platform}`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>全量拉取平台的题目目录，已有题目不动（只补原先缺失的难度分）。</p>
<p>推荐系统的候选池依赖这里：<strong>不做这一步，候选池就只剩用户提交里出现过的题</strong>，
推荐会退化成推荐自己做过的题。</p>
<p>题库全局共享，一次同步服务所有学生，因此与账号同步解耦。
题目变化很慢（比赛结束后才加题、难度分可能过几天才标），不需要高频执行。</p>



**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|platform|平台标识|path|true|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- |
|200|同步完成，返回新增题目数||
|400|不支持的平台|ApiError|
|502|外部平台不可用|ApiError|


**响应状态码-400**:


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- |
|error|错误标识，供程序判断分支。取值稳定，不要用于展示|string||
|message|给人看的说明|string||


**响应示例**:
```javascript
{
	"error": "account_not_found",
	"message": "账号 99 不存在"
}
```


**响应状态码-502**:


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- |
|error|错误标识，供程序判断分支。取值稳定，不要用于展示|string||
|message|给人看的说明|string||


**响应示例**:
```javascript
{
	"error": "account_not_found",
	"message": "账号 99 不存在"
}
```
