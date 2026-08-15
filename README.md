<div align="center">

<img src="assets/mascot.svg" width="170" alt="DeepSeek 娘 mascot" />

# DeepSeek Harness for macOS

**DeepSeek Harness 的 macOS 原生桌面壳** · Native macOS app shell for the DeepSeek Harness

> 🐋 **DeepSeek 娘** 陪你看守 Harness —— 双击启动，其余交给她。

双击启动 → 自动拉起 `dsh web` 服务 → 在单个优化过的原生窗口中打开 GUI，退出自动清理。
Double-click to boot the dsh web server and open the GUI in one optimized window.

[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-macOS%2012%2B-black.svg)](#使用环境--requirements)
[![Electron](https://img.shields.io/badge/Electron-43-blue.svg)](package.json)
[![CI](https://github.com/TonglinyangZeus/DeepseekHarness4MacOs/actions/workflows/ci.yml/badge.svg)](https://github.com/TonglinyangZeus/DeepseekHarness4MacOs/actions/workflows/ci.yml)
[![Release](https://img.shields.io/badge/release-v1.0.0-orange.svg)](https://github.com/TonglinyangZeus/DeepseekHarness4MacOs/releases)

</div>

> ⚠️ 这不是 Harness 本体，只是一个**启动器 / 窗口壳**。Harness 本体仍在你本地目录（默认 `~/Documents/DeepSeekHarness`）。
> This is a launcher shell — the Harness itself stays in your local checkout.

---

## ✨ 功能 Features

| | 中文 | English |
|---|---|---|
| 🚀 | **一键启动**：检测 `127.0.0.1:3080`，空闲则自动启动服务（最长等 40s），被占用则直接连接，绝不重复起服务 | Detects port 3080: spawns the server when free, connects when already running — never duplicates |
| 🪟 | **单窗口 GUI**：1280×840 原生窗口、深色背景、无菜单栏 | Single native window, dark UI, no menu bar |
| 🧹 | **自动清理**：退出只停自己启动的服务，不动已有实例 | Kills only the server it started |
| ⚡ | **性能优化**：渲染堆上限 1GB、关闭拼写检查/翻译/媒体路由、窗口始终响应、外链交给系统浏览器 | Renderer heap cap, heavy features off, window stays responsive, external links open in the browser |
| 🔧 | **调试**：`⌘⌥I` 开关 DevTools | Cmd+Option+I toggles DevTools |

## 📋 使用环境 Requirements

| 项目 | 要求 |
|---|---|
| 系统 OS | macOS 12+（arm64 / Apple Silicon；x64 需自测） |
| Harness | 本地 DeepSeek Harness 检出（默认 `~/Documents/DeepSeekHarness`，含 `apps/cli/lib/bin.js` 与自带 Node 运行时） |
| 运行 Runtime | **无需安装 Node.js** —— 服务用 Harness 自带运行时启动 |
| 构建 Build | Node.js ≥ 18、npm ≥ 9（国内可用 npmmirror 镜像） |

## 📥 安装使用 Install

### 直接使用（下载 Releases）

从 [Releases](https://github.com/TonglinyangZeus/DeepseekHarness4MacOs/releases) 下载 `DeepSeek-Harness-macOS-arm64.zip`，解压后把 `DeepSeek Harness.app` 拖入「应用程序」。

> 本地 ad-hoc 签名、未公证：首次打开若被 Gatekeeper 拦截，**右键 → 打开 → 打开** 即可。

### 从源码构建 From source

```bash
npm install            # electron + resvg（约 100MB）
npm run build:icon     # 用官方 logo 生成 AppIcon（png + icns）
npm run package        # 组装 + ad-hoc 签名，输出 DeepSeek Harness.app
open "DeepSeek Harness.app"
```

开发调试：`npm start`（以 Electron 直接运行，行为与打包版一致）。

## ⚙️ 配置 Config

首次运行自动生成 `~/Library/Application Support/DeepSeek Harness/config.json`：

```json
{
  "harnessPath": "/Users/<you>/Documents/DeepSeekHarness",
  "dshHome": null,
  "host": "127.0.0.1",
  "port": 3080
}
```

- `harnessPath` — Harness 检出目录（默认 `~/Documents/DeepSeekHarness`）
- `dshHome` — `DSH_HOME`；`null` 表示 `<harnessPath>/data`
- `host` / `port` — 服务监听地址

## ⚡ 性能优化 Performance

- `--max-old-space-size=1024` 限制渲染进程堆内存，避免长期运行膨胀
- 关闭 `TranslateUI` / `MediaRouter` / 拼写检查 / 自动播放等非必要特性
- `backgroundThrottling: false` —— GUI 始终响应
- 外部链接一律交给系统浏览器，壳保持轻量
- 端口探测防重复实例，不浪费资源跑第二个服务

## 🚀 自动打包 Auto-release

推送 `v*` 标签即触发 GitHub Actions 在 macOS runner 上自动构建并发布：

```bash
git tag v1.0.0
git push origin v1.0.0
```

工作流（`.github/workflows/release.yml`）：`npm ci → build:icon → package → ditto 压缩 → 挂到 Releases`。
`.github/workflows/ci.yml` 在每次 push/PR 时做语法检查 + 图标流水线校验。

## 📁 目录结构 Structure

```
dsh-harness-app/
├── main.js              Electron 主进程：窗口 + 服务管理（spawn/探测/清理）+ 性能开关
├── preload.js           安全桥（预留）
├── build-icon.js        用 @resvg/resvg-js 把 favicon.svg 渲染成 AppIcon（png + icns）
├── icon/favicon.svg     官方 DSH 标志（源自 DeepSeek Harness，MIT © 2026 DeepSeek）
├── scripts/package.sh   组装 .app：拷贝 Electron 壳、注入代码、改 Info.plist、ad-hoc 签名
├── .github/workflows/   CI 校验 + 打 tag 自动打包发布
└── package.json         electron / @resvg/resvg-js（devDependencies）
```

## 📜 许可 License

MIT（见 [LICENSE](LICENSE)）。应用图标使用 DeepSeek Harness 官方标志（MIT © 2026 DeepSeek）。
