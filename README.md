# DeepSeek Harness — macOS 桌面壳

一个把 [DeepSeek Harness](https://github.com/deepseek-ai)（本地 Web UI）包装成**原生 macOS App** 的轻量 Electron 壳：

双击 `DeepSeek Harness.app` → 自动拉起 `dsh web` 服务（使用 Harness 自带的 Node 运行时）→ 在单个原生窗口里打开 GUI；退出时自动停掉自己启动的服务。

> 这不是 Harness 本体，只是一个启动器/窗口壳。Harness 本体仍在你的本地目录（默认 `~/Documents/DeepSeekHarness`）。

## 功能

- **一键启动**：检测 `127.0.0.1:3080` —— 空闲则自动启动服务（最长等待 40s），被占用则直接连接（不会重复起服务）
- **单窗口 GUI**：1280×840 原生窗口，深色背景，无菜单栏
- **自动清理**：退出时只停自己启动的服务，不动已存在的实例
- **性能优化**：Renderer 堆上限 1GB；关闭拼写检查/翻译/Media Router/自动播放等特性；`backgroundThrottling: false` 保持窗口始终响应；外部链接交给系统浏览器
- **调试**：`⌘⌥I` 开关 DevTools

## 使用环境 / Requirements

| 项目 | 要求 |
|---|---|
| 系统 | macOS 12+（arm64，Apple Silicon；x64 需自测） |
| Harness | 本地已有 DeepSeek Harness 检出（默认 `~/Documents/DeepSeekHarness`，含 `apps/cli/lib/bin.js` 与 `runtime/node-*/bin/node`） |
| 运行 | **无需安装 Node.js** —— 使用 Harness 自带运行时启动服务 |
| 开发/构建 | Node.js ≥ 18、npm ≥ 9；`npm install` 需网络（国内可用 npmmirror） |

## 安装使用

### 直接使用（无需构建）

构建好的 App 在仓库 Releases 下载，或本地构建（见下）。把 `DeepSeek Harness.app` 拖入「应用程序」后双击。

首次打开若被 Gatekeeper 拦截（本地 ad-hoc 签名、未公证）：**右键 → 打开 → 打开**。

### 从源码构建

```bash
npm install                 # 安装 electron + resvg（约 100MB）
npm run build:icon          # 用官方 logo 生成 AppIcon.png / AppIcon.icns（需 icon/favicon.svg）
npm run package             # 组装并签名 .app（输出到仓库根目录）
open "DeepSeek Harness.app" # 或拖到 /Applications
```

开发调试：`npm start`（直接以 Electron 运行，等价于打包后的行为）。

## 配置

首次运行自动生成 `~/Library/Application Support/DeepSeek Harness/config.json`：

```json
{
  "harnessPath": "/Users/<you>/Documents/DeepSeekHarness",
  "dshHome": null,
  "host": "127.0.0.1",
  "port": 3080
}
```

- `harnessPath` — Harness 检出目录（默认取 `~/Documents/DeepSeekHarness`）
- `dshHome` — DSH_HOME；`null` 表示 `<harnessPath>/data`
- `host` / `port` — 服务监听地址（默认 `127.0.0.1:3080`）

## 目录结构

```
dsh-harness-app/
├── main.js            Electron 主进程：窗口 + 服务管理（spawn/探测/清理）+ 性能开关
├── preload.js         安全桥（预留）
├── build-icon.js      用 @resvg/resvg-js 把 favicon.svg 渲染成 AppIcon（png + icns）
├── icon/favicon.svg   官方 DSH 标志（源自 DeepSeek Harness，MIT © 2026 DeepSeek）
├── scripts/package.sh 组装 .app：拷贝 Electron 壳、注入代码、改 Info.plist、ad-hoc 签名
└── package.json       electron / @resvg/resvg-js（devDependencies）
```

## 许可

MIT（见 LICENSE）。应用图标使用 DeepSeek Harness 的官方标志（MIT © 2026 DeepSeek）。
