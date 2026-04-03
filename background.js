const MAX_LOGS = 500;

// tabId → { logs: [] }
const sessions = new Map();

// ── Message handler ──────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'START_CAPTURE') {
    startCapture(msg.tabId)
      .then(() => sendResponse({ ok: true }))
      .catch((e) => sendResponse({ ok: false, error: e.message }));
    return true; // keep channel open for async response
  }

  if (msg.type === 'GET_LOGS') {
    const session = sessions.get(msg.tabId);
    sendResponse({ logs: session ? [...session.logs] : [] });
    return true;
  }

  if (msg.type === 'STOP_CAPTURE') {
    stopCapture(msg.tabId)
      .then(() => sendResponse({ ok: true }))
      .catch(() => sendResponse({ ok: true }));
    return true;
  }

  if (msg.type === 'IS_CAPTURING') {
    sendResponse({ capturing: sessions.has(msg.tabId) });
    return true;
  }
});

// ── Debugger lifecycle ───────────────────────────────────────────────────────

async function startCapture(tabId) {
  if (sessions.has(tabId)) return; // already attached
  sessions.set(tabId, { logs: [] });
  try {
    await chrome.debugger.attach({ tabId }, '1.3');
    await chrome.debugger.sendCommand({ tabId }, 'Log.enable');
    await chrome.debugger.sendCommand({ tabId }, 'Runtime.enable');
  } catch (e) {
    sessions.delete(tabId);
    throw e;
  }
}

async function stopCapture(tabId) {
  sessions.delete(tabId);
  try {
    await chrome.debugger.detach({ tabId });
  } catch {
    // Tab may have closed or already detached
  }
}

// ── CDP event handling ───────────────────────────────────────────────────────

chrome.debugger.onEvent.addListener((source, method, params) => {
  const session = sessions.get(source.tabId);
  if (!session) return;

  let entry = null;

  if (method === 'Runtime.consoleAPICalled') {
    // JS console.log / warn / error / info / debug calls
    const message = (params.args || [])
      .map((a) => {
        if (a.value !== undefined) return String(a.value);
        if (a.description) return a.description;
        return a.type;
      })
      .join(' ');

    entry = {
      type: params.type === 'warning' ? 'warn' : params.type,
      message,
      timestamp: new Date().toISOString(),
    };
  } else if (method === 'Log.entryAdded') {
    // Browser-level: CSP violations, network errors, deprecations, etc.
    const e = params.entry;
    entry = {
      type: e.level === 'warning' ? 'warn' : e.level,
      message: e.url ? `${e.text} (${e.url})` : e.text,
      timestamp: new Date().toISOString(),
      source: e.source,
    };
  }

  if (entry) {
    if (session.logs.length >= MAX_LOGS) session.logs.shift();
    session.logs.push(entry);
  }
});

// Clean up if tab closes or debugger is detached externally
chrome.debugger.onDetach.addListener((source) => {
  sessions.delete(source.tabId);
});

chrome.tabs.onRemoved.addListener((tabId) => {
  sessions.delete(tabId);
});
