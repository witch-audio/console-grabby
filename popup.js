const btn = document.getElementById('grab-btn');
const status = document.getElementById('status');
const logCount = document.getElementById('log-count');

let state = 'off';
let activeTabId = null;
let logInterval = null;

const setState = (newState) => {
  state = newState;
  btn.className = `state-${newState}`;

  if (newState === 'off') {
    btn.textContent = '🖐️ Grab';
    status.textContent = 'Click to start capturing';
    status.className = '';
    logCount.textContent = '';
    clearInterval(logInterval);
    logInterval = null;
  } else if (newState === 'on') {
    btn.textContent = '🖐️ Grabbing...';
    status.textContent = 'Listening to console...';
    status.className = 'active';
    startPolling();
  } else if (newState === 'copied') {
    btn.textContent = '✅ Copied!';
    status.textContent = 'Logs copied to clipboard';
    status.className = 'success';
    clearInterval(logInterval);
    logInterval = null;
    setTimeout(() => setState('off'), 1800);
  }
};

const send = (msg) =>
  new Promise((resolve) => chrome.runtime.sendMessage(msg, resolve));

const formatLogs = (logs) => {
  if (!logs || logs.length === 0) return 'No logs captured';
  return logs
    .map((e) => {
      const prefix = e.source ? `[${e.type.toUpperCase()}:${e.source}]` : `[${e.type.toUpperCase()}]`;
      return `${prefix} ${e.timestamp}\n${e.message}`;
    })
    .join('\n\n');
};

const startPolling = () => {
  logInterval = setInterval(async () => {
    if (!activeTabId) return;
    const { logs } = await send({ type: 'GET_LOGS', tabId: activeTabId });
    const count = logs.length;
    logCount.textContent = count > 0 ? `${count} log${count === 1 ? '' : 's'} captured` : '';
  }, 800);
};

btn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  if (state === 'off') {
    activeTabId = tab.id;
    const res = await send({ type: 'START_CAPTURE', tabId: tab.id });
    if (!res?.ok) {
      status.textContent = `Failed: ${res?.error ?? 'unknown error'}`;
      status.className = 'warn';
      return;
    }
    setState('on');

  } else if (state === 'on') {
    const { logs } = await send({ type: 'GET_LOGS', tabId: activeTabId });
    const text = formatLogs(logs);

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }

    await send({ type: 'STOP_CAPTURE', tabId: activeTabId });
    activeTabId = null;
    setState('copied');
  }
});
