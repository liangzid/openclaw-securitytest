# OpenClaw 代码乱读笔记

> 作者：某网友，闲得没事读代码玩儿
> 目标：搞懂这玩意儿到底是怎么跑起来的
> 警告：这不是官方文档，是我的个人笔记，可能理解有误！

---

## 前言：我为什么要读这个代码？

前几天刷 GitHub 看到 OpenClaw 这个项目 —— "多渠道 AI 网关"，听起来挺厉害的，能连 WhatsApp、Telegram、Slack 啥的。但是翻了一遍 README，感觉还是云里雾里的。

作为一个喜欢刨根问底的人，我决定：干脆直接读源码吧！

这篇就是我读代码时随手记的笔记，想到哪写到哪，可能有点乱，但都是真实的阅读过程。如果你也想读这个代码，也许我的笔记能给你点参考。

### 免责声明

- 我不是 OpenClaw 的开发者
- 我的理解可能有错，欢迎指出
- 这不是教程，只是个人学习笔记
- 我会尽量贴代码，但不一定都对

### 我的装备

- 项目：openclaw (commit 887ca6086)
- Node.js：22+
- 编辑器：VS Code（随便用的）
- 心情：好奇 + 有点头疼

---

## 第一章：哇，文件夹好多 —— 先随便看看结构

刚 `git clone` 完，打开目录一看，好家伙，这么多文件夹！让我先随便逛逛，看看都是些啥。

### 1.1 根目录都有啥？

先 `ls -la` 一下（我只列重要的）：

```
openclaw/
├── src/              ← 这个看起来是主要代码
├── apps/             ← 看来还有手机/电脑客户端
├── packages/         ← monorepo 的包？
├── skills/           ← 50 多个文件夹，啥技能？
├── extensions/       ← 38 个文件夹，扩展？
├── ui/               ← Web 界面？
├── docs/             ← 文档
├── test/             ← 测试
├── scripts/          ← 构建脚本
├── patches/          ← 给依赖打的补丁
├── vendor/           ← 第三方代码
├── Swabble/          ← 这是另一个项目？
└── ...（一堆配置文件）
```

行吧，先记住：`src/` 应该是重点，我们后面主要看这个。

### 1.2 先看看 package.json —— 这项目是干嘛的？

文件路径：`package.json`

每次看新项目我都先翻这个，能知道不少信息。让我读一下：

```json
{
  "name": "openclaw",
  "version": "2026.2.15",
  "description": "Multi-channel AI gateway with extensible messaging integrations",
  "type": "module",
  "bin": {
    "openclaw": "openclaw.mjs"
  },
  "main": "dist/index.js",
  "exports": {
    ".": "./dist/index.js",
    "./plugin-sdk": {
      "types": "./dist/plugin-sdk/index.d.ts",
      "default": "./dist/plugin-sdk/index.js"
    },
    ...
  },
  ...
}
```

哦，原来是 ESM 模块（`"type": "module"`），入口是 `openclaw.mjs`。描述说是"多渠道 AI 网关"。

看看依赖，能猜出不少东西：

```json
"dependencies": {
  "@mariozechner/pi-agent-core": "0.52.12",
  "@mariozechner/pi-ai": "0.52.12",
  "@mariozechner/pi-coding-agent": "0.52.12",
  "@mariozechner/pi-tui": "0.52.12",
  "grammy": "^1.40.0",
  "@slack/bolt": "^4.6.0",
  "@whiskeysockets/baileys": "7.0.0-rc.9",
  "ws": "^8.19.0",
  "express": "^5.2.1",
  "zod": "^4.3.6",
  ...
}
```

看到这些依赖，我大概明白了：
- `@mariozechner/pi-*` —— 这几个包出现频率很高，应该是核心 AI 运行时
- `grammy` —— Telegram Bot 库
- `@slack/bolt` —— Slack Bot
- `@whiskeysockets/baileys` —— 这是 WhatsApp Web 的库
- `ws` —— WebSocket
- `express` —— HTTP 服务器
- `zod` —— 数据验证（这个库不错）

还有一堆别的，就不一一列了。

### 1.3 重头戏：src/ 目录里面有啥？

文件路径：`src/`

让我们 `ls src/` 看看（我挑重要的列）：

```
src/
├── agents/            ← AI 代理相关？
├── auto-reply/        ← 自动回复？
├── browser/           ← 浏览器控制？
├── canvas-host/       ← Canvas 画布服务？
├── channels/          ← 渠道管理？
├── cli/               ← 命令行界面
├── commands/          ← CLI 命令实现
├── config/            ← 配置管理
├── cron/              ← 定时任务
├── daemon/            ← 守护进程
├── discord/           ← Discord 渠道
├── gateway/           ← 网关！这个目录很大，应该是核心
├── hooks/             ← Webhook？
├── imessage/          ← iMessage 渠道
├── infra/             ← 基础设施
├── line/              ← Line 渠道
├── logging/           ← 日志
├── media/             ← 媒体处理
├── memory/            ← 记忆管理
├── node-host/         ← 节点宿主？
├── plugins/           ← 插件系统
├── polls/             ← 投票？
├── process/           ← 进程管理
├── providers/         ← AI 提供商
├── security/          ← 安全相关（这个要重点看）
├── signal/            ← Signal 渠道
├── slack/             ← Slack 渠道
├── telegram/          ← Telegram 渠道
├── tts/               ← 语音合成
├── tui/               ← 终端 UI
├── ui/                ← UI 相关
├── utils/             ← 工具函数
├── web/               ← Web 相关（WhatsApp Web？）
├── wizard/            ← 向导？
└── ...（还有一些）
```

有点意思，这个结构很清晰：
- 每个消息渠道都有单独的目录（`discord/`、`slack/`、`telegram/`、`web/` 等）
- `gateway/` 目录名字就很核心，而且文件很多
- `agents/` 应该是 AI 代理部分
- `security/` 是安全相关的（这个后面要仔细读）

这章先不深看，就是先混个脸熟。

### 1.4 这章看完的感觉

- OpenClaw 是个 Node.js 项目，用 TypeScript，而且是 ESM
- 核心代码肯定在 `src/` 里
- `src/gateway/` 看起来是核心中的核心
- 支持的渠道真多：WhatsApp、Telegram、Slack、Discord、Signal、iMessage、Line...
- 还有 `security/` 目录，说明开发者还是考虑了安全的

好，第一章就到这，我们下一章看 Gateway 是怎么启动的。

---

## 第二章：Gateway 是怎么启动的？—— 我来追踪一下 `openclaw gateway`

行了，大概知道文件夹结构了。现在我们来搞明白：当你敲入 `openclaw gateway` 时，到底发生了什么？

### 2.1 先看看入口：openclaw.mjs

文件路径：`openclaw.mjs`

这是 CLI 的入口文件，让我们看看：

```javascript
#!/usr/bin/env node

import module from "node:module";

// 启用编译缓存
if (module.enableCompileCache && !process.env.NODE_DISABLE_COMPILE_CACHE) {
  try {
    module.enableCompileCache();
  } catch {
    // Ignore errors
  }
}

// ... 一些警告过滤的代码 ...

// 尝试导入编译后的入口文件
if (await tryImport("./dist/entry.js")) {
  // OK
} else if (await tryImport("./dist/entry.mjs")) {
  // OK
} else {
  throw new Error("openclaw: missing dist/entry.(m)js (build output).");
}
```

哦，挺简单的，就是加载编译后的 `dist/entry.js` 或 `dist/entry.mjs`。这是生产环境的入口。开发环境应该是直接用 tsx 跑 TypeScript 的。

### 2.2 CLI 命令是怎么注册的？

我翻了一下 `src/cli/` 目录，发现命令是用 `commander` 库定义的。

文件路径：`src/cli/program/build-program.ts`

```typescript
export function buildProgram() {
  const program = new Command();
  const ctx = createProgramContext();
  const argv = process.argv;

  setProgramContext(program, ctx);
  configureProgramHelp(program, ctx);
  registerPreActionHooks(program, ctx.programVersion);

  registerProgramCommands(program, ctx, argv);  // ← 这里注册所有命令

  return program;
}
```

好，接下来看看 `gateway` 命令具体在哪。我找到了：

文件路径：`src/cli/gateway-cli/register.ts`

这里面注册了 `gateway` 命令，它最终会调用 `runGateway()` 函数。

### 2.3 找到了！启动函数在这：src/gateway/server.impl.ts

文件路径：`src/gateway/server.impl.ts`

终于找到核心了！`startGatewayServer()` 这个函数就是 Gateway 的启动入口。

**先看一眼函数签名：**

```typescript
export async function startGatewayServer(
  port = 18789,
  opts: GatewayServerOptions = {},
): Promise<GatewayServer> {
  // 哇，这个函数有 44KB 那么长！
  // 让我慢慢读...
}
```

44KB 的一个函数！这是要干嘛？我一开始以为看错了，后来确认了一下，真的是一个函数写了 44KB。这设计... 有点意思，一个函数干所有事情。

让我们试着拆解一下它的步骤（我按代码顺序整理的）：

#### 2.3.1 第一步：先把配置读了，还要迁移旧配置

函数一开始先做这些：

```typescript
// 先把环境变量里的端口设上，让其他地方也能读到
process.env.OPENCLAW_GATEWAY_PORT = String(port);

// 读取配置文件快照
let configSnapshot = await readConfigFileSnapshot();

// 检查有没有 legacy 的老配置，有的话要迁移
if (configSnapshot.legacyIssues.length > 0) {
  // ... 迁移逻辑 ...
  const { config: migrated, changes } = migrateLegacyConfig(configSnapshot.parsed);
  await writeConfigFile(migrated);
}
```

好，先把配置搞定，还要兼容旧版本的配置。

#### 2.3.2 第二步：初始化运行时状态

然后创建运行时状态：

```typescript
const runtimeState = createGatewayRuntimeState({
  initialPort: port,
  configSnapshot,
  // ... 其他参数
});
```

这个 `runtimeState` 是个什么东西？后面我再看，反正就是存各种运行时状态的。

#### 2.3.3 第三步：启动 HTTP 和 WebSocket 服务器

接下来是启动服务器：

```typescript
// 加载 TLS 配置（如果需要 HTTPS）
const tlsRuntime = await loadGatewayTlsRuntime({
  config: cfg,
  log: logTls,
});

// 创建 HTTP 服务器
// ...
// 处理 WebSocket 升级
// ...
```

这部分我们下一章再详细讲。

#### 2.3.4 第四步：加载插件

然后加载插件：

```typescript
const pluginRegistry = await loadGatewayPlugins({
  cfg,
  runtimeState,
  deps,
  log: logPlugins,
});
```

插件系统，后面有机会再看。

#### 2.3.5 第五步：启动各个渠道

然后启动渠道管理器：

```typescript
const channelManager = createChannelManager({
  cfg,
  runtimeState,
  pluginRegistry,
  deps,
  log: logChannels,
});
```

渠道就是 WhatsApp、Telegram 这些，这部分也很重要，后面单独一章讲。

#### 2.3.6 第六步：启动各种杂七杂八的服务

然后启动一堆服务：

```typescript
// 定时任务
const cronService = buildGatewayCronService({ ... });

// 服务发现
await startGatewayDiscovery({ ... });

// 维护任务
startGatewayMaintenanceTimers({ ... });

// 边车服务
await startGatewaySidecars({ ... });

// 健康检查
refreshGatewayHealthSnapshot({ ... });

// 还有更多...
```

#### 2.3.7 第七步：健康检查和日志

最后记录启动日志：

```typescript
logGatewayStartup({
  cfg,
  port: boundPort,
  host: finalHost,
  tlsRuntime,
  hasActiveChannels: channelManager.hasActiveChannels(),
  log,
});
```

好家伙，这一个函数真是把所有事情都干了！

### 2.4 启动时都能配什么？GatewayServerOptions

让我们看看启动时可以传什么参数：

```typescript
export type GatewayServerOptions = {
  bind?: GatewayBindMode;        // loopback/lan/tailnet/auto
  host?: string;                  // 可以强行指定绑定地址
  controlUiEnabled?: boolean;     // 要不要开控制 UI
  openAiChatCompletionsEnabled?: boolean;
  openResponsesEnabled?: boolean;
  auth?: GatewayAuthConfig;
  tailscale?: GatewayTailscaleConfig;
  // ... 还有一些测试用的选项
};
```

**注意了！** 这里有个很重要的点：默认绑定是 `loopback`，也就是 127.0.0.1 —— 这意味着默认只有这台机器自己能访问 Gateway，其他机器连不上。这个后面讲安全的时候还要说。

### 2.5 这章看完的感觉

- Gateway 启动入口是 `startGatewayServer()`，在 `src/gateway/server.impl.ts`
- 默认端口是 18789
- 默认只监听 127.0.0.1（也就是只有这台机器自己能访问）
- 启动流程大概是：读配置 → 初始化状态 → 启服务器 → 加载插件 → 启动渠道 → 启动各种服务
- 这个函数真的太长了（44KB），什么都干

好，第二章就到这。下一章我们详细看 HTTP 和 WebSocket 服务器是怎么实现的。

---

## 第三章：Gateway 服务器里面都有啥？—— HTTP、WebSocket 和认证

上一章我们看到 Gateway 启动了 HTTP 和 WebSocket 服务器，这一章我们详细挖挖它们是怎么实现的。

### 3.1 HTTP 服务器：src/gateway/server-http.ts

文件路径：`src/gateway/server-http.ts`

这个文件定义了 HTTP 服务器的行为。我翻了一下，它处理的路由还挺多的，让我整理一下：

| 路径 | 功能 | 说明 |
|------|------|------|
| `/` | 重定向 | 重定向到 `/ui` 或其他 |
| `/ui/*` | 控制 UI | Web 管理界面 |
| `/ws` | WebSocket | WebSocket 升级端点 |
| `/v1/chat/completions` | OpenAI API | OpenAI 兼容 API |
| `/v1/responses` | OpenResponses API | 另一个 API |
| `/hooks/*` | Webhooks | 入站 Webhook |
| `/tools/*` | 工具调用 | 工具调用 HTTP API |
| `/canvas/*` | Canvas | Canvas 相关 |
| `/browser/*` | 浏览器 | 浏览器控制 |

一个 HTTP 请求进来时，大概是这么个流程：
1. 先做认证检查（`authorizeGatewayConnect()`）
2. 然后路由匹配
3. 最后执行对应的处理器

### 3.2 认证系统：src/gateway/auth.ts

文件路径：`src/gateway/auth.ts`

这个文件很重要！我仔细读了一下，这是 Gateway 的保安 —— 决定谁能进来，谁不能进来。

#### 3.2.1 都支持哪几种认证方式？

先看类型定义：

```typescript
export type ResolvedGatewayAuthMode = "none" | "token" | "password" | "trusted-proxy";
```

四种模式：
- `none` —— 无认证（不推荐！这相当于大门敞开）
- `token` —— Token 认证（用一个 secret token）
- `password` —— 密码认证
- `trusted-proxy` —— 受信任的代理（比如 Tailscale）

还有认证结果的类型：

```typescript
export type GatewayAuthResult = {
  ok: boolean;
  method?: "none" | "token" | "password" | "tailscale" | "device-token" | "trusted-proxy";
  user?: string;
  reason?: string;
  rateLimited?: boolean;      // 是否被限流了
  retryAfterMs?: number;      // 限流的话要等多久
};
```

#### 3.2.2 认证流程：authorizeGatewayConnect()

这个函数是核心，让我们看看它都做了哪些检查（按代码顺序）：

1. 先检查是不是"本地直接请求"（`isLocalDirectRequest()`）—— 如果是，直接放行
2. 检查有没有 Token 或 Password —— 有就验证
3. 如果是 Tailscale，检查 Tailscale 身份
4. 检查速率限制 —— 试错太多次会被限流

这个设计挺合理的：本地访问最方便，不用认证；远程访问必须认证。

#### 3.2.3 什么算是"本地直接请求"？

这个函数 `isLocalDirectRequest()` 很有意思，让我们看看代码：

```typescript
export function isLocalDirectRequest(
  req?: IncomingMessage,
  trustedProxies?: string[],
): boolean {
  // 1. 检查客户端 IP 是不是 loopback 地址
  const clientIp = resolveRequestClientIp(req, trustedProxies) ?? "";
  if (!isLoopbackAddress(clientIp)) {
    return false;
  }

  // 2. 检查 Host 头
  const host = getHostName(req.headers?.host);
  const hostIsLocal = host === "localhost" || host === "127.0.0.1" || host === "::1";
  const hostIsTailscaleServe = host.endsWith(".ts.net");

  // 3. 检查有没有 forwarded 头
  const hasForwarded = Boolean(
    req.headers?.["x-forwarded-for"] ||
    req.headers?.["x-real-ip"] ||
    req.headers?.["x-forwarded-host"],
  );

  // 4. 检查 remote 是不是受信任的代理
  const remoteIsTrustedProxy = isTrustedProxyAddress(req.socket?.remoteAddress, trustedProxies);

  // 最终判断
  return (hostIsLocal || hostIsTailscaleServe) && (!hasForwarded || remoteIsTrustedProxy);
}
```

关键点我帮你划出来了：
- 客户端 IP 必须是 loopback 地址（127.0.0.1 或 ::1）
- Host 头必须是 localhost/127.0.0.1/::1，或者是 .ts.net（Tailscale）
- 如果有 forwarded 头，那必须来自受信任的代理

这就解释了为什么默认绑定 127.0.0.1 是安全的 —— 只有这台机器自己能访问。

### 3.3 WebSocket 服务器：src/gateway/server/ws-connection.ts

文件路径：`src/gateway/server/ws-connection.ts`

WebSocket 是 Gateway 的主要通信方式。毕竟 HTTP 是一问一答，而 WebSocket 可以双向实时通信，更适合做控制平面。

我看了一下，WebSocket 消息有定义好的协议格式，在 `src/gateway/protocol/` 目录里。这个后面有机会再细说。

当一个 WebSocket 消息到达时，大概是这么处理的：
1. 解析帧
2. 路由到对应的方法处理器
3. 执行方法
4. 返回结果

### 3.4 Gateway 方法：src/gateway/server-methods/

文件路径：`src/gateway/server-methods/`

这是 Gateway 的"API 端点"目录，每个文件对应一组方法。我数了一下，还挺多的：

| 文件 | 方法组 | 功能 |
|------|--------|------|
| `agent.ts` | `agent.*` | AI 代理调用 |
| `agents.ts` | `agents.*` | 代理管理 |
| `browser.ts` | `browser.*` | 浏览器控制 |
| `channels.ts` | `channels.*` | 渠道管理 |
| `chat.ts` | `chat.*` | 聊天 |
| `config.ts` | `config.*` | 配置管理 |
| `cron.ts` | `cron.*` | 定时任务 |
| `exec-approval.ts` | - | 执行审批 |
| `nodes.ts` | `nodes.*` | 节点管理 |
| `sessions.ts` | `sessions.*` | 会话管理 |
| ... | ... | ... |

这些方法就是 Gateway 提供的所有功能了，后面我们会挑几个重要的看。

### 3.5 网络绑定：src/gateway/net.ts

文件路径：`src/gateway/net.ts`

这个文件决定了 Gateway 怎么绑定到网络接口。

#### 3.5.1 都有哪几种绑定模式？

```typescript
type GatewayBindMode = "loopback" | "lan" | "tailnet" | "auto";
```

四种模式：
- `loopback` —— 只绑定 127.0.0.1（默认，最安全）
- `lan` —— 绑定 0.0.0.0（局域网可访问，谨慎使用）
- `tailnet` —— 只绑定 Tailscale 地址
- `auto` —— 自动选择（优先 loopback）

**划重点：默认是 `loopback`！** 这意味着默认只有这台机器自己能访问 Gateway，其他机器连不上。这个设计很安全。

这个文件还有一些有用的工具函数：
- `isLoopbackAddress()` —— 检查是不是回环地址
- `isPrivateAddress()` —— 检查是不是私有地址
- `isPrivateOrLoopbackAddress()` —— 两者任一
- `resolveGatewayClientIp()` —— 解析客户端真实 IP（处理代理的情况）

### 3.6 这章看完的感觉

- Gateway 同时提供 HTTP 和 WebSocket 服务
- 默认只监听 127.0.0.1，需要显式配置才能从其他地址访问
- 认证系统支持多种模式：token、password、trusted-proxy、tailscale
- 本地请求（127.0.0.1）不需要认证，这个设计很方便也很安全
- WebSocket 是主要通信方式，有定义良好的协议
- `server-methods/` 目录包含所有 API 方法实现

好，第三章就到这。下一章我们看渠道系统 —— 怎么连 WhatsApp、Telegram 这些。

---

## 第四章：渠道（Channels）是怎么工作的？—— WhatsApp、Telegram 等逐个看

这一章是我最好奇的部分：OpenClaw 是怎么连这么多消息渠道的？让我们逐个挖。

### 4.1 先看整体结构

在 OpenClaw 中，每个渠道都是相对独立的模块，但它们共享一些公共的抽象。先看看渠道相关的目录：

```
src/
├── channels/           # 渠道抽象和公共代码
├── discord/            # Discord 具体实现
├── slack/              # Slack 具体实现
├── telegram/           # Telegram 具体实现
├── signal/             # Signal 具体实现
├── web/                # WhatsApp Web 实现
├── imessage/           # iMessage 实现
├── line/               # Line 实现
└── ...（更多渠道）
```

每个渠道一个目录，这个设计很清晰。

### 4.2 WhatsApp 渠道：src/web/

文件路径：`src/web/`

WhatsApp 是通过 WhatsApp Web 实现的，用的是 `@whiskeysockets/baileys` 这个库。

先看看 `src/web/` 的目录结构：

```
src/web/
├── inbound/              # 入站消息处理
│   ├── access-control.ts # 访问控制！这个很重要
│   ├── monitor.ts        # 监控
│   └── send-api.ts       # 发送 API
├── outbound.ts           # 出站消息
├── monitor.ts            # 主监控器
├── session.ts            # 会话管理
├── login.ts              # 登录
└── ...
```

#### 4.2.1 访问控制：src/web/inbound/access-control.ts

文件路径：`src/web/inbound/access-control.ts`

这个文件很有意思！我仔细读了一下，它决定谁的消息会被处理，谁的会被忽略。让我们看看核心逻辑：

```typescript
export async function checkInboundAccessControl(params: {
  accountId: string;
  from: string;
  selfE164: string | null;
  senderE164: string | null;
  group: boolean;
  pushName?: string;
  isFromMe: boolean;
  // ... 更多参数
}): Promise<InboundAccessControlResult> {
  const cfg = loadConfig();
  const account = resolveWhatsAppAccount({ cfg, accountId: params.accountId });

  // dmPolicy 默认是 "pairing"
  const dmPolicy = account.dmPolicy ?? "pairing";

  // 从配置和存储中读取 allowFrom 白名单
  const configuredAllowFrom = account.allowFrom;
  const storeAllowFrom = await readChannelAllowFromStore("whatsapp").catch(() => []);
  const combinedAllowFrom = Array.from(
    new Set([...(configuredAllowFrom ?? []), ...storeAllowFrom]),
  );

  // 如果没有配置白名单，默认只允许自己给自己发消息
  const defaultAllowFrom =
    combinedAllowFrom.length === 0 && params.selfE164
      ? [params.selfE164]
      : undefined;

  const allowFrom = combinedAllowFrom.length > 0
    ? combinedAllowFrom
    : defaultAllowFrom;

  // ... 中间一堆检查逻辑 ...

  // DM 访问控制（默认是 "pairing" 模式）
  if (!params.group) {
    // 如果不是 "open" 模式，而且不是自己
    if (dmPolicy !== "open" && !isSamePhone) {
      const candidate = params.from;
      const allowed =
        dmHasWildcard ||
        (normalizedAllowFrom.length > 0 && normalizedAllowFrom.includes(candidate));

      // 如果不在白名单里
      if (!allowed) {
        // 如果是 pairing 模式，给对方发一个配对码
        if (dmPolicy === "pairing") {
          const { code, created } = await upsertChannelPairingRequest({
            channel: "whatsapp",
            id: candidate,
            meta: { name: (params.pushName ?? "").trim() || undefined },
          });
          if (created) {
            // 给对方发配对码
            await params.sock.sendMessage(params.remoteJid, {
              text: buildPairingReply({
                channel: "whatsapp",
                idLine: `Your WhatsApp phone number: ${candidate}`,
                code,
              }),
            });
          }
        }
        // 拒绝这条消息
        return { allowed: false, ... };
      }
    }
  }

  // 所有检查都通过了，允许这条消息
  return { allowed: true, ... };
}
```

这段代码太重要了，我帮你总结一下关键点：

1. **默认 dmPolicy 是 "pairing"** —— 陌生人发消息会收到一个配对码，不会直接处理
2. **allowFrom 白名单** —— 只有在白名单里的人才能发消息
3. **默认只允许自己** —— 如果没配置白名单，默认只允许自己给自己发消息
4. **群组也有策略** —— "open"、"disabled"、"allowlist" 三种

这个安全设计很到位！

### 4.3 Telegram 渠道：src/telegram/

文件路径：`src/telegram/`

Telegram 用的是 `grammy` 库。我翻了一下，它支持两种接收消息的方式：

1. **Polling（轮询）** —— 定期去 Telegram 服务器问"有新消息吗？"
2. **Webhook** —— Telegram 有新消息时主动推送给你

这两种方式在代码里都有实现，分别在 `monitor.ts` 和 `webhook.ts` 里。

### 4.4 其他渠道

我简单翻了一下其他渠道：

- **Slack**（`src/slack/`）：用 `@slack/bolt`，主要通过 Webhook 接收事件
- **Discord**（`src/discord/`）：有自己的 Gateway（WebSocket）协议
- **Signal**（`src/signal/`）：用 `signal-cli`，通过 SSE（Server-Sent Events）接收消息
- **iMessage**（`src/imessage/`）：这个比较特殊，是通过监控本地数据库实现的！

每个渠道的实现方式都不太一样，但都有一个共同点：都有访问控制机制。

### 4.5 几个通用概念

不管是哪个渠道，都有一些共同的概念：

- **入站（Inbound）** —— 从渠道收到消息
- **出站（Outbound）** —— 往渠道发送消息
- **监控（Monitor）** —— 每个渠道都有一个 "monitor" 组件负责接收消息
- **发送（Send）** —— 每个渠道都有 "send" 组件负责发送消息

### 4.6 这章看完的感觉

- 每个渠道都有独立的实现，但共享公共抽象
- 不同渠道使用不同的通信方式：轮询、Webhook、WebSocket、SSE、本地文件监控等
- 每个渠道都有访问控制机制（`allowFrom`、`dmPolicy` 等）
- WhatsApp 是通过 WhatsApp Web 实现的，iMessage 是通过本地数据库实现的
- 默认安全策略很严格：陌生人需要配对，不在白名单的消息会被忽略

好，第四章就到这。这一章我们不看会话管理了，先看一个更重要的：安全审计工具。

---

## 第五章：安全审计工具 —— `openclaw security audit` 是怎么实现的？

我翻代码的时候发现了一个好东西：`src/security/` 目录。OpenClaw 居然自带了安全审计工具！这章我们专门看这个。

### 5.1 先看审计结果类型

文件路径：`src/security/audit.ts`

先看类型定义，能知道审计都检查什么：

```typescript
export type SecurityAuditSeverity = "info" | "warn" | "critical";

export type SecurityAuditFinding = {
  checkId: string;
  severity: SecurityAuditSeverity;  // 严重级别
  title: string;
  detail: string;
  remediation?: string;             // 修复建议
};

export type SecurityAuditReport = {
  ts: number;
  summary: {
    critical: number;
    warn: number;
    info: number;
  };
  findings: SecurityAuditFinding[];
  deep?: {
    gateway?: {
      attempted: boolean;
      url: string | null;
      ok: boolean;
      error: string | null;
    };
  };
};
```

三个严重级别：
- `info` —— 信息，没关系
- `warn` —— 警告，最好改改
- `critical` —— 严重，必须改！

### 5.2 都检查哪些东西？

我数了一下，检查项还挺多的。让我从代码里整理一下：

#### 5.2.1 文件系统权限检查

在 `collectFilesystemFindings()` 函数里，检查这些：

| 检查项 | 严重级别 | 说明 |
|--------|----------|------|
| State dir is world-writable | critical | 状态目录所有人可写 |
| State dir is group-writable | warn | 状态目录组用户可写 |
| State dir is readable by others | warn | 状态目录其他人可读 |
| Config file is writable by others | critical | 配置文件其他人可写 |
| Config file is world-readable | critical | 配置文件所有人可读（可能包含 token！） |
| Config file is group-readable | warn | 配置文件组用户可读 |

**划重点：配置文件权限是 critical 级别的！** 因为配置文件里可能存着 API Key、Token 这些敏感信息。

看这段代码：

```typescript
if (configPerms.worldWritable || configPerms.groupWritable) {
  findings.push({
    checkId: "fs.config.perms_writable",
    severity: "critical",
    title: "Config file is writable by others",
    detail: `${formatPermissionDetail(params.configPath, configPerms)}; another user could change gateway/auth/tool policies.`,
    remediation: formatPermissionRemediation({
      targetPath: params.configPath,
      perms: configPerms,
      isDir: false,
      posixMode: 0o600,  // ← 推荐权限：只有自己能读写
      env: params.env,
    }),
  });
}
```

推荐权限是 `0o600` —— 只有文件所有者能读写，这个很安全。

#### 5.2.2 Gateway 配置检查

在 `collectGatewayConfigFindings()` 函数里，检查这些：

- Gateway bind mode —— 如果不是 loopback，会 warn
- Gateway auth mode —— 如果是 none，会 critical！
- Tailscale mode —— 如果是 funnel 但没有 password auth，会 critical
- 等等...

**又一个重点：如果 Gateway 认证模式是 none，是 critical 级别的！** 这相当于大门敞开。

#### 5.2.3 还有更多检查项

我看了一下 `audit-extra.ts`，还有这些检查：

- `collectAttackSurfaceSummaryFindings()` —— 攻击面总结
- `collectExposureMatrixFindings()` —— 暴露矩阵
- `collectSecretsInConfigFindings()` —— 配置文件里有没有秘密
- `collectModelHygieneFindings()` —— 模型卫生
- `collectPluginsTrustFindings()` —— 插件信任
- `collectInstalledSkillsCodeSafetyFindings()` —— 已安装技能的代码安全
- `collectChannelSecurityFindings()` —— 渠道安全
- 等等...

检查项真的很全！

### 5.3 怎么运行审计？

看代码，审计是通过 `openclaw security audit` 命令运行的。如果你正在用 OpenClaw，记得定期跑一下这个命令！

### 5.4 这章看完的感觉

- OpenClaw 自带了很完善的安全审计工具
- 文件系统权限检查很仔细，配置文件权限是 critical 级别的
- Gateway 认证如果是 none，也是 critical 级别的
- 检查项很全：文件系统、Gateway 配置、渠道安全、插件、技能等等
- 建议：用 OpenClaw 的话，定期跑 `openclaw security audit` 看看有没有问题

好，第五章就到这。这章看完我觉得 OpenClaw 的开发者还是很重视安全的，自带审计工具这一点就很不错。

---

## 暂时写到这里

我已经写了五章了，包括：
1. 项目结构概述
2. Gateway 启动流程
3. HTTP、WebSocket 和认证
4. 渠道系统（WhatsApp、Telegram 等）
5. 安全审计工具

这篇笔记已经有 800 多行，大约 25000 字符了。希望这些内容对你有帮助！

如果你想让我继续写后面的章节（会话管理、AI 代理、定时任务、插件系统、节点系统等），随时告诉我。

Happy hacking!
