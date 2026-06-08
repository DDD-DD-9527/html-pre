# HTML 预览后台（Vue3 + Express）

一个用于“上传单个 HTML 文件，并通过外网 IP + 端口在线预览”的轻量后台。

## 功能
- 管理员登录（避免被滥用）
- 上传/替换 HTML 文件（支持多个“项目”，上传后立即生效）
- 生成预览链接：`/preview/<项目ID>`
- 预览访问控制开关：公开预览 / 访问码预览（客户侧输入访问码进入预览）

## 本地开发
1. 安装依赖

```bash
npm install
```

2. 配置环境变量

复制 `.env.example` 为 `.env` 并修改其中的值，至少需要 `SESSION_SECRET` 与 `ADMIN_PASSWORD`。

管理员登录默认账号为 `ADMIN_USERNAME`（默认 admin），密码为 `ADMIN_PASSWORD`。

3. 启动

```bash
npm run dev
```

- 前端：`http://localhost:5173`
- 后端：`http://localhost:3001`（实际以你 `.env` 的 `PORT` 为准）

如果你把后端端口改成了 `PORT=3003`，开发态前端需要同时设置：
- `VITE_API_TARGET=http://localhost:3003`

## 生产部署（Docker）
1. 修改 `docker-compose.yml` 里的环境变量（尤其是 `SESSION_SECRET`、`ADMIN_PASSWORD`）
2. 启动

```bash
docker compose up -d --build
```

服务默认监听 `3001`，对外访问：
- 后台：`http://<外网IP>:3001/admin`
- 预览：`http://<外网IP>:3001/preview/<项目ID>`

## 常见问题：登录失败
- `ADMIN_PASSWORD` 或 `SESSION_SECRET` 未配置：后端无法正确登录/维持会话
- 使用 HTTP 访问但 Cookie 被标记为 Secure：浏览器不会保存会话 Cookie，表现为“登录后又被跳回登录页”
  - 默认已使用 `SESSION_COOKIE_SECURE=false`（或不设置）以兼容 HTTP
  - 如果你有 HTTPS（如 Nginx + 证书），可设置 `SESSION_COOKIE_SECURE=true`
- 前后端不在同一域名/端口（尤其是用局域网 IP 访问 5173）：需要设置 `CORS_ORIGIN`
  - 例如：`CORS_ORIGIN=http://192.168.1.10:5173`

## 数据与持久化
默认会把数据写入 `DATA_DIR`（Docker 中为 `/app/data`）：
- `state.json`：当前发布版本与预览访问控制配置
- `uploads/`：上传的 HTML 文件
