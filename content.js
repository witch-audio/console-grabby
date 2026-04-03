(() => {
  if (window.__consoleGrabbyInjected) return;
  window.__consoleGrabbyInjected = true;

  const MAX_LOGS = 500;
  window.__consoleGrabbyLogs = window.__consoleGrabbyLogs || [];

  const safeStringify = (arg) => {
    if (arg === null) return 'null';
    if (arg === undefined) return 'undefined';
    if (typeof arg === 'string') return arg;
    if (typeof arg === 'number' || typeof arg === 'boolean') return String(arg);
    try {
      return JSON.stringify(arg, null, 2);
    } catch {
      return String(arg);
    }
  };

  const intercept = (type, original) => {
    return function (...args) {
      if (window.__consoleGrabbyLogs.length < MAX_LOGS) {
        window.__consoleGrabbyLogs.push({
          type,
          message: args.map(safeStringify).join(' '),
          timestamp: new Date().toISOString(),
        });
      }
      return original.apply(console, args);
    };
  };

  if (typeof console !== 'undefined') {
    console.log = intercept('log', console.log.bind(console));
    console.warn = intercept('warn', console.warn.bind(console));
    console.error = intercept('error', console.error.bind(console));
  }

  window.__consoleGrabbyGetLogs = () => {
    return [...window.__consoleGrabbyLogs];
  };

  window.__consoleGrabbyClearLogs = () => {
    window.__consoleGrabbyLogs = [];
  };
})();
