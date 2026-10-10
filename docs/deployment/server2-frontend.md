# server2 前端部署指南

本文用于将码练星轨（codeStartrack）的已发布前端镜像交给运维部署。**本次工作只准备镜像和文档，没有登录 server2、创建容器、修改入口、配置证书或部署前端。** 下文服务器命令均为运维后续操作说明，不代表已经执行或成功。

本次按用户指令停止功能开发、视觉审查和额外本地测试。GitHub 分支保护要求的 CI 以及现有发布工作流自身的构建、测试仍须完成；不得删除检查、使用管理员绕过保护或将旧检查结果当作本次发布结果。

**发布状态：BLOCKED。PR #42 已通过必需 CI 并合并，但 2026-10-10 的发布工作流在容器验收阶段失败，尚未推送任何本次镜像。预期版本 `v0.14.0` 尚未由本次工作流发布，真实 registry digest 不存在。`__IMAGE_DIGEST__`、`__PUBLISHED_VERSION__` 仍是后续成功发布后才能填写的占位，不能原样执行部署命令。** 本次没有为绕过验收而直接推送。用户随后明确允许最小验收同步：验证编辑器内结果后点击现有“查看提交”链接，再保留原详情及代理验收；该变更正在重新通过必需 CI，发布尚未成功。

## 1. 发布回执与适用范围

| 项目                     | 本次记录                                                                                                                    |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| 仓库                     | `STAR-Ability/code-startrack-frontend`                                                                                      |
| 合并 PR                  | [PR #42](https://github.com/STAR-Ability/code-startrack-frontend/pull/42)（已合并，必需检查通过）                           |
| 本次失败构建的 main 提交 | `c281f215c06319820324b185b0e16b4db3cf2a8d`                                                                                  |
| 发布工作流               | [Publish production image](../../.github/workflows/release.yml)，仅允许从 `main` 手动触发                                   |
| 本次 Actions 运行        | [38016497390](https://github.com/STAR-Ability/code-startrack-frontend/actions/runs/38016497390)：FAIL，容器验收阻塞，未推送 |
| 镜像仓库                 | `ghcr.io/star-ability/code-startrack-frontend`                                                                              |
| 实际版本标签             | 待发布，预期 `v0.14.0`                                                                                                      |
| 提交标签                 | 未推送；该次拟发布 `sha-c281f215c06319820324b185b0e16b4db3cf2a8d`                                                           |
| 镜像平台                 | 目标 `linux/amd64`；未取得本次已发布清单                                                                                    |
| 不可变 SHA256 digest     | **不存在：本次未推送，不可用本地镜像 ID 替代**                                                                              |
| 推荐部署引用             | 待成功发布后填写 `ghcr.io/star-ability/code-startrack-frontend@sha256:…`                                                    |
| server2 部署             | **NOT RUN：本次明确不部署**                                                                                                 |

### 本次发布阻塞的准确证据

- **PASS：** dev 提交 `5fa45ebcd53c47f5dfdfda27d9b21604cfdb9d82` 的 [PR CI 38015463913](https://github.com/STAR-Ability/code-startrack-frontend/actions/runs/38015463913) 和 [push CI 38015461852](https://github.com/STAR-Ability/code-startrack-frontend/actions/runs/38015461852)；main 合并提交的 [CI 38016479185](https://github.com/STAR-Ability/code-startrack-frontend/actions/runs/38016479185)。
- **PASS：** 发布运行中的 `pnpm check`、生产/Storybook 构建、E2E、Storybook，以及 runner 内 Docker 镜像构建。
- **FAIL：** `pnpm test:container` 在 `tests/container/browser-check.mjs:233` 要求提交后自动跳转 `/submissions/detail?submissionId=…`，实际页面仍在 `/problems/detail`。已合并功能是编辑器内显示提交结果，并由显式链接进入提交详情；该旧验收断言未同步。
- **NOT RUN：** 此失败发生在全部 `docker push` 之前，版本、SHA 和 latest 标签均未从这次运行发布。runner 本地 tag 和 image ID 不代表 GHCR 已发布镜像。
- **已授权的最小修正：** 用户明确允许同步这项验收。脚本增加留在问题页、编辑器内最终结果和显式“查看提交”链接的验证，保留原后续详情、私有源码、训练及代理检查；应用、后端和工作流未修改。继续发布仍须该提交的原 CI 和原发布工作流成功。

生产部署应固定 `@sha256:…`。版本标签便于识别；`latest` 会变化，不作为部署或回滚依据。Digest 是仓库镜像清单的摘要，不是 Git 提交 SHA，也不是本地镜像 ID。若镜像发布后的文档回执单独合并，镜像仍对应上表的构建提交，不要把后续文档提交误记为镜像来源。

容器运行的是 Next.js 静态导出文件和 Nginx，监听容器内 `80`。无需在服务器安装 Node.js、pnpm，或重新执行前端构建；运行时不需要生产数据库、JWT 密钥、前端 API token。构建与 API 后端可用性相互独立。

现有 [production Compose](../../deploy/compose.production.yml) 和 [历史部署说明](frontend-production-deployment.md) 针对另一台已检查主机。它们可作为配置参考，**其中域名、SSH 别名、容器名、目录、WAF 和回滚镜像不构成 server2 的当前事实**。本文不会将历史主机的入口直接用于 server2。

## 2. 已知限制与部署前置条件

根据 [2026-10-09 的 server2 检查记录](../development/server2-frontend-release-2026-10-09.md)，当时后端 `startrack-app` 使用宿主机网络并在 `8081` 提供服务；未发现已配置的前端容器或前端域名反向代理。该记录不是本次重新检查的结果。

| 状态    | 限制或待确认事项                                                                                                                                            |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BLOCKED | 已登录请求 `/api/v1/platform-problems` 和 `/api/v1/judge-languages` 返回后端 HTTP 500 `INTERNAL_ERROR`。本次不修复后端，也不把它们伪装成成功或切换为 Mock。 |
| NOT RUN | 完整真实题目到提交评测闭环、学习画像重建、推荐生成及完整有数据响应的业务验收未完成。成功健康检查或空数据 GET 不能证明这些功能已经可用。                     |
| 未完成  | 广泛页面视觉覆盖未完成，已有公开页窄屏问题及教练页窄屏徽标裁切记录；准备的视觉修改未纳入已合并版本，本次停止继续修复和审查。                                |
| 待确认  | server2 的真实前端域名、DNS、80/443 入口归属、OpenResty/Nginx 的运行位置、证书管理方式和专用部署目录。                                                      |
| 待确认  | 容器到宿主机 `8081` 的网络可达性、后端 `PUBLIC_ORIGIN` 与实际 HTTPS 前端 Origin 的匹配。                                                                    |

部署负责人开始操作前应确认：

1. server2 为 Linux x86-64（`uname -m` 通常为 `x86_64`），具有可用 Docker Engine、Compose v2，以及读取该 GHCR package 的权限。
2. 为前端选定一个真实域名；本文 `frontend.example.com` 仅为占位符，所有域名、证书路径和邮箱均须替换。DNS A/AAAA 必须指向正确入口，已有 IPv6 记录也必须可达。
3. 确定谁拥有公网 80/443；沿用现有入口的管理方式。不能新启动一个监听相同端口的代理覆盖现有站点，也不能删除现有 OpenResty/1Panel/WAF 配置。
4. 前端容器仅发布到 `127.0.0.1:3000`。公网通过 HTTPS 入口访问；不要为排障向公网开放 3000 或后端 8081。
5. 与后端负责人确认 `PUBLIC_ORIGIN` 接受选定的完整 Origin，例如 `https://frontend.example.com`；Origin 包含协议、主机及非默认端口，不带路径。后端配置变更由后端负责人独立审批和实施，本指南不修改后端。
6. 若后端 Session cookie 自带 `Domain` 或特殊 `Path`，须确认与新的前端域名及 `/api/v1/` 相容。镜像只强化指定 cookie 的安全标志，不自动修复后端错误的 cookie 域名。

以下只读命令可供**后续运维**检查服务器；本次没有执行：

```bash
uname -m
docker version
docker compose version
docker ps --format '{{.Names}} | {{.Image}} | {{.Ports}}'
ss -ltn
curl --noproxy '*' -fsS http://127.0.0.1:8081/health
```

需要 `sudo` 时，使用同一个经授权的 Docker 执行身份完成登录、拉取和 Compose 操作；普通用户 `docker login` 的凭据不会自动供 `sudo docker` 使用。不要输出私有 `.env`、完整容器环境或凭据文件。

## 3. 网络与 API 代理关系

推荐流量路径如下：

```text
浏览器 https://frontend.example.com
  → 已确认的 Nginx/OpenResty HTTPS 入口
  → 宿主机 127.0.0.1:3000
  → 前端容器 Nginx :80
      ├─ 页面和 /_next/static/**：静态导出文件
      ├─ /healthz：前端存活检查，固定返回 200
      └─ /api/v1/**：BACKEND_BASE_URL 指向的后端 :8081
```

浏览器始终调用同源 `/api/v1/**` 并携带 Session cookie，不应直接请求 `http://server2:8081`。没有要设置的 `NEXT_PUBLIC_BACKEND_URL` 或 `NEXT_PUBLIC_API_URL`；把后端地址填进这类变量不会配置当前镜像代理。`BACKEND_BASE_URL` 由容器启动时注入，必须是 HTTP(S) origin，如 `http://host.docker.internal:8081`，不带 `/api`、`/api/v1` 或末尾 `/`。

镜像内代理使用 `proxy_pass ${BACKEND_BASE_URL}`，没有附加 URI；例如 `/api/v1/me?x=1` 会以相同路径及查询参数送到后端。它保留浏览器 `Origin` 和 `Host`，传递 HTTPS 信息与客户端转发链，不缓存 API 响应。其他 `/api/` 路径返回 404，不会返回页面 HTML；后端 HTTP 500 保留为真实失败。

外层入口必须覆盖 `X-Forwarded-Proto`，HTTPS 请求设为 `https`，不能直接信任浏览器提供的同名头。生产环境保持 `FRONTEND_COOKIE_SECURE=true`；镜像对 `cst_session` 添加 `Secure`、`HttpOnly`、`SameSite=Lax`。它不会移除已经存在的 Secure 标志；HTTP 本地夹具才允许关闭。不要删除 Origin 绕过后端检查，不要把私有 API 缓存或记录 cookie/token。

### 后端 8081 的可达性

下面 Compose 使用 `host.docker.internal:host-gateway` 将名字解析到 Docker 宿主机网关。**这不等于宿主机的 `127.0.0.1`**：若后端只绑定宿主机回环地址，桥接网络里的前端容器无法通过该网关访问它。宿主机 `curl 127.0.0.1:8081/health` 成功不能证明容器可达。

后续运维必须选择与实际部署相符的拓扑：

- 后端使用宿主机网络，且在 Docker 网关可达的地址监听：可以使用本文 host-gateway 示例；防火墙按实际网段限制访问，8081 不需要公网开放。
- 后端位于独立 Docker 网络：由该网络的维护者确认网络名、后端 DNS 名与容器内端口，并将前端加入经过批准的网络，设置如 `http://<已确认后端服务名>:8081`。不能因为示例出现 `backend` 就假定它一定存在。
- 后端仅监听宿主机 `127.0.0.1:8081`：当前桥接示例不能直接使用；先由运维和后端负责人确定可达方案，不能为部署前端擅自改监听地址、网络模式或开放公网端口。

### OpenResty 位于容器时

下节 Nginx 示例假设入口进程运行在宿主机网络命名空间中；其中 `127.0.0.1:3000` 指向宿主机。若 OpenResty 自身运行在普通桥接容器中，这个地址指向 OpenResty 容器，无法访问宿主机回环发布的前端端口；简单替换为 host-gateway 也无法访问只绑定 `127.0.0.1` 的发布端口。

运维须先确认现有入口拓扑，再选择经过批准的共享 Docker 网络及前端服务 DNS（上游使用该网络中的 `frontend:80`），或现有宿主机网络入口。共享网络应与无关应用隔离且无名称冲突。本文保留前端 `127.0.0.1:3000:80` 发布，不为绕过此问题改为 `0.0.0.0`，也不实际调整 OpenResty 网络。

## 4. GHCR 安全登录与拉取

若 package 为私有，使用有读取权限的 GitHub 账号和 classic PAT，最小权限为 `read:packages`；组织需要 SSO 时还须完成相应授权。公开 package 可以匿名拉取。Actions 使用临时 `GITHUB_TOKEN` 发布；不要把该 token 复制到服务器，也不要为拉取授予 `write:packages` 或 `delete:packages`。[GitHub GHCR 官方认证说明](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry#authenticating-to-the-container-registry)

下面交互式命令在服务器 Bash 中执行，token 不放进命令参数或 shell 历史：

```bash
read -r -p 'GitHub 用户名: ' GHCR_USER
read -r -s -p 'GHCR read:packages token: ' GHCR_READ_TOKEN
printf '\n'
printf '%s' "$GHCR_READ_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin
unset GHCR_READ_TOKEN

docker pull --platform linux/amd64 \
  ghcr.io/star-ability/code-startrack-frontend@__IMAGE_DIGEST__
```

使用现有 credential helper 或限制 Docker 凭据目录权限；不要公开 Docker config、把 token 写进 Compose/.env 或提交到 Git。Registry 登录与 GitHub CLI 登录是不同凭据用途。

## 5. 完整 Docker Compose 与环境文件

示例目录 `/opt/codestartrack/frontend` 是**拟用专用目录**，不是已经确认存在的 server2 路径；确认无人使用后再创建。不要在后端 Compose 项目目录运行这些命令。下文固定项目名 `codestartrack-server2-frontend`、服务名 `frontend`，后续更新和回滚沿用它们。

保存为 `compose.yml`：

```yaml
services:
  frontend:
    image: ${FRONTEND_IMAGE:?Set an immutable GHCR image reference}
    platform: linux/amd64
    environment:
      BACKEND_BASE_URL: ${BACKEND_BASE_URL:?Set the verified backend origin}
      FRONTEND_COOKIE_SECURE: "true"
    extra_hosts:
      - host.docker.internal:host-gateway
    ports:
      - "127.0.0.1:3000:80"
    restart: unless-stopped
    healthcheck:
      test: [CMD, wget, -q, -O, /dev/null, "http://127.0.0.1/healthz"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
```

此示例沿用仓库容器参数，增加明确的平台约束并使后端 origin 可配置，没有 `build`，不会在 server2 下载前端源码构建。若 host-gateway 拓扑不成立，须先落实上一节的经过批准方案，不能直接复制该后端值。

保存为 `.env`：

```dotenv
FRONTEND_IMAGE=ghcr.io/star-ability/code-startrack-frontend@__IMAGE_DIGEST__
BACKEND_BASE_URL=http://host.docker.internal:8081
```

| 配置                     | 用途                                                                   |
| ------------------------ | ---------------------------------------------------------------------- |
| `FRONTEND_IMAGE`         | Compose 拉取的精确镜像引用；更新/回滚只选择经过确认的 digest。         |
| `BACKEND_BASE_URL`       | 容器内部的后端 origin；由镜像 Nginx 模板在启动时展开，不是浏览器地址。 |
| `FRONTEND_COOKIE_SECURE` | Compose 固定为 `true`，保证 HTTPS Session cookie 的安全标志。          |
| `127.0.0.1:3000:80`      | 宿主机回环 3000 转发到容器 80，外层入口负责公网 HTTPS。                |

Compose 的 `.env` 用于变量替换，并通过 `environment` 注入容器；Next.js 的开发 `.env.local` 不作为这里的输入。shell 中同名变量可能优先于 `--env-file`，操作前清除非预期的导出变量，检查生效镜像，不打印敏感环境。[Docker Compose 变量规则](https://docs.docker.com/compose/how-tos/environment-variables/variable-interpolation/)

## 6. Nginx/OpenResty 反向代理与 HTTPS

以下是**宿主机入口**的完整站点示例，按实际入口管理方式加入专用站点，替换占位域名、证书路径和 ACME webroot。它让页面、静态资源和 `/api/v1/**` 都进入前端容器，由容器现有规则选择静态文件或后端；外层不需要再单独将 `/api/v1/` 指向 8081，避免路径和 cookie 规则出现两套配置。

```nginx
server {
    listen 80;
    server_name frontend.example.com;

    location ^~ /.well-known/acme-challenge/ {
        root /var/lib/codestartrack-acme;
        try_files $uri =404;
    }

    location / {
        return 301 https://frontend.example.com$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name frontend.example.com;

    ssl_certificate /etc/letsencrypt/live/frontend.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/frontend.example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    client_max_body_size 2m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $http_host;
        proxy_set_header Origin $http_origin;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Connection "";
        proxy_read_timeout 35s;
        proxy_redirect off;
    }
}
```

`proxy_pass` 不加 URI，保留原始 API 路径和查询参数；转发 Host、Origin、协议，保留后端 `Set-Cookie`。不要在这个站点配置覆盖 cookie 域名、安全标志、API 缓存或 `proxy_intercept_errors` 返回成功页面。容器内 API body 上限为 2 MiB、读取超时 30 秒，外层不应无理由放大。具体指令行为见 [Nginx 官方代理模块](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)。

若入口已有可信的 CDN/WAF/上层代理，需由入口维护者按既有可信来源规则处理客户端 IP 和协议，不能信任任意客户端伪造的转发头；不要覆盖现有安全设施或所有站点的全局配置。

### 证书准备与续期

优先使用现有 1Panel/OpenResty 证书管理流程，确认完整证书链、私钥权限和续期后 reload。若已有经批准的 Certbot，并且域名的公网 80 确实到达上面的 ACME 目录，可采用 webroot 流程：

1. 先只启用上述 HTTP server，创建且映射好 ACME webroot；没有证书文件时不要提前启用 HTTPS server，否则配置检查会失败。
2. 使用真实域名和负责人邮箱签发证书。
3. 证书完成后启用 HTTPS server，执行入口配置检查，再 reload 当前入口。

```bash
sudo install -d -m 755 /var/lib/codestartrack-acme
sudo certbot certonly --webroot \
  -w /var/lib/codestartrack-acme \
  -d frontend.example.com \
  --email ops@example.com --agree-tos

# 仅适用于已确认由 systemd 管理的宿主机 Nginx。
sudo nginx -t
sudo systemctl reload nginx
```

确认系统已有 Certbot 自动续期 timer/cron，且成功续期后会 reload 正确的入口；如需配置 deploy hook，应只针对实际入口，例如宿主机 Nginx 的 `nginx -t && systemctl reload nginx`。在后续运维窗口可运行 `sudo certbot renew --dry-run` 检查续期，本次没有运行。使用 DNS-01 或现有面板签发时，DNS token 必须留在受保护的运维凭据存储中。[Certbot webroot 和续期说明](https://eff-certbot.readthedocs.io/en/stable/using.html#webroot)

容器化 OpenResty 的站点和证书位置须以实际挂载为准；配置检查、reload 应通过现有面板或已确认的容器执行，不能使用宿主机 `systemctl reload nginx` 当作容器 reload。ACME 目录也必须能从真正的公网入口访问。若现有入口只能在 8080/8443 收流量，需要先由入口负责人确认已有 80/443 映射或上层转发；本文没有创建这些映射。

HTTPS 上线后，后端必须接受新的 HTTPS Origin。先协作落实 `PUBLIC_ORIGIN`，不要因为 403 或 cookie 问题改为明文 HTTP、关闭 Secure 或去掉 Origin。

## 7. 运维执行部署

**本节命令尚未在 server2 执行。** 只有确认所有入口、证书、网络和后端 Origin 前置条件后，运维才执行。以下新目录示例适用于首次部署；如已存在该项目，转到更新章节，保留现有文件。

```bash
umask 077
DEPLOY_ROOT=/opt/codestartrack/frontend
install -d -m 700 "$DEPLOY_ROOT/releases/v0.14.0"
cd "$DEPLOY_ROOT/releases/v0.14.0"
```

将第 5 节的 `compose.yml` 和 `.env` 保存在该目录，限制 `.env` 权限，然后检查配置、拉取并只创建前端服务：

```bash
chmod 600 .env
unset FRONTEND_IMAGE BACKEND_BASE_URL
docker compose --project-name codestartrack-server2-frontend \
  --env-file .env -f compose.yml config --quiet
docker compose --project-name codestartrack-server2-frontend \
  --env-file .env -f compose.yml config --images
docker compose --project-name codestartrack-server2-frontend \
  --env-file .env -f compose.yml pull frontend
docker compose --project-name codestartrack-server2-frontend \
  --env-file .env -f compose.yml up --no-build --no-deps -d --wait frontend
docker compose --project-name codestartrack-server2-frontend \
  --env-file .env -f compose.yml ps
```

不执行 `down`、删除容器或 volume 清理。拉取和 `up` 只针对本指南的 `frontend` 服务，不操作后端、数据库、算法服务、入口或无关 Compose 项目。健康等待失败时保留现场并看日志，不反复删容器重建。

### 部署后检查（由运维执行）

```bash
docker compose --project-name codestartrack-server2-frontend \
  --env-file .env -f compose.yml images frontend
curl --noproxy '*' -fsS http://127.0.0.1:3000/healthz
curl --noproxy '*' -sS -o /dev/null -w 'Frontend page HTTP %{http_code}\n' \
  http://127.0.0.1:3000/
curl --noproxy '*' -sS -o /dev/null -w 'Anonymous /me HTTP %{http_code}\n' \
  http://127.0.0.1:3000/api/v1/me
curl -fsS https://frontend.example.com/healthz
```

`/healthz` 200 仅表示前端 Nginx 存活，**不证明后端可达、登录可用、题库可用、评测成功或视觉验收完成**。未登录 `/api/v1/me` 的预期结果是 401 `SESSION_EXPIRED`，不应是 HTML 或伪造的成功响应。后续需要真实业务验收时，应另行授权、明确测试账号和可变更数据范围；本文不安排真实登录、提交或推荐生成操作。

确认入口生效后，应记录实际 DNS、证书到期日、生效配置位置、镜像 digest、运维时间和检查结果到受控运维记录；不能把本文模板当作这些事项的完成记录。

## 8. 更新、日志与回滚

### 更新

后续版本必须先通过受保护 PR 从 `dev` 合并 `main`，再使用现有发布工作流；查看准确构建提交和成功运行回执。发布工作流禁止覆盖已存在的版本标签；不能绕过这项限制推送同名版本，也不要为了更新在 server2 本地构建。

更新前记录实际当前 digest，并备份当前 `.env`、Compose 和实际入口站点配置。备份应放在专用受保护目录；只备份该前端的文件，不能复制后端私密环境到仓库。

```bash
umask 077
DEPLOY_ROOT=/opt/codestartrack/frontend
CURRENT_RELEASE_DIR=/opt/codestartrack/frontend/releases/<实际当前版本>
BACKUP_DIR="$DEPLOY_ROOT/backups/$(date -u +%Y%m%dT%H%M%SZ)"
install -d -m 700 "$BACKUP_DIR"
cp "$CURRENT_RELEASE_DIR/.env" "$CURRENT_RELEASE_DIR/compose.yml" "$BACKUP_DIR/"
```

上面 `<实际当前版本>` 须先替换，不能原样执行。为新版本创建新的 release 目录，保留同一个项目名/服务名，在新 `.env` 写入新 digest；以新目录重复第 7 节 `config`、`pull frontend`、`up --no-build --no-deps -d --wait frontend` 及部署后检查。`restart` 不更新镜像或环境变量，不能代替更新流程。保留原 release 目录和镜像以便回滚。

### 日志与运行状态

以下命令在所选 release 目录中执行：

```bash
docker compose --project-name codestartrack-server2-frontend \
  --env-file .env -f compose.yml logs --tail 100 frontend
docker compose --project-name codestartrack-server2-frontend \
  --env-file .env -f compose.yml logs -f frontend
docker compose --project-name codestartrack-server2-frontend \
  --env-file .env -f compose.yml exec -T frontend nginx -t
docker compose --project-name codestartrack-server2-frontend \
  --env-file .env -f compose.yml exec -T frontend \
  wget -q -O - http://127.0.0.1/healthz
```

按实际入口位置查看 Nginx/OpenResty 日志。公开报告只保留状态、时间和后端 request ID，不公开 cookie、认证体、token、用户源代码或私有环境。

### 按 digest 回滚

首次部署前若没有兼容的 server2 前端历史版本，就不存在已经验证的 server2 回滚目标。不能把另一台主机的旧镜像自动当作兼容回滚版本。后续更新应提前保留**实际上一版**镜像 digest、匹配的 Compose/.env，以及 API 兼容性记录。

如新前端不满足运维检查，进入实际上一版 release 目录，用该版本已固定的 `.env` 只重建前端：

```bash
cd /opt/codestartrack/frontend/releases/<实际上一版本>
unset FRONTEND_IMAGE BACKEND_BASE_URL
docker compose --project-name codestartrack-server2-frontend \
  --env-file .env -f compose.yml config --images
docker compose --project-name codestartrack-server2-frontend \
  --env-file .env -f compose.yml pull frontend
docker compose --project-name codestartrack-server2-frontend \
  --env-file .env -f compose.yml up --no-build --no-deps -d --wait frontend
curl --noproxy '*' -fsS http://127.0.0.1:3000/healthz
```

确认显示的是已记录的上一版 digest，再重复入口及只读 API 检查。回滚前端不同时回滚后端或数据库；不清理数据库、持久卷、旧镜像或其他服务。若变更了入口配置，另按已备份的**该前端站点**配置执行检查和 reload，不覆盖整个入口配置树。

## 9. 故障排查

| 现象                                         | 判断与处理                                                                                                                                                  |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GHCR `unauthorized` / `denied`               | 确认 package 读取权限、classic PAT 的 `read:packages`、组织 SSO，以及登录和 Docker 操作是否使用同一身份。不要把 token 贴到日志或提升为写权限。              |
| `no matching manifest` / `exec format error` | 对照发布回执和平台；本镜像面向 `linux/amd64`。ARM 主机不能被当作原生 amd64 部署。                                                                           |
| 3000 已占用                                  | 检查监听者和现有 Compose 项目归属；不要杀死无关进程。确认前端专用绑定后再协调端口和上游配置。                                                               |
| `/healthz` 200，但 API 502                   | 查看前端日志、`BACKEND_BASE_URL`、host-gateway 与后端实际监听/网络。宿主机回环可达不等于容器可达；不要开放公网 8081 作为补救。                              |
| API 401                                      | 未登录时是预期状态；有 Session 时核对 HTTPS cookie、域名/Path、过期和转发链，不关闭鉴权。                                                                   |
| Origin 403 或登录后 Session 丢失             | 核对浏览器实际 Origin、外层 HTTPS 转发和后端 `PUBLIC_ORIGIN`；检查 `Set-Cookie` 的 Domain/Path/Secure。保持 Origin 和 cookie 保护，由后端负责人处理其配置。 |
| 题库/语言接口 500 `INTERNAL_ERROR`           | 已知后端限制。记录路径、时间、request ID 给后端负责人；本次不修复、不隐藏失败、不启用生产 Mock，也不要求镜像重新构建解决后端错误。                          |
| API 返回 HTML 或路径 404                     | 确认浏览器使用 `/api/v1/**`；外层代理不能截掉 `/api/v1`，非当前 API 前缀按镜像规则返回 404。                                                                |
| 页面/静态资源 404                            | 查实际请求路径、入口上游、发布 digest 和 Nginx 日志。镜像支持已导出的深链接；未知页面/缺失资源返回 404。`/healthz` 成功不能替代页面验收。                   |
| TLS 证书错误或签发失败                       | 核对 DNS A/AAAA、80/443 真正入口、挑战目录、证书域名/完整链/权限及续期。不要用 `curl -k` 把证书错误写成成功。                                               |
| 容器化 OpenResty 连接 `127.0.0.1:3000` 失败  | 容器回环并非宿主机回环；按第 3 节确认批准的共享网络或现有宿主机入口，不改成公网端口绕过。                                                                   |
| 公网被 WAF/上层访问控制拦截                  | 保留现有策略并按该入口正规验证流程处理；单独区分前端回环状态、上游状态和边缘拦截，不能声称已通过公网验收。                                                  |
| 更新后仍旧镜像                               | 查看 `config --images`、shell 同名变量和实际服务镜像；更新需要 `pull` 与 `up`，单独 `restart` 不会更换镜像。                                                |

必要时运维可在前端容器内进行后端只读健康探测，用已经确认的后端 origin（示例仅适用于 host-gateway 拓扑）：

```bash
docker compose --project-name codestartrack-server2-frontend \
  --env-file .env -f compose.yml exec -T frontend \
  wget -q -O - http://host.docker.internal:8081/health
```

这也只证明该健康地址可达，不代替受保护业务检查。不安装排障工具到生产容器、不改全局 Docker 配置、不删除 volume、不改后端数据；如需更改基础设施，须由相应负责人按独立变更流程处理。

## 10. 本次交付与后续运维边界

本次交付以受保护 PR 合并结果、现有 GitHub Actions 发布结果及 registry 实际 digest 为准。服务器部署、入口配置、证书签发/续期验证、部署后检查均为 **NOT RUN**；本文的命令是可执行操作指南，不是成功日志。

GitHub CI 和发布工作流通过，证明对应提交及镜像在各自自动化范围内完成检查，不能推导 server2 已部署、后端 HTTP 500 已解决、真实评测闭环已通过或完整视觉审查已完成。上述已知限制需要继续保留在后续发布与运维记录中。
