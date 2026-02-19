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
