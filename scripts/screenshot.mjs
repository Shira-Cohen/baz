// Headless-Chrome check for the BAZ homepage.
//
// Loads a URL at desktop, tablet and mobile sizes, records console errors,
// uncaught exceptions, CSP violations and failed / 4xx-5xx requests, and writes
// full-page PNGs. Exits with code 1 if anything was recorded.
//
// Usage:  node scripts/screenshot.mjs [url] [outDir]
//         default url http://127.0.0.1:8787/ (npm run dev), outDir ./screenshots
//         CHROME_PATH=<exe> overrides browser auto-detection.

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const url = process.argv[2] ?? "http://127.0.0.1:8787/";
const outDir = process.argv[3] ?? "screenshots";

const VIEWPORTS = [
  { name: "desktop-1440x900", width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
  { name: "tablet-834x1112", width: 834, height: 1112, deviceScaleFactor: 2, mobile: true },
  { name: "mobile-390x844", width: 390, height: 844, deviceScaleFactor: 2, mobile: true },
];

const BROWSER_CANDIDATES = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);

const browserPath = BROWSER_CANDIDATES.find((p) => existsSync(p));
if (!browserPath) {
  console.error("No Chrome/Edge found. Set CHROME_PATH to the browser executable.");
  process.exit(2);
}

/** Minimal Chrome DevTools Protocol client over the WebSocket built into Node. */
class Cdp {
  #ws;
  #nextId = 0;
  #pending = new Map();
  #listeners = new Set();

  constructor(ws) {
    this.#ws = ws;
    ws.addEventListener("message", (event) => this.#onMessage(String(event.data)));
  }

  static async connect(wsUrl) {
    const ws = new WebSocket(wsUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener("open", resolve, { once: true });
      ws.addEventListener("error", () => reject(new Error("WebSocket connection failed")), { once: true });
    });
    return new Cdp(ws);
  }

  send(method, params = {}, sessionId) {
    const id = ++this.#nextId;
    const message = { id, method, params };
    if (sessionId) message.sessionId = sessionId;
    this.#ws.send(JSON.stringify(message));
    return new Promise((resolve, reject) => this.#pending.set(id, { resolve, reject, method }));
  }

  on(listener) {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  waitFor(method, sessionId, timeoutMs = 20000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        off();
        reject(new Error(`Timed out waiting for ${method}`));
      }, timeoutMs);
      const off = this.on((msg) => {
        if (msg.method === method && msg.sessionId === sessionId) {
          clearTimeout(timer);
          off();
          resolve(msg.params);
        }
      });
    });
  }

  close() {
    this.#ws.close();
  }

  #onMessage(raw) {
    const msg = JSON.parse(raw);
    if (msg.id !== undefined) {
      const pending = this.#pending.get(msg.id);
      if (!pending) return;
      this.#pending.delete(msg.id);
      if (msg.error) pending.reject(new Error(`${pending.method}: ${msg.error.message}`));
      else pending.resolve(msg.result);
      return;
    }
    for (const listener of this.#listeners) listener(msg);
  }
}

async function waitForDevtools(port) {
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return await res.json();
    } catch {
      // not up yet
    }
    await sleep(200);
  }
  throw new Error("Chrome DevTools endpoint did not come up");
}

const port = 9300 + Math.floor(Math.random() * 400);
const profileDir = join(tmpdir(), `baz-screenshot-${process.pid}`);
mkdirSync(outDir, { recursive: true });

const browser = spawn(
  browserPath,
  [
    "--headless=new",
    `--remote-debugging-port=${port}`,
    "--remote-allow-origins=*",
    `--user-data-dir=${profileDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-gpu",
    "--hide-scrollbars",
    "--window-size=1440,900",
    "about:blank",
  ],
  { stdio: "ignore" },
);

const issues = [];
const note = (kind, detail) => issues.push({ kind, detail });
let cdp;

try {
  const { webSocketDebuggerUrl } = await waitForDevtools(port);
  cdp = await Cdp.connect(webSocketDebuggerUrl);

  const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
  const page = (method, params) => cdp.send(method, params, sessionId);

  cdp.on((msg) => {
    if (msg.sessionId !== sessionId) return;
    const p = msg.params;
    switch (msg.method) {
      case "Runtime.exceptionThrown":
        note("exception", p.exceptionDetails.exception?.description ?? p.exceptionDetails.text);
        break;
      case "Runtime.consoleAPICalled":
        if (p.type === "error" || p.type === "warning") {
          note(`console.${p.type}`, p.args.map((a) => a.value ?? a.description ?? "").join(" "));
        }
        break;
      case "Log.entryAdded":
        if (p.entry.level === "error" || p.entry.level === "warning") {
          note(`log.${p.entry.level}`, `${p.entry.text}${p.entry.url ? ` (${p.entry.url})` : ""}`);
        }
        break;
      case "Network.responseReceived":
        if (p.response.status >= 400) note("http", `${p.response.status} ${p.response.url}`);
        break;
      case "Network.loadingFailed":
        if (!p.canceled) {
          note("network", `${p.errorText}${p.blockedReason ? ` [${p.blockedReason}]` : ""} (${p.type})`);
        }
        break;
      default:
        break;
    }
  });

  await Promise.all([page("Page.enable"), page("Runtime.enable"), page("Log.enable"), page("Network.enable")]);

  for (const vp of VIEWPORTS) {
    await page("Emulation.setDeviceMetricsOverride", {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: vp.deviceScaleFactor,
      mobile: vp.mobile,
    });
    const loaded = cdp.waitFor("Page.loadEventFired", sessionId);
    await page("Page.navigate", { url });
    await loaded;
    await page("Runtime.evaluate", {
      expression: "document.fonts.ready.then(() => document.fonts.status)",
      awaitPromise: true,
    });
    await sleep(300);

    const { cssContentSize } = await page("Page.getLayoutMetrics");
    const clip = {
      x: 0,
      y: 0,
      width: Math.ceil(cssContentSize.width),
      height: Math.ceil(cssContentSize.height),
      scale: 1,
    };
    const { data } = await page("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip });
    const file = join(outDir, `${vp.name}.png`);
    writeFileSync(file, Buffer.from(data, "base64"));
    console.log(`saved ${file} (${clip.width}x${clip.height} css px)`);
  }

  try {
    await cdp.send("Browser.close");
  } catch {
    // already closing
  }
} finally {
  cdp?.close();
  browser.kill();
  await sleep(500);
  try {
    rmSync(profileDir, { recursive: true, force: true });
  } catch {
    // profile still locked by a lingering Chrome process; harmless temp dir
  }
}

if (issues.length > 0) {
  console.error(`\n${issues.length} issue(s) recorded while loading ${url}:`);
  for (const issue of issues) console.error(`- [${issue.kind}] ${issue.detail}`);
  process.exit(1);
}
console.log(`\nOK: no console errors, CSP violations, or failed requests at ${url}`);
