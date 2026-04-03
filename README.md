<p align="center">
  <img src="icons/icon128.png" width="96" alt="Console Grabby" />
</p>

<h1 align="center">Console Grabby</h1>

<p align="center">
  A tiny Chrome extension that captures console logs — including CSP violations and browser-level errors — and copies them to your clipboard in one click.
</p>

---

## How it works

1. **Click Grab** — attaches a debugger to the active tab and starts listening
2. **Click again** — copies all captured logs to clipboard and detaches

That's it.

## What it captures

- `console.log`, `console.warn`, `console.error` from page JS
- Browser-level errors: CSP violations, network failures, deprecation warnings
- Everything you see in DevTools → Console

## Install (Developer Mode)

1. Clone or download this repo
2. Go to `chrome://extensions`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** → select the `console-grabby` folder
5. Pin it to your toolbar

## Output format

```
[ERROR:security] 2026-04-03T13:38:26.938Z
Connecting to 'https://...' violates Content Security Policy...

[LOG] 2026-04-03T13:38:27.012Z
Navigation listeners online

[WARN:other] 2026-04-03T13:38:27.201Z
<meta name="apple-mobile-web-app-capable"> is deprecated...
```

## Built with

- Manifest V3
- Chrome Debugger API (`chrome.debugger`)
- Chrome DevTools Protocol — `Runtime.consoleAPICalled` + `Log.entryAdded`
- Zero dependencies, no frameworks

---

<p align="center">Made with 🖐️ for vibe coders who need to debug fast</p>
