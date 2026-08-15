'use strict'

/**
 * DeepSeek Harness — native macOS shell.
 *
 * Double-click to run: boots the `dsh web` server (using the harness's own
 * bundled Node runtime) and opens the GUI in a single frameless-style window.
 * On quit it stops only the server it started itself.
 *
 * Config (optional): ~/Library/Application Support/DeepSeek Harness/config.json
 *   { "harnessPath": "/path/to/DeepSeekHarness", "dshHome": null,
 *     "host": "127.0.0.1", "port": 3080 }
 */

const { app, BrowserWindow, Menu, shell } = require('electron')
const { spawn } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')

/* ---- performance: keep the shell light ---- */
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=1024')
app.commandLine.appendSwitch('disable-features', 'TranslateUI,MediaRouter,AutoplayIgnoreWebAudio')

const APP_NAME = 'DeepSeek Harness'
const DEFAULT_HARNESS = path.join(os.homedir(), 'Documents', 'DeepSeekHarness')
const BOOT_TIMEOUT = 40000

let win = null
let serverChild = null
let weOwnServer = false
let quitting = false

/* ---------------- config ---------------- */

function configPath() {
  return path.join(app.getPath('userData'), 'config.json')
}

function loadConfig() {
  let disk = {}
  try { disk = JSON.parse(fs.readFileSync(configPath(), 'utf8')) } catch { /* first run */ }
  const cfg = {
    harnessPath: disk.harnessPath || DEFAULT_HARNESS,
    dshHome: disk.dshHome || null, // null → <harnessPath>/data
    host: disk.host || '127.0.0.1',
    port: Number(disk.port) || 3080,
  }
  try {
    fs.mkdirSync(path.dirname(configPath()), { recursive: true })
    if (!fs.existsSync(configPath())) fs.writeFileSync(configPath(), JSON.stringify(cfg, null, 2) + '\n')
  } catch { /* non-fatal */ }
  return cfg
}

function resolveNode(harness) {
  const bundled = path.join(harness, 'runtime', 'node-v24.14.0-darwin-arm64', 'bin', 'node')
  return fs.existsSync(bundled) ? bundled : 'node'
}

function binExists(harness) {
  return fs.existsSync(path.join(harness, 'apps', 'cli', 'lib', 'bin.js'))
}

/* ---------------- server management ---------------- */

async function portOpen(port) {
  try {
    const r = await fetch(`http://127.0.0.1:${port}/`, { signal: AbortSignal.timeout(1200) })
    return r.status < 500
  } catch { return false }
}

function startServer(cfg) {
  const node = resolveNode(cfg.harnessPath)
  const dshHome = cfg.dshHome || path.join(cfg.harnessPath, 'data')
  serverChild = spawn(
    node,
    [path.join(cfg.harnessPath, 'apps', 'cli', 'lib', 'bin.js'), '--profile', 'web', '--host', cfg.host, '--port', String(cfg.port)],
    {
      cwd: cfg.harnessPath,
      env: {
        ...process.env,
        DSH_HOME: dshHome,
        PATH: `${path.dirname(node)}:/usr/bin:/bin:/usr/sbin:/sbin`,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  )
  weOwnServer = true
  serverChild.stdout.on('data', (d) => console.log('[server]', String(d).trimEnd()))
  serverChild.stderr.on('data', (d) => console.log('[server]', String(d).trimEnd()))
  serverChild.on('exit', (code, sig) => {
    serverChild = null
    if (!quitting) console.log('[server] exited', code, sig)
  })
}

async function waitForPort(port, timeoutMs = BOOT_TIMEOUT) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    if (await portOpen(port)) return true
    await new Promise((r) => setTimeout(r, 350))
  }
  return false
}

function showMessagePage(title, body) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    body{margin:0;height:100vh;display:flex;align-items:center;justify-content:center;
         background:#0a0f1a;color:#d9f6ea;font:14px/1.8 -apple-system,'PingFang SC',sans-serif}
    .box{max-width:620px;padding:32px}
    h1{font-size:18px;color:#2ff2a4;margin:0 0 12px}
    pre{white-space:pre-wrap;color:#9fb8c9;margin:0}
  </style></head><body><div class="box"><h1>${title}</h1><pre>${body}</pre></div></body></html>`
  win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html))
}

async function boot() {
  const cfg = loadConfig()
  if (!binExists(cfg.harnessPath)) {
    showMessagePage(
      '未找到 DeepSeek Harness',
      `找不到 ${path.join(cfg.harnessPath, 'apps', 'cli', 'lib', 'bin.js')}。\n\n` +
        `请在 ${configPath()} 中设置正确的 harnessPath，然后重新打开应用。`,
    )
    return
  }
  let up = await portOpen(cfg.port)
  if (!up) {
    startServer(cfg)
    up = await waitForPort(cfg.port)
  }
  if (!up) {
    showMessagePage(
      '无法启动服务',
      `Harness 服务未能在 ${BOOT_TIMEOUT / 1000}s 内监听 127.0.0.1:${cfg.port}。\n` +
        `检查 config.json 与端口占用后重新打开应用。`,
    )
    return
  }
  win.loadURL(`http://${cfg.host}:${cfg.port}`)
}

/* ---------------- window ---------------- */

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 900,
    minHeight: 600,
    title: APP_NAME,
    backgroundColor: '#0a0f1a',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
      backgroundThrottling: false, // GUI stays responsive even when hidden briefly
    },
  })
  Menu.setApplicationMenu(null)
  win.once('ready-to-show', () => win.show())
  // dev convenience: Cmd+Option+I toggles DevTools
  win.webContents.on('before-input-event', (_e, input) => {
    if (input.type === 'keyDown' && input.meta && input.alt && input.key.toLowerCase() === 'i') {
      win.webContents.toggleDevTools()
    }
  })
  // open external links in the default browser, keep the shell lean
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url)
    return { action: 'deny' }
  })
  win.webContents.on('did-fail-load', (_e, code, desc) => {
    if (code === -3) return // aborted — ignore
    console.warn('[app] load failed', code, desc)
  })
  win.on('close', () => {
    quitting = true
    if (weOwnServer && serverChild) {
      serverChild.kill('SIGTERM')
      setTimeout(() => { if (serverChild) serverChild.kill('SIGKILL') }, 4000).unref()
    }
  })
}

app.whenReady().then(() => {
  createWindow()
  boot()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
      boot()
    }
  })
})

app.on('window-all-closed', () => app.quit())
